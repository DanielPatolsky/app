from pydantic import BaseModel, ConfigDict

class Plan(BaseModel):
    """Modelo de plan de membresía"""
    model_config = ConfigDict(extra="ignore")
    id: str
    nombre: str
    dias: int
    precio: float

class PlanCreate(BaseModel):
    """Modelo para crear un plan"""
    model_config = ConfigDict(extra="ignore")
    nombre: str
    dias: int
    precio: float

class PlanUpdate(BaseModel):
    """Modelo para actualizar un plan"""
    model_config = ConfigDict(extra="ignore")
    nombre: str
    dias: int
    precio: float
