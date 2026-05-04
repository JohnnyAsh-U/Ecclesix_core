# app/seed.py
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy import select
from . import models
from .session import AsyncSessionLocal, Base
from bcrypt import hashpw, checkpw, gensalt
import random
import string
from datetime import datetime, timedelta, time

async def seed_data():
    print("Seeding database...")
    print("Done seeding.")


if __name__ == "__main__":
    import asyncio   
    try:
        asyncio.run(seed_data())
    except RuntimeError as e:
        if "Event loop is closed" not in str(e):
            raise