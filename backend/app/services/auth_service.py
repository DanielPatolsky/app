import uuid
from datetime import datetime, timezone
from fastapi import HTTPException, status
from app.models.user import UserRegister, UserLogin, User, TokenResponse
from app.core.security import hash_password, verify_password, create_token, db

async def register_user(user_data: UserRegister) -> TokenResponse:
    """Registrar un nuevo usuario"""
    # Verificar si el email ya existe
    existing = await db.users.find_one({'email': user_data.email}, {'_id': 0})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Crear nuevo usuario
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(user_data.password)
    
    user_doc = {
        'id': user_id,
        'email': user_data.email,
        'password': hashed_pw,
        'nombre': user_data.nombre,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Generar token
    token = create_token(user_id)
    
    return TokenResponse(
        token=token,
        user=User(id=user_id, email=user_data.email, nombre=user_data.nombre)
    )

async def login_user(credentials: UserLogin) -> TokenResponse:
    """Autenticar usuario y retornar token"""
    # Buscar usuario por email
    user = await db.users.find_one({'email': credentials.email}, {'_id': 0})
    
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )
    
    # Generar token
    token = create_token(user['id'])
    
    return TokenResponse(
        token=token,
        user=User(id=user['id'], email=user['email'], nombre=user['nombre'])
    )
