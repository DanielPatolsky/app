from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ============ MODELS ============

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    nombre: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    nombre: str

class TokenResponse(BaseModel):
    token: str
    user: User

class SocioCreate(BaseModel):
    nombre: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None

class Socio(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    socio_id: str
    nombre: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    fecha_registro: str
    estado: str
    fecha_vencimiento: Optional[str] = None

class PagoCreate(BaseModel):
    socio_id: str
    monto: float
    tipo_plan: str
    metodo_pago: Optional[str] = "Efectivo"

class Pago(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    socio_id: str
    monto: float
    tipo_plan: str
    metodo_pago: str
    fecha_pago: str
    fecha_vencimiento: str

class DashboardStats(BaseModel):
    total_socios: int
    socios_activos: int
    socios_vencidos: int
    ingresos_mes: float
    proximos_vencimientos: List[dict]

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        user = await db.users.find_one({'id': user_id}, {'_id': 0, 'password': 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# ============ HELPER FUNCTIONS ============

def calcular_fecha_vencimiento(tipo_plan: str, fecha_base: datetime) -> datetime:
    if tipo_plan == 'mensual':
        return fecha_base + timedelta(days=30)
    elif tipo_plan == 'trimestral':
        return fecha_base + timedelta(days=90)
    elif tipo_plan == 'semestral':
        return fecha_base + timedelta(days=180)
    elif tipo_plan == 'anual':
        return fecha_base + timedelta(days=365)
    else:
        return fecha_base + timedelta(days=30)

async def actualizar_estado_socio(socio_id: str):
    ultimo_pago = await db.pagos.find_one(
        {'socio_id': socio_id},
        {'_id': 0},
        sort=[('fecha_vencimiento', -1)]
    )
    
    if ultimo_pago:
        fecha_venc = datetime.fromisoformat(ultimo_pago['fecha_vencimiento'])
        estado = 'activo' if fecha_venc >= datetime.now(timezone.utc) else 'vencido'
        await db.socios.update_one(
            {'socio_id': socio_id},
            {'$set': {
                'estado': estado,
                'fecha_vencimiento': ultimo_pago['fecha_vencimiento']
            }}
        )
    else:
        await db.socios.update_one(
            {'socio_id': socio_id},
            {'$set': {'estado': 'vencido', 'fecha_vencimiento': None}}
        )

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    existing = await db.users.find_one({'email': user_data.email}, {'_id': 0})
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
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
    
    token = create_token(user_id)
    user_obj = User(id=user_id, email=user_data.email, nombre=user_data.nombre)
    
    return TokenResponse(token=token, user=user_obj)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({'email': credentials.email}, {'_id': 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    token = create_token(user['id'])
    user_obj = User(id=user['id'], email=user['email'], nombre=user['nombre'])
    
    return TokenResponse(token=token, user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

# ============ SOCIOS ROUTES ============

@api_router.post("/socios", response_model=Socio)
async def crear_socio(socio_data: SocioCreate, current_user: dict = Depends(get_current_user)):
    count = await db.socios.count_documents({})
    socio_id = f"GYM-{count + 1:04d}"
    
    socio_doc = {
        'id': str(uuid.uuid4()),
        'socio_id': socio_id,
        'nombre': socio_data.nombre,
        'email': socio_data.email,
        'telefono': socio_data.telefono,
        'direccion': socio_data.direccion,
        'fecha_registro': datetime.now(timezone.utc).isoformat(),
        'estado': 'vencido',
        'fecha_vencimiento': None
    }
    
    await db.socios.insert_one(socio_doc)
    socio_doc.pop('_id', None)
    
    return Socio(**socio_doc)

@api_router.get("/socios", response_model=List[Socio])
async def listar_socios(current_user: dict = Depends(get_current_user)):
    socios = await db.socios.find({}, {'_id': 0}).sort('fecha_registro', -1).to_list(1000)
    return [Socio(**s) for s in socios]

@api_router.get("/socios/{socio_id}", response_model=Socio)
async def obtener_socio(socio_id: str, current_user: dict = Depends(get_current_user)):
    socio = await db.socios.find_one({'socio_id': socio_id}, {'_id': 0})
    if not socio:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    return Socio(**socio)

@api_router.put("/socios/{socio_id}", response_model=Socio)
async def actualizar_socio(socio_id: str, socio_data: SocioCreate, current_user: dict = Depends(get_current_user)):
    result = await db.socios.update_one(
        {'socio_id': socio_id},
        {'$set': socio_data.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    
    socio = await db.socios.find_one({'socio_id': socio_id}, {'_id': 0})
    return Socio(**socio)

@api_router.delete("/socios/{socio_id}")
async def eliminar_socio(socio_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.socios.delete_one({'socio_id': socio_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    
    await db.pagos.delete_many({'socio_id': socio_id})
    
    return {'message': 'Socio eliminado correctamente'}

# ============ PAGOS ROUTES ============

@api_router.post("/pagos", response_model=Pago)
async def registrar_pago(pago_data: PagoCreate, current_user: dict = Depends(get_current_user)):
    socio = await db.socios.find_one({'socio_id': pago_data.socio_id}, {'_id': 0})
    if not socio:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    
    fecha_pago = datetime.now(timezone.utc)
    fecha_vencimiento = calcular_fecha_vencimiento(pago_data.tipo_plan, fecha_pago)
    
    pago_doc = {
        'id': str(uuid.uuid4()),
        'socio_id': pago_data.socio_id,
        'monto': pago_data.monto,
        'tipo_plan': pago_data.tipo_plan,
        'metodo_pago': pago_data.metodo_pago,
        'fecha_pago': fecha_pago.isoformat(),
        'fecha_vencimiento': fecha_vencimiento.isoformat()
    }
    
    await db.pagos.insert_one(pago_doc)
    await actualizar_estado_socio(pago_data.socio_id)
    
    pago_doc.pop('_id', None)
    return Pago(**pago_doc)

@api_router.get("/pagos", response_model=List[Pago])
async def listar_pagos(current_user: dict = Depends(get_current_user)):
    pagos = await db.pagos.find({}, {'_id': 0}).sort('fecha_pago', -1).to_list(1000)
    return [Pago(**p) for p in pagos]

@api_router.get("/pagos/socio/{socio_id}", response_model=List[Pago])
async def obtener_pagos_socio(socio_id: str, current_user: dict = Depends(get_current_user)):
    pagos = await db.pagos.find({'socio_id': socio_id}, {'_id': 0}).sort('fecha_pago', -1).to_list(1000)
    return [Pago(**p) for p in pagos]

# ============ DASHBOARD ROUTES ============

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def obtener_stats(current_user: dict = Depends(get_current_user)):
    socios = await db.socios.find({}, {'_id': 0}).to_list(10000)
    
    for socio in socios:
        await actualizar_estado_socio(socio['socio_id'])
    
    socios = await db.socios.find({}, {'_id': 0}).to_list(10000)
    
    total_socios = len(socios)
    socios_activos = len([s for s in socios if s.get('estado') == 'activo'])
    socios_vencidos = len([s for s in socios if s.get('estado') == 'vencido'])
    
    now = datetime.now(timezone.utc)
    inicio_mes = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    pagos_mes = await db.pagos.find({
        'fecha_pago': {'$gte': inicio_mes.isoformat()}
    }, {'_id': 0}).to_list(10000)
    
    ingresos_mes = sum(p['monto'] for p in pagos_mes)
    
    proximos = []
    for socio in socios:
        if socio.get('fecha_vencimiento'):
            fecha_venc = datetime.fromisoformat(socio['fecha_vencimiento'])
            dias_restantes = (fecha_venc - now).days
            if 0 <= dias_restantes <= 7:
                proximos.append({
                    'socio_id': socio['socio_id'],
                    'nombre': socio['nombre'],
                    'fecha_vencimiento': socio['fecha_vencimiento'],
                    'dias_restantes': dias_restantes
                })
    
    proximos.sort(key=lambda x: x['dias_restantes'])
    
    return DashboardStats(
        total_socios=total_socios,
        socios_activos=socios_activos,
        socios_vencidos=socios_vencidos,
        ingresos_mes=ingresos_mes,
        proximos_vencimientos=proximos[:10]
    )

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()