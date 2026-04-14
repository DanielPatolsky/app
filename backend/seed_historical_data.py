#!/usr/bin/env python3
"""
Script para poblar MongoDB con datos históricos de gimnasio.
Genera socios, pagos, planes y configuraciones para simular dos años de uso real.
"""

import os
import random
import uuid
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'gym_manager')

client = MongoClient(MONGO_URL)
db = client[DB_NAME]
now = datetime.now(timezone.utc)

FIRST_NAMES = [
    'Mateo', 'Sofía', 'Juan', 'Camila', 'Lucas', 'Valentina', 'Martín', 'Catalina',
    'Alejandro', 'Lucía', 'Nicolás', 'Mía', 'Diego', 'Josefina', 'Tomás', 'Agustina',
    'Bruno', 'Sofía', 'Sebastián', 'Emma', 'Federico', 'Florencia', 'Ignacio', 'Julieta',
    'Joaquín', 'Amelia', 'Santiago', 'Agustín', 'Antonia', 'Benjamín'
]
LAST_NAMES = [
    'González', 'Rodríguez', 'Gómez', 'Fernández', 'López', 'Martínez', 'Pérez', 'Sánchez',
    'Romero', 'Torres', 'Ramírez', 'Díaz', 'Morales', 'Alvarez', 'Vargas', 'Rojas',
    'Flores', 'Castro', 'Ortiz', 'Molina', 'Suárez', 'Herrera', 'Ruiz', 'Silva',
    'Núñez', 'Blanco', 'Rojas', 'Acosta', 'Cruz', 'Medina'
]

PLANOS = [
    {'nombre': 'Mensual', 'dias': 30, 'precio': 2800.0, 'tipo': 'mensual'},
    {'nombre': 'Trimestral', 'dias': 90, 'precio': 7900.0, 'tipo': 'trimestral'},
    {'nombre': 'Semestral', 'dias': 180, 'precio': 14900.0, 'tipo': 'semestral'},
    {'nombre': 'Anual', 'dias': 365, 'precio': 25900.0, 'tipo': 'anual'},
]

METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta']

CLIENTES = 220
RANDOM_SEED = 42
random.seed(RANDOM_SEED)


def iso(dt: datetime) -> str:
    return dt.replace(tzinfo=timezone.utc).isoformat()


def random_phone():
    prefix = random.choice(['341', '351', '381', '223', '261', '11'])
    return f'+549{prefix}{random.randint(1000000, 9999999):07d}'


def random_dni():
    return str(random.randint(22000000, 49999999))


def random_address(index: int) -> str:
    calle = random.choice(['Av.', 'Calle', 'Pje.', 'Entre Ríos', 'San Martín', 'Belgrano', 'Sarmiento'])
    numero = random.randint(100, 999)
    return f"{calle} {numero}, Barrio {index % 15 + 1}"


def build_email(nombre: str, apellido: str, index: int) -> str:
    base = f"{nombre.lower()}.{apellido.lower()}"
    return f"{base}{index}@example.com"


def calcular_fecha_vencimiento(tipo_plan: str, fecha_base: datetime) -> datetime:
    dias = {'mensual': 30, 'trimestral': 90, 'semestral': 180, 'anual': 365}
    return fecha_base + timedelta(days=dias.get(tipo_plan, 30))


def limpiar_colecciones():
    print('🔄 Limpiando colecciones...')
    db.socios.delete_many({})
    db.pagos.delete_many({})
    db.alertas.delete_many({})
    db.alertas_enviadas.delete_many({})
    db.config_mensajes.delete_many({})
    db.planes.delete_many({})
    print('✅ Colecciones limpiadas')


def insertar_planes():
    print('📦 Insertando planes...')
    planes_docs = []
    for plan in PLANOS:
        planes_docs.append({
            'id': str(uuid.uuid4()),
            'nombre': plan['nombre'],
            'dias': plan['dias'],
            'precio': plan['precio']
        })
    db.planes.insert_many(planes_docs)
    print(f'✅ {len(planes_docs)} planes creados')
    return planes_docs


def insertar_config_mensajes():
    print('✉️  Insertando mensajes por defecto...')
    mensajes = [
        {'tipo': 'vencido', 'mensaje': 'Hola {nombre} 👋\nTu cuota venció el {fecha}. Renovala y seguí entrenando.',},
        {'tipo': 'proximo', 'mensaje': 'Hola {nombre} 👋\nTu cuota vence en {dias} días ({fecha}). No te olvides de renovar.',},
        {'tipo': 'inactivo', 'mensaje': 'Hola {nombre} 👋\nHace {dias} días que no vienes al gimnasio. Te esperamos de nuevo.',},
    ]
    db.config_mensajes.insert_many(mensajes)
    print('✅ Mensajes insertados')


