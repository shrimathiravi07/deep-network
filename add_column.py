from sqlalchemy import create_engine, text

engine = create_engine("postgresql://postgres:2801@localhost:5432/waterguard")
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE complaints ADD COLUMN proof_image_path TEXT;"))
        conn.commit()
        print("Column added successfully.")
    except Exception as e:
        print(f"Error: {e}")
