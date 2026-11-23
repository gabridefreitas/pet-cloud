
import hashlib
import logging

import psycopg
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException, UploadFile
from psycopg.pq import TransactionStatus

from petcloud.services.common import ensure_s3, pet_details, pet_dict
from petcloud.services.database import connect


def _get_accessible_pet(conn, pet_id, user, *, lock=False):
    row = conn.execute(
        'SELECT * FROM pets WHERE id=%s AND organization_id=%s' + (' FOR UPDATE' if lock else ''),
        (pet_id, user['organization_id'])
    ).fetchone()
    if not row:
        logger.warning('access_denied', extra={
            'event': 'access_denied', 'reason': 'pet_not_accessible',
            'user_id': str(user['id']), 'organization_id': str(user['organization_id']),
        })
        raise HTTPException(404, 'Pet not found.')
    return row


def list_pets(
    species=None,
    location=None,
    size=None,
    breed=None,
    color=None,
    sex=None,
    age=None,
    status='available',
    page=1,
    page_size=9
):
    clauses = ['p.status=%s']
    params = [status]

    for field, value in (('species', species), ('sex', sex)):
        if value:
            clauses.append(f'p.{field}=%s')
            params.append(value)

    if location:
        clauses.append('(p.city ILIKE %s OR p.state ILIKE %s)')
        params.extend([f'%{location}%', f'%{location}%'])

    for field, values in (
        ('size', size),
        ('breed', breed),
        ('color', color)
    ):
        if values:
            clauses.append(f'p.{field}=ANY(%s)')
            params.append(values)

    age_parts = []

    for group in age or []:
        bound = {
            'baby': 'p.age_months < 12',
            'young': 'p.age_months BETWEEN 12 AND 35',
            'adult': 'p.age_months BETWEEN 36 AND 95',
            'senior': 'p.age_months >= 96'
        }.get(group)

        if bound:
            age_parts.append(bound)

    if age_parts:
        clauses.append('(' + ' OR '.join(age_parts) + ')')

    where = ' AND '.join(clauses)

    with connect() as conn:
        total = conn.execute(
            f'SELECT count(*) AS total FROM pets p WHERE {where}',
            params
        ).fetchone()['total']

        rows = conn.execute(
            f'''
            SELECT p.*
            FROM pets p
            WHERE {where}
            ORDER BY p.created_at DESC, p.id DESC
            LIMIT %s OFFSET %s
            ''',
            [*params, page_size, (page - 1) * page_size]
        ).fetchall()

        return {
            'items': [pet_dict(conn, row) for row in rows],
            'total': total,
            'page': page,
            'page_size': page_size
        }


def get_pet(pet_id):
    with connect() as conn:
        row = conn.execute(
            'SELECT * FROM pets WHERE id=%s',
            (pet_id,)
        ).fetchone()

        if not row:
            raise HTTPException(404, 'Pet not found.')

        return pet_details(conn, row)


def organization_pets(user):
    with connect() as conn:
        rows = conn.execute(
            'SELECT * FROM pets WHERE organization_id=%s ORDER BY created_at DESC',
            (user['organization_id'],)
        ).fetchall()

        return [pet_dict(conn, row) for row in rows]


def create_pet(data, user):
    payload = data.model_dump()

    payload['organization_id'] = user['organization_id']

    with connect() as conn:
        row = conn.execute(
            '''
            INSERT INTO pets(
                organization_id,
                name,
                species,
                breed,
                sex,
                age_months,
                size,
                color,
                description,
                health_notes,
                is_vaccinated,
                is_neutered,
                status,
                city,
                state,
                country
            )
            VALUES (
                %(organization_id)s,
                %(name)s,
                %(species)s,
                %(breed)s,
                %(sex)s,
                %(age_months)s,
                %(size)s,
                %(color)s,
                %(description)s,
                %(health_notes)s,
                %(is_vaccinated)s,
                %(is_neutered)s,
                %(status)s,
                %(city)s,
                %(state)s,
                %(country)s
            )
            RETURNING *
            ''',
            payload
        ).fetchone()

        return pet_dict(conn, row)

