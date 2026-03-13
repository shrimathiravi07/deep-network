from database import SessionLocal, User
from schemas import UserCreate

db = SessionLocal()
import traceback
try:
    user = db.query(User).filter(User.username == "test", User.password == "test").first()
    print("Query successful")
except Exception:
    traceback.print_exc()
finally:
    db.close()
