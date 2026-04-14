import logging

logger = logging.getLogger(__name__)

def enviar_whatsapp(telefono: str, mensaje: str) -> bool:
    logger.warning("Funcionalidad de envío de WhatsApp no está habilitada en este proyecto.")
    return False
