from datetime import datetime, timezone, timedelta
from pymongo import ReturnDocument
from app.core.security import db
import logging

logger = logging.getLogger(__name__)

def calcular_fecha_vencimiento(tipo_plan: str, fecha_base: datetime) -> datetime:
    """Calcular fecha de vencimiento según tipo de plan"""
    dias = {
        'mensual': 30,
        'trimestral': 90,
        'semestral': 180,
        'anual': 365
    }
    return fecha_base + timedelta(days=dias.get(tipo_plan, 30))

def parse_iso_datetime(value: str) -> datetime:
    """Parsear string ISO a datetime con timezone UTC"""
    fecha = datetime.fromisoformat(value)
    if fecha.tzinfo is None:
        return fecha.replace(tzinfo=timezone.utc)
    return fecha

async def get_next_sequence(name: str) -> int:
    """Obtener siguiente número en secuencia desde BD"""
    sequence = await db.counters.find_one_and_update(
        {'name': name},
        {'$inc': {'seq': 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    return sequence['seq']

async def initialize_socio_counter():
    """Inicializar contador de socios desde contador existente"""
    max_socio = await db.socios.find({}, {'socio_id': 1, '_id': 0}).sort('socio_id', -1).limit(1).to_list(1)
    max_value = 0
    
    if max_socio:
        try:
            max_value = int(max_socio[0]['socio_id'].replace('GYM-', ''))
        except Exception:
            max_value = 0
    
    existing = await db.counters.find_one({'name': 'socio_id'})
    if existing is None:
        await db.counters.insert_one({'name': 'socio_id', 'seq': max_value})
    elif existing.get('seq', 0) < max_value:
        await db.counters.update_one({'name': 'socio_id'}, {'$set': {'seq': max_value}})

async def actualizar_estado_socio(socio_id: str):
    """Actualizar estado de un socio basado en fecha de vencimiento"""
    ultimo_pago = await db.pagos.find_one(
        {'socio_id': socio_id},
        {'_id': 0},
        sort=[('fecha_vencimiento', -1)]
    )
    
    if ultimo_pago:
        fecha_venc = parse_iso_datetime(ultimo_pago['fecha_vencimiento'])
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
            {'$set': {
                'estado': 'vencido',
                'fecha_vencimiento': None
            }}
        )