def update_pet(pet_id, data, user):
    with connect() as conn:
        _get_accessible_pet(conn, pet_id, user)

        row = conn.execute(
            '''
            UPDATE pets
            SET status=%s, updated_at=now()
            WHERE id=%s
            RETURNING *
            ''',
            (data.status, pet_id)
        ).fetchone()

        return pet_dict(conn, row)


PHOTO_MAX_BYTES = 5 * 1024 * 1024
PHOTO_EXTENSIONS = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'}
logger = logging.getLogger('petcloud.photos')


def upload_photo(pet_id, photo: UploadFile, user):
    # Check ownership before accessing storage or reading the uploaded file.
    with connect() as conn:
        _get_accessible_pet(conn, pet_id, user)

    content_type = photo.content_type
    if content_type not in PHOTO_EXTENSIONS:
        raise HTTPException(415, 'Photo must be JPEG, PNG or WebP.')
    content = photo.file.read(PHOTO_MAX_BYTES + 1)
    if len(content) > PHOTO_MAX_BYTES:
        raise HTTPException(413, 'Photo must be at most 5 MB.')
    if not content:
        raise HTTPException(400, 'Photo must not be empty.')
    matches_type = {
        'image/jpeg': content.startswith(b'\xff\xd8\xff'),
        'image/png': content.startswith(b'\x89PNG\r\n\x1a\n'),
        'image/webp': content.startswith(b'RIFF') and content[8:12] == b'WEBP',
    }
    if not matches_type[content_type]:
        raise HTTPException(400, 'Photo content does not match its image type.')

    # A stable per-pet key makes retrying the same file reuse the existing photo.
    digest = hashlib.sha256(content).hexdigest()
    key = f'pets/{pet_id}/{digest}.{PHOTO_EXTENSIONS[content_type]}'
    try:
        client, settings = ensure_s3()
        url = client.generate_presigned_url(
            'get_object', Params={'Bucket': settings.s3_bucket, 'Key': key}, ExpiresIn=3600,
        )
        with connect() as conn:
            # Serialize uploads for this pet to enforce the five-photo limit.
            _get_accessible_pet(conn, pet_id, user, lock=True)
            row = conn.execute(
                'SELECT * FROM pet_photos WHERE pet_id=%s AND s3_key=%s',
                (pet_id, key),
            ).fetchone()
            if not row:
                count = conn.execute(
                    'SELECT count(*) AS n FROM pet_photos WHERE pet_id=%s', (pet_id,)
                ).fetchone()['n']
                if count >= 5:
                    raise HTTPException(409, 'A pet can have at most five photos.')
                client.put_object(
                    Bucket=settings.s3_bucket, Key=key, Body=content, ContentType=content_type,
                )
                try:
                    # A savepoint keeps the outer pet lock if insertion fails.
                    with conn.transaction():
                        row = conn.execute(
                            'INSERT INTO pet_photos(pet_id,s3_key,is_primary,position) '
                            'VALUES (%s,%s,%s,%s) RETURNING *',
                            (pet_id, key, count == 0, count),
                        ).fetchone()
                except psycopg.Error:
                    # Only compensate while the lock is known to be held. An
                    # uncertain connection/commit must not delete a retry's object.
                    if conn.info.transaction_status == TransactionStatus.INTRANS:
                        try:
                            client.delete_object(Bucket=settings.s3_bucket, Key=key)
                        except (BotoCoreError, ClientError):
                            logger.exception('photo_upload_cleanup_failed')
                    raise
        return {**row, 'url': url}
    except (BotoCoreError, ClientError, psycopg.Error):
        logger.exception('photo_upload_failed')
        raise HTTPException(503, 'Photo could not be saved. Please try again.') from None
