from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

# Crear cliente MongoDB
client = AsyncIOMotorClient(settings.MONGO_URL)

# Base de datos
db = client[settings.DB_NAME]