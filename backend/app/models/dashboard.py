from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class IngresoPorDia(BaseModel):
    """Ingresos desglosados por día"""
    dia: int
    fecha: str
    ingresos: float
    pagos: int

class DashboardStats(BaseModel):
    """Estadísticas del dashboard"""
    total_socios: int
    socios_activos: int
    socios_vencidos: int
    ingresos_mes: float
    mes: int
    anio: int
    ingresos_por_dia: List[IngresoPorDia]
    proximos_vencimientos: List[dict]

class Alerta(BaseModel):
    """Modelo de alerta para socios"""
    model_config = ConfigDict(extra="ignore")
    id: str
    socio_id: str
    nombre: str
    tipo: str  # 'vencido', 'proximo', 'inactivo'
    dias_restantes: Optional[int] = None
    fecha_vencimiento: Optional[str] = None
    telefono: str
    mensaje: str
    whatsapp_link: str
    fecha_alerta: str

class AlertaEnviada(BaseModel):
    """Registro de alertas enviadas"""
    model_config = ConfigDict(extra="ignore")
    id: str
    socio_id: str
    tipo: str
    fecha_envio: str

class ConfigMensaje(BaseModel):
    """Configuración personalizada de mensajes"""
    model_config = ConfigDict(extra="ignore")
    tipo: str  # 'vencido', 'proximo', 'inactivo'
    mensaje: str
