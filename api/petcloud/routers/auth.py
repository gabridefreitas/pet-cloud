from fastapi import APIRouter

from petcloud.dependencies import Authenticated
from petcloud.schemas import LoginInput, RegisterInput, TokenResponse, User
from petcloud.services import auth

router=APIRouter(prefix='/auth',tags=['Authentication'])
@router.post('/register',response_model=TokenResponse,status_code=201)
def register(data:RegisterInput): return auth.register(data)
@router.post('/login',response_model=TokenResponse)
def login(data:LoginInput): return auth.login(data)
@router.get('/me',response_model=User)
def me(user:Authenticated): return auth.public_user(user)
