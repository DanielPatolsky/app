import logging
from app.core.security import db
from twilio.rest import Client as TwilioClient
import os

logger = logging.getLogger(__name__)

TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_WHATSAPP_FROM = os.environ.get('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886')

try:
    from twilio.rest import Client as TwilioClient
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False

def enviar_whatsapp(telefono: str, mensaje: str) -> bool:
    """Enviar mensaje por WhatsApp usando Twilio"""
    if not TWILIO_AVAILABLE:
        logger.warning("Twilio no instalado. Ejecutar: pip install twilio")
        return False
    
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        logger.warning("Variables TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN no configuradas")
        return False
    
    try:
        twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        numero = telefono.strip()
        if not numero.startswith('+'):
            numero = '+' + numero
        twilio_client.messages.create(
            from_=TWILIO_WHATSAPP_FROM,
            to=f'whatsapp:{numero}',
            body=mensaje
        )
        return True
    except Exception as e:
        logger.error(f"Error enviando WhatsApp a {telefono}: {e}")
        return False
