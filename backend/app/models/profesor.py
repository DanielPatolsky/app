from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class ProfesorSocio(BaseModel):
    socio_id: str
    nombre: Optional[str] = None
    apellido: Optional[str] = None

class ProfesorCreate(BaseModel):
    """Modelo para crear un profesor"""
    nombre: str
    apellido: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    dni: str

class ProfesorUpdate(BaseModel):
    """Modelo para actualizar un profesor"""
    profesor_id: Optional[str] = None
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    dni: Optional[str] = None

class Profesor(BaseModel):
    """Modelo de respuesta de profesor"""
    model_config = ConfigDict(extra="ignore")
    id: str
    profesor_id: str
    nombre: str
    apellido: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    dni: Optional[str] = None
    fecha_registro: str
    estado: str
    fecha_vencimiento: Optional[str] = None
    socios: List[ProfesorSocio] = []
