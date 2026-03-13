from database import engine
from sqlalchemy import text

def migrate():
    # Migrate water_bodies
    wb_columns = [
        ('name', 'VARCHAR'),
        ('water_type', 'VARCHAR'),
        ('district', 'VARCHAR'),
        ('area', 'VARCHAR')
    ]
    for col_name, col_type in wb_columns:
        try:
            with engine.begin() as conn:
                conn.execute(text(f'ALTER TABLE water_bodies ADD COLUMN {col_name} {col_type};'))
            print(f"Successfully added {col_name} column to water_bodies table.")
        except Exception as e:
            print(f"Column {col_name} already exists or error in water_bodies: {e}")

    # Migrate users
    user_columns = [
        ('full_name', 'VARCHAR'),
        ('district', 'VARCHAR')
    ]
    for col_name, col_type in user_columns:
        try:
            with engine.begin() as conn:
                conn.execute(text(f'ALTER TABLE users ADD COLUMN {col_name} {col_type};'))
            print(f"Successfully added {col_name} column to users table.")
        except Exception as e:
            print(f"Column {col_name} already exists or error in users: {e}")

if __name__ == "__main__":
    migrate()
