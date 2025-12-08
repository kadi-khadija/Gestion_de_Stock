import json
import pika
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "notification_service.settings") 
django.setup()

from django.conf import settings
from notifications.models import Notification  

RABBITMQ_HOST = getattr(settings, "RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = getattr(settings, "RABBITMQ_PORT", 5672)
RABBITMQ_USER = getattr(settings, "RABBITMQ_USER", "guest")
RABBITMQ_PASSWORD = getattr(settings, "RABBITMQ_PASSWORD", "guest")
RABBITMQ_ALERT_QUEUE = getattr(settings, "RABBITMQ_ALERT_QUEUE", "stock_alerts")


def get_connection():
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASSWORD)
    params = pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        port=RABBITMQ_PORT,
        credentials=credentials,
    )
    return pika.BlockingConnection(params)


def handle_stock_alert(message: dict):
    """
    message est le JSON envoyé par StockService → notification_publisher.check_and_send_stock_alert
    """
    if message.get("type") != "STOCK_ALERT":
        return

    Notification.objects.create(
        type=message.get("type", "STOCK_ALERT"),
        level=message.get("level"),
        message=message.get("message", ""),

        stock_id=message.get("stock_id"),
        piece_id=message.get("piece_id"),
        reference=message.get("piece_reference") or "",
        nom=message.get("piece_name") or "",

        location=message.get("location") or "",

        quantity=message.get("quantity"),
        min_quantity=message.get("min_quantity"),
    )


def callback(ch, method, properties, body):
    try:
        data = json.loads(body.decode("utf-8"))
    except Exception as e:
        print(" Erreur de parsing JSON:", e)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        return

    print(" Message reçu:", data)
    try:
        handle_stock_alert(data)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        print(" Notification enregistrée.")
    except Exception as e:
        print(" Erreur lors de la sauvegarde de la notification:", e)

        ch.basic_ack(delivery_tag=method.delivery_tag)


def main():
    connection = get_connection()
    channel = connection.channel()

    channel.queue_declare(queue=RABBITMQ_ALERT_QUEUE, durable=True)

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(
        queue=RABBITMQ_ALERT_QUEUE,
        on_message_callback=callback,
    )

    print(" NotificationService écoute les alertes de stock...")
    channel.start_consuming()


if __name__ == "__main__":
    main()
