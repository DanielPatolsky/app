"""
Servidor FastAPI para Gym Manager
Punto de entrada principal que importa toda la lógica de app/main.py
"""

from app.main import app

# Exportar la aplicación para uvicorn
__all__ = ['app']
