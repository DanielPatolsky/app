from pydantic import BaseModel
from typing import List
import os
from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
ROOT_DIR = Path(__file__).parent.parent.parent
env_file = ROOT_DIR / '.env'
if env_file.exists():
    load_dotenv(env_file)

class Settings(BaseModel):
    MONGO_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "gimnasio"
    JWT_SECRET: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = str(env_file) if env_file.exists() else None

# Instancia de configuración
settings = Settings()