from database import SessionLocal, User

def populate_default_users():
    db = SessionLocal()
    try:
        users = [
            User(username="admin", password="password", role="admin", full_name="System Admin", district="Central"),
            User(username="officer", password="password", role="officer", full_name="Nodal Officer", district="North"),
            User(username="citizen", password="password", role="citizen", full_name="Local Citizen", district="South")
        ]
        
        for user in users:
            existing = db.query(User).filter(User.username == user.username).first()
            if not existing:
                db.add(user)
        
        db.commit()
        print("Successfully populated default users: 'admin', 'officer', 'citizen' (Password for all: 'password')")
    except Exception as e:
        print(f"Error populating users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    populate_default_users()
