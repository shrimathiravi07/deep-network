from sqlalchemy import create_engine
import sys

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:2801@localhost:5432/waterguard"

try:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        print("Successfully connected to the database!")
except Exception as e:
    print(f"Failed to connect: {e}")
    sys.exit(1)
