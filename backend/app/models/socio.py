from pydantic import BaseModel, ConfigDict
from typing import Optional

class SocioCreate(BaseModel):
    """Modelo para crear un socio"""
    nombre: str
    apellido: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    dni: str

class Socio(BaseModel):
    """Modelo de respuesta de socio"""
    model_config = ConfigDict(extra="ignore")
    id: str
    socio_id: str
    nombre: str
    apellido: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    dni: Optional[str] = None
    fecha_registro: str
    estado: str
    fecha_vencimiento: Optional[str] = None
