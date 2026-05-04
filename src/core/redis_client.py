from redis import Redis
from .config import get_settings

redis_client = Redis.from_url(get_settings().REDIS_URL,
    decode_responses=True,
    socket_connect_timeout=1, # Stop waiting after 1 second
    health_check_interval=30  # Periodically check if connection is alive
)
