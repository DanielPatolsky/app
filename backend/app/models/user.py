from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional

class UserRegister(BaseModel):
    """Modelo para registrar un nuevo usuario"""
    email: EmailStr
    password: str
    nombre: str

class UserLogin(BaseModel):
    """Modelo para login de usuario"""
    email: EmailStr
    password: str

class User(BaseModel):
    """Modelo de usuario para respuestas"""
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    nombre: str

class TokenResponse(BaseModel):
    """Modelo de respuesta con token"""
    token: str
    user: User
