import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_sms(recipient, message):
    """
    Sends an SMS using Arkesel V2 API.
    :param recipient: Phone number string (e.g. '0241234567')
    :param message: Message text string
    """
    api_key = settings.ARKESEL_API_KEY
    sender_id = settings.SMS_SENDER_ID

    if not api_key:
        logger.error("ARKESEL_API_KEY is not set in environment variables.")
        return False

    # Format phone number to 233 format
    clean_number = recipient.strip().replace(" ", "").replace("+", "")
    if clean_number.startswith("0"):
        clean_number = "233" + clean_number[1:]

    url = "https://sms.arkesel.com/api/v2/sms/send"
    headers = {
        "api-key": api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "sender": sender_id,
        "recipients": [clean_number],
        "message": message
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        data = response.json()

        if response.status_code == 200 and data.get("status") == "success":
            logger.info(f"SMS sent successfully to {clean_number}")
            return True
        else:
            logger.error(f"Arkesel Error: {data}")
            return False

    except Exception as e:
        logger.exception(f"Failed to send SMS to {clean_number}: {e}")
        return False
