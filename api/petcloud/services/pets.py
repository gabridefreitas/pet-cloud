
import re
from uuid import uuid4

from fastapi import HTTPException

from petcloud.services.database import connect
from petcloud.services.common import pet_dict, pet_details, ensure_s3


def _is_admin(user):
    return user['role'] == 'admin'


def _get_accessible_pet(conn, pet_id, user):
    """
    Admin pode acessar qualquer pet.
    Organization member só pode acessar pets da própria ONG.
    """
    if _is_admin(user):
        row = conn.execute(
            'SELECT * FROM pets WHERE id=%s',
            (pet_id,)
        ).fetchone()
    else:
        organization_id = user['organization_id']

        if not organization_id:
            raise HTTPException(
                status_code=403,
                detail='User is not associated with an organization.'
            )

        row = conn.execute(
            'SELECT * FROM pets WHERE id=%s AND organization_id=%s',
            (pet_id, organization_id)
        ).fetchone()

    if not row:
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
            ORDER BY p.created_at DESC
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
        if _is_admin(user):
            rows = conn.execute(
                'SELECT * FROM pets ORDER BY created_at DESC'
            ).fetchall()
        else:
            organization_id = user['organization_id']

            if not organization_id:
                raise HTTPException(
                    status_code=403,
                    detail='User is not associated with an organization.'
                )

            rows = conn.execute(
                '''
                SELECT *
                FROM pets
                WHERE organization_id=%s
                ORDER BY created_at DESC
                ''',
                (organization_id,)
            ).fetchall()

        return [pet_dict(conn, row) for row in rows]


def create_pet(data, user):
    payload = data.model_dump()

    if _is_admin(user):
        # Para administrador, a organização é opcional.
        organization_id = payload.get('organization_id')
    else:
        # Para membro, utiliza automaticamente sua própria ONG.
        organization_id = user['organization_id']

        if not organization_id:
            raise HTTPException(
                status_code=403,
                detail='User is not associated with an organization.'
            )

    with connect() as conn:

        # Só valida a organização quando ela foi informada.
        if organization_id:
            organization = conn.execute(
                'SELECT id FROM organizations WHERE id=%s',
                (organization_id,)
            ).fetchone()

            if not organization:
                raise HTTPException(
                    404,
                    'Organization not found.'
                )

        payload['organization_id'] = organization_id

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


def photo_upload_url(pet_id, data, user):
    # Verifica a permissão antes de gerar a URL do S3.
    with connect() as conn:
        _get_accessible_pet(conn, pet_id, user)

    client, settings = ensure_s3()

    name = re.sub(
        r'[^a-zA-Z0-9._-]',
        '_',
        data.filename
    )[:120]

    key = f'pets/{pet_id}/{uuid4()}-{name}'

    url = client.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': settings.s3_bucket,
            'Key': key,
            'ContentType': data.content_type
        },
        ExpiresIn=600
    )

    return {
        'upload_url': url,
        's3_key': key,
        'expires_in': 600
    }


def register_photo(pet_id, data, user):
    if not data.s3_key.startswith(f'pets/{pet_id}/'):
        raise HTTPException(
            400,
            'Invalid photo object key.'
        )

    # Verifica se o usuário pode gerenciar esse pet.
    with connect() as conn:
        _get_accessible_pet(conn, pet_id, user)

    client, settings = ensure_s3()

    try:
        obj = client.head_object(
            Bucket=settings.s3_bucket,
            Key=data.s3_key
        )

        if (
            obj['ContentLength'] > 5 * 1024 * 1024
            or obj.get('ContentType') not in (
                'image/jpeg',
                'image/png',
                'image/webp'
            )
        ):
            client.delete_object(
                Bucket=settings.s3_bucket,
                Key=data.s3_key
            )

            raise HTTPException(
                400,
                'Photo must be JPEG, PNG or WebP and at most 5 MB.'
            )

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            400,
            'Uploaded photo could not be verified.'
        ) from None

    with connect() as conn:
        _get_accessible_pet(conn, pet_id, user)

        count = conn.execute(
            'SELECT count(*) AS n FROM pet_photos WHERE pet_id=%s',
            (pet_id,)
        ).fetchone()['n']

        if count >= 5:
            client.delete_object(
                Bucket=settings.s3_bucket,
                Key=data.s3_key
            )

            raise HTTPException(
                409,
                'A pet can have at most five photos.'
            )

        row = conn.execute(
            '''
            INSERT INTO pet_photos(
                pet_id,
                s3_key,
                is_primary,
                position
            )
            VALUES (%s, %s, %s, %s)
            RETURNING *
            ''',
            (pet_id, data.s3_key, count == 0, count)
        ).fetchone()

        url = client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.s3_bucket,
                'Key': data.s3_key
            },
            ExpiresIn=3600
        )

        return {
            **row,
            'url': url
        }