def generar_socios_y_pagos(planes):
    print('👥 Generando socios y pagos históricos...')
    historial = []

    for index in range(1, CLIENTES + 1):
        if index == 221:
            nombre = 'Pablo'
            apellido = 'Fernandez'
        else:
            nombre = random.choice(FIRST_NAMES)
            apellido = random.choice(LAST_NAMES)
        socio_id = f'GYM-{index:04d}'
        email = build_email(nombre, apellido, index)
        telefono = random_phone()
        dni = random_dni()
        fecha_registro = now - timedelta(days=random.randint(30, 730))

        # Elegir plan inicial y simular cambios de plan ocasionalmente
        plan = random.choices(PLANOS, weights=[45, 25, 20, 10], k=1)[0]
        metodo = random.choice(METODOS_PAGO)
        direccion = random_address(index)

        pagos = []
        fecha_pago = fecha_registro
        fecha_vencimiento = calcular_fecha_vencimiento(plan['tipo'], fecha_pago)
        estado_actual = 'activo'
        pagos_realizados = 0

        while fecha_pago <= now:
            pagos_realizados += 1
            if random.random() < 0.08 and pagos_realizados > 1:
                break
            pagos.append({
                'id': str(uuid.uuid4()),
                'socio_id': socio_id,
                'monto': plan['precio'],
                'tipo_plan': plan['tipo'],
                'metodo_pago': metodo,
                'fecha_pago': iso(fecha_pago),
                'fecha_vencimiento': iso(fecha_vencimiento),
            })
            if fecha_vencimiento > now:
                estado_actual = 'activo'
                break
            if random.random() < 0.12:
                plan = random.choice(PLANOS)
                metodo = random.choice(METODOS_PAGO)
            fecha_pago = fecha_vencimiento + timedelta(days=random.randint(0, 7))
            fecha_vencimiento = calcular_fecha_vencimiento(plan['tipo'], fecha_pago)
            if fecha_pago > now:
                break

        if pagos and parse_iso_datetime(pagos[-1]['fecha_vencimiento']) < now:
            estado_actual = 'vencido'
        elif pagos and parse_iso_datetime(pagos[-1]['fecha_vencimiento']) >= now:
            estado_actual = 'activo'

        ultimo_venc = pagos[-1]['fecha_vencimiento'] if pagos else None

        # Special case for Pablo Fernandez (ID 0221)
        if index == 221:
            fecha_venc_2_dias = now + timedelta(days=2)
            if pagos:
                pagos[-1]['fecha_vencimiento'] = iso(fecha_venc_2_dias)
            ultimo_venc = iso(fecha_venc_2_dias)
            estado_actual = 'activo'

        socio_doc = {
            'id': str(uuid.uuid4()),
            'socio_id': socio_id,
            'nombre': nombre,
            'apellido': apellido,
            'email': email,
            'telefono': telefono,
            'direccion': direccion,
            'dni': dni,
            'fecha_registro': iso(fecha_registro),
            'estado': estado_actual,
            'fecha_vencimiento': ultimo_venc,
        }

        db.socios.insert_one(socio_doc)
        if pagos:
            db.pagos.insert_many(pagos)

        if index % 50 == 0:
            print(f'  - Ya generados {index} socios...')

        historial.append((socio_id, nombre, apellido, estado_actual, len(pagos)))

    print(f'✅ Generados {CLIENTES} socios y {sum(len([p for p in db.pagos.find({"socio_id": f"GYM-{i:04d}"})]) for i in range(1, CLIENTES+1))} pagos en total')
    return historial


def parse_iso_datetime(value: str) -> datetime:
    fecha = datetime.fromisoformat(value)
    if fecha.tzinfo is None:
        return fecha.replace(tzinfo=timezone.utc)
    return fecha


def main():
    limpiar_colecciones()
    planes = insertar_planes()
    insertar_config_mensajes()
    historial = generar_socios_y_pagos(planes)

    print('\n📍 Resumen final')
    activo = sum(1 for item in historial if item[3] == 'activo')
    vencido = sum(1 for item in historial if item[3] == 'vencido')
    print(f'   • Socios activos: {activo}')
    print(f'   • Socios vencidos: {vencido}')
    print('   • Meses cargados: últimos 2 años de historial realista')
    print('\n✅ Base de datos poblada con datos históricos del gimnasio')


if __name__ == '__main__':
    main()
