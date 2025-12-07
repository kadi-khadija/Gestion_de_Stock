import json
import pika
from django.conf import settings
from django.utils import timezone

RABBITMQ_HOST = getattr(settings, "RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = getattr(settings, "RABBITMQ_PORT", 5672)
RABBITMQ_USER = getattr(settings, "RABBITMQ_USER", "guest")
RABBITMQ_PASSWORD = getattr(settings, "RABBITMQ_PASSWORD", "guest")
RABBITMQ_ALERT_QUEUE = getattr(settings, "RABBITMQ_ALERT_QUEUE", "stock_alerts")


def _get_connection():
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
    params = pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        port=RABBITMQ_PORT,
        credentials=credentials,
    )
    return pika.BlockingConnection(params)


def publish_stock_alert(alert: dict) -> None:

    connection = _get_connection()
    channel = connection.channel()
    channel.queue_declare(queue=RABBITMQ_ALERT_QUEUE, durable=True)

    body = json.dumps(alert)
    channel.basic_publish(
        exchange="",
        routing_key=RABBITMQ_ALERT_QUEUE,
        body=body,
        properties=pika.BasicProperties(
            delivery_mode=2,  # persistant
            content_type="application/json",
        ),
    )
    connection.close()


def check_and_send_stock_alert(stock):

    # Sécurité : si pas de min_quantity, on ne fait rien
    min_qty = getattr(stock, "min_quantity", None)
    current_qty = getattr(stock, "quantity", None)

    if min_qty is None or current_qty is None:
        return

    level = None
    message = None

    # Cas 2 : ZERO / RESTOCKAGE
    if current_qty == 0:
        level = "ZERO"
        message = "Stock épuisé, restockage nécessaire."
    # Cas 1 : LOW
    elif 0 < current_qty <= min_qty:
        level = "LOW"
        message = "Stock bas, pensez à restocker."

    if level is None:
        # Aucun problème de stock, on sort
        return

   
    piece = getattr(stock, "piece", None)

    alert_payload = {
        "type": "STOCK_ALERT",
        "level": level,               # 'LOW' ou 'ZERO'
        "message": message,
        "stock_id": stock.id,
        "piece_id": piece.id if piece else None,
        "piece_reference": getattr(piece, "reference", None),
        "piece_name": getattr(piece, "designation", None)
                        or getattr(piece, "name", None),
        "location": getattr(stock, "location", "") or "",
        "quantity": current_qty,
        "min_quantity": min_qty,
        "timestamp": timezone.now().isoformat(),
    }

    publish_stock_alert(alert_payload)
