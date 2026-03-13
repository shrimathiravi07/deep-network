from database import engine
from sqlalchemy import text

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN district VARCHAR;"))
    print("Successfully added district column")
except Exception as e:
    print(f"Error adding district: {e}")
