from pydantic import BaseModel, ConfigDict
from typing import Optional

class PagoCreate(BaseModel):
    """Modelo para crear un pago"""
    socio_id: str
    monto: float
    tipo_plan: str
    metodo_pago: Optional[str] = "Efectivo"

class Pago(BaseModel):
    """Modelo de respuesta de pago"""
    model_config = ConfigDict(extra="ignore")
    id: str
    socio_id: str
    monto: float
    tipo_plan: str
    metodo_pago: str
    fecha_pago: str
    fecha_vencimiento: str
