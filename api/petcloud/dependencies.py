
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from petcloud.config import get_settings
from petcloud.services.database import connect


settings = get_settings()

# Registra a autenticação Bearer no OpenAPI/Swagger
bearer_scheme = HTTPBearer(auto_error=False)


def current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme)
    ] = None
):
    if not credentials or credentials.scheme.lower() != 'bearer':
        raise HTTPException(
            status_code=401,
            detail='Authentication required.'
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=['HS256']
        )

        user_id = UUID(payload['sub'])

    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(
            status_code=401,
            detail='Invalid or expired access token.'
        ) from None

    with connect() as conn:
        user = conn.execute(
            'SELECT * FROM users WHERE id=%s',
            (user_id,)
        ).fetchone()

    if not user:
        raise HTTPException(
            status_code=401,
            detail='User not found.'
        )

    return user


def require_role(role: str):
    def dependency(user=Depends(current_user)):
        # Administrador tem acesso a todas as permissões.
        if user['role'] == 'admin':
            return user

        if user['role'] != role:
            raise HTTPException(
                status_code=403,
                detail='You do not have permission to perform this action.'
            )

        return user

    return dependency

def require_roles(*roles: str):
    def dependency(user=Depends(current_user)):
        # Administrador tem acesso a todas as permissões.
        if user['role'] == 'admin':
            return user

        if user['role'] not in roles:
            raise HTTPException(
                status_code=403,
                detail='You do not have permission to perform this action.'
            )

        return user

    return dependency


Authenticated = Annotated[dict, Depends(current_user)]
Adopter = Annotated[dict, Depends(require_role('adopter'))]
OrganizationMember = Annotated[dict, Depends(require_role('organization_member'))]
Admin = Annotated[dict, Depends(require_role('admin'))]

AdminOrOrganizationMember = Annotated[
    dict,
    Depends(require_roles('admin', 'organization_member'))
]