from database import Base, engine

def reset_database():
    try:
        print("Dropping all existing tables to clear any database errors...")
        Base.metadata.drop_all(bind=engine)
        print("Recreating all tables with the new schema...")
        Base.metadata.create_all(bind=engine)
        print("Database has been successfully reset! All red/pending items have been cleared.")
    except Exception as e:
        print(f"Error resetting database: {e}")

if __name__ == "__main__":
    reset_database()
