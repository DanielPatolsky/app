from fastapi import APIRouter, Depends
from app.models.user import UserRegister, UserLogin, User, TokenResponse
from app.services.auth_service import register_user, login_user
from app.core.security import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserRegister) -> TokenResponse:
    """Registrar un nuevo usuario"""
    return await register_user(user_data)

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin) -> TokenResponse:
    """Autenticar usuario"""
    return await login_user(credentials)

@router.get("/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)) -> User:
    """Obtener información del usuario autenticado"""
    return User(**current_user)
