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

class SocioUpdate(BaseModel):
    """Modelo para actualizar un socio"""
    socio_id: Optional[str] = None
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    dni: Optional[str] = None

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
