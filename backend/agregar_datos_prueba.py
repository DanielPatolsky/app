#!/usr/bin/env python3
"""
Script para agregar datos de prueba a MongoDB.
Genera socios en diferentes situaciones para probar todas las alertas.
"""

from pymongo import MongoClient
from datetime import datetime, timezone, timedelta
import uuid

# Conectar a MongoDB
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "gym_manager"

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

ahora = datetime.now(timezone.utc)

# Datos de los socios a crear
socios_datos = [
    {
        'nombre': 'Lucas',
        'apellido': 'Martínez',
        'email': 'lucas@example.com',
        'telefono': '3854710130',
        'dni': '38547101',
        'tipo_alerta': 'proximo',
        'descripcion': 'Vence en 3 días',
        'vencimiento_dias': 3
    },
    {
        'nombre': 'María',
        'apellido': 'García',
        'email': 'maria@example.com',
        'telefono': '+541234567890',
        'dni': '35123456',
        'tipo_alerta': 'vencido',
        'descripcion': 'Vencida hace 5 días',
        'vencimiento_dias': -5
    },
    {
        'nombre': 'Juan',
        'apellido': 'López',
        'email': 'juan@example.com',
        'telefono': '+541234567891',
        'dni': '33234567',
        'tipo_alerta': 'inactivo',
        'descripcion': 'Sin pagos hace 45 días',
        'vencimiento_dias': -45  # Simulamos que hace 45 días no pagó
    },
    {
        'nombre': 'Carlos',
        'apellido': 'Rodríguez',
        'email': 'carlos@example.com',
        'telefono': '+541234567892',
        'dni': '32345678',
        'tipo_alerta': 'activo',
        'descripcion': 'Cuota activa, vence en 25 días',
        'vencimiento_dias': 25
    },
    {
        'nombre': 'Ana',
        'apellido': 'Fernández',
        'email': 'ana@example.com',
        'telefono': '+541234567893',
        'dni': '31456789',
        'tipo_alerta': 'proximo',
        'descripcion': 'Vence hoy',
        'vencimiento_dias': 0
    },
    {
        'nombre': 'Pedro',
        'apellido': 'Sanchez',
        'email': 'pedro@example.com',
        'telefono': '+541234567894',
        'dni': '30567890',
        'tipo_alerta': 'proximo',
        'descripcion': 'Vence en 1 día',
        'vencimiento_dias': 1
    },
    {
        'nombre': 'Sofia',
        'apellido': 'Perez',
        'email': 'sofia@example.com',
        'telefono': '+541234567895',
        'dni': '29678901',
        'tipo_alerta': 'activo',
        'descripcion': 'Cuota activa, vence en 60 días',
        'vencimiento_dias': 60
    }
]

try:
    # Limpiar datos anteriores (opcional)
    db.socios.delete_many({})
    db.pagos.delete_many({})
    db.alertas.delete_many({})
    print("🗑️  Base de datos limpiada\n")
    
    print("📝 Creando socios de prueba...\n")
    
    for i, datos in enumerate(socios_datos, 1):
        socio_id = f"GYM-{i:04d}"
        
        # Crear socio
        nuevo_socio = {
            'id': str(uuid.uuid4()),
            'socio_id': socio_id,
            'nombre': datos['nombre'],
            'apellido': datos['apellido'],
            'email': datos['email'],
            'telefono': datos['telefono'],
            'direccion': f"Dirección Ejemplo {i}",
            'dni': datos['dni'],
            'fecha_registro': ahora.isoformat(),
            'estado': 'activo',
            'fecha_vencimiento': None
        }
        
        db.socios.insert_one(nuevo_socio)
        
        # Crear pago según el tipo de alerta
        fecha_vencimiento = ahora + timedelta(days=datos['vencimiento_dias'])
        
        # Para inactivo, el pago es muy antiguo
        if datos['tipo_alerta'] == 'inactivo':
            fecha_pago = ahora - timedelta(days=45)
        else:
            fecha_pago = ahora
        
        nuevo_pago = {
            'id': str(uuid.uuid4()),
            'socio_id': socio_id,
            'monto': 5000 + (i * 100),
            'tipo_plan': 'mensual',
            'metodo_pago': 'Efectivo',
            'fecha_pago': fecha_pago.isoformat(),
            'fecha_vencimiento': fecha_vencimiento.isoformat()
        }
        
        db.pagos.insert_one(nuevo_pago)
        
        # Actualizar socio con fecha de vencimiento
        db.socios.update_one(
            {'socio_id': socio_id},
            {'$set': {'fecha_vencimiento': nuevo_pago['fecha_vencimiento']}}
        )
        
        # Determinar estado
        dias_para_vencer = datos['vencimiento_dias']
        if dias_para_vencer < 0:
            estado = 'vencido'
        elif 0 <= dias_para_vencer <= 7:
            estado = 'proximo'
        else:
            estado = 'activo'
        
        db.socios.update_one(
            {'socio_id': socio_id},
            {'$set': {'estado': estado}}
        )
        
        # Imprimir resumen
        print(f"{i}. {datos['nombre']} {datos['apellido']}")
        print(f"   ID: {socio_id}")
        print(f"   Teléfono: {datos['telefono']}")
        print(f"   {datos['descripcion']}")
        print(f"   Vencimiento: {fecha_vencimiento.strftime('%d/%m/%Y')}")
        print(f"   Estado: {estado}")
        print()
    
    print("\n✅ Datos de prueba creados exitosamente")
    print("\n🎯 Resumen por tipo de alerta:")
    print(f"   • PRÓXIMAS A VENCER (0-7 días): Lucas (3d), Ana (hoy), Pedro (1d)")
    print(f"   • VENCIDAS: María (-5 días)")
    print(f"   • INACTIVAS (sin pagos 30+ días): Juan (45 días)")
    print(f"   • ACTIVOS (sin alertas): Carlos (25d), Sofia (60d)")
    print("\n📌 Abre el Dashboard y haz clic en 'Generar Alertas' para verlas")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    client.close()
