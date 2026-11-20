import boto3
from fastapi import HTTPException
from petcloud.config import get_settings

def photos_for(conn, pet_id):
    settings = get_settings()
    rows = conn.execute('SELECT * FROM pet_photos WHERE pet_id=%s ORDER BY position,id', (pet_id,)).fetchall()
    result=[]
    for row in rows:
        url = boto3.client('s3', region_name=settings.aws_region).generate_presigned_url(
            'get_object', Params={'Bucket': settings.s3_bucket, 'Key': row['s3_key']}, ExpiresIn=3600
        ) if settings.s3_bucket else ''
        result.append({**row, 'url': url})
    return result

def pet_dict(conn, row):
    return {**row, 'photos': photos_for(conn, row['id'])}

def organization_dict(row):
    return {**row, 'logo_url': None}

def pet_details(conn, row):
    organization = None

    if row['organization_id']:
        org = conn.execute(
            'SELECT * FROM organizations WHERE id=%s',
            (row['organization_id'],)
        ).fetchone()

        if org:
            organization = organization_dict(org)

    return {
        **pet_dict(conn, row),
        'organization': organization
    }

def adoption_details(conn,row):
    pet=conn.execute('SELECT * FROM pets WHERE id=%s',(row['pet_id'],)).fetchone()
    adopter=conn.execute('SELECT * FROM users WHERE id=%s',(row['adopter_id'],)).fetchone()
    return {**row,'pet':pet_dict(conn,pet),'adopter':{k:adopter.get(k) for k in ('id','full_name','email','phone','city','state')}}

def ensure_s3():
    settings=get_settings()
    if not settings.s3_bucket:
        raise HTTPException(status_code=503, detail='Pet photo storage is not configured.')
    return boto3.client('s3',region_name=settings.aws_region), settings
