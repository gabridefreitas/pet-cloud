from datetime import UTC, datetime, timedelta

import jwt
import psycopg
from fastapi import HTTPException
from pwdlib import PasswordHash

from petcloud.config import get_settings
from petcloud.services.database import connect

password_hash=PasswordHash.recommended()
def public_user(row):
    return {k:row.get(k) for k in ('id','email','full_name','phone','role','organization_id','city','state','created_at','updated_at')}
def token_for(user):
    settings=get_settings(); now=datetime.now(UTC)
    token=jwt.encode({'sub':str(user['id']),'iat':now,'exp':now+timedelta(minutes=settings.jwt_exp_minutes)},settings.jwt_secret,algorithm='HS256')
    return {'access_token':token,'token_type':'bearer'}
def register(data):
    try:
        with connect() as conn:
            user = conn.execute(
                "INSERT INTO users(email,password_hash,full_name,role) "
                "VALUES (%s,%s,%s,'adopter') RETURNING *",
                (data.email.lower(), password_hash.hash(data.password), data.full_name.strip())
            ).fetchone()
    except psycopg.errors.UniqueViolation:
        raise HTTPException(409, 'An account with this email already exists.') from None
    return token_for(user)


def login(data):
    with connect() as conn:
        user=conn.execute('SELECT * FROM users WHERE lower(email)=lower(%s)',(data.email,)).fetchone()
    if not user or not password_hash.verify(data.password,user['password_hash']):
        raise HTTPException(401,'Email or password is incorrect.')
    return token_for(user)
