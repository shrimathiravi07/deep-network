from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.orm import Session
import torch
import cv2
import numpy as np
import os
import shutil

from model import get_water_guard_model
from database import SessionLocal, engine, User, Complaint
from schemas import UserCreate, UserResponse, ComplaintCreate, ComplaintResponse, ComplaintUpdate

app = FastAPI()

device = "cuda" if torch.cuda.is_available() else "cpu"

# Load model
model = get_water_guard_model().to(device)
model.load_state_dict(torch.load("models/best_model.pth", map_location=device))
model.eval()


@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    # Read image
    data = await file.read()
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)

    # Preprocess
    img = cv2.resize(img,(512,512))/255.0
    tensor = torch.tensor(img).permute(2,0,1).unsqueeze(0).float().to(device)

    # Prediction
    with torch.no_grad():
        output = model(tensor)
        mask = torch.argmax(output, dim=1).squeeze().cpu().numpy()

    water_pixels = np.sum(mask == 1)

    return {
        "water_pixels": int(water_pixels),
        "message": "Prediction completed"
    }

# -------- Database Dependency -------- #
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------- Authentication Endpoints -------- #
@app.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = User(username=user.username, password=user.password, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login")
def login(user: UserCreate, db: Session = Depends(get_db)):
    # In a real application, passwords MUST be hashed securely
    db_user = db.query(User).filter(User.username == user.username, User.password == user.password).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid username or password")
    
    return {"message": "Login successful", "user_id": db_user.id, "role": db_user.role, "username": db_user.username}


# -------- Complaint / Officer Endpoints -------- #
@app.post("/complaints", response_model=ComplaintResponse)
async def create_complaint(
    description: str = Form(...),
    location: str = Form(...),
    user_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Save the citizen's uploaded image photo locally
    os.makedirs("dataset/complaints", exist_ok=True)
    file_location = f"dataset/complaints/{file.filename}"
    
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    new_complaint = Complaint(
        description=description,
        location=location,
        image_path=file_location,
        user_id=user_id,
        status="pending"
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    return new_complaint

@app.get("/complaints", response_model=list[ComplaintResponse])
def get_all_complaints(db: Session = Depends(get_db)):
    """Officer Route: View all complaints across the region"""
    return db.query(Complaint).all()

@app.get("/complaints/user/{user_id}", response_model=list[ComplaintResponse])
def get_user_complaints(user_id: int, db: Session = Depends(get_db)):
    """Citizen Route: View only my submitted complaints and their live status"""
    return db.query(Complaint).filter(Complaint.user_id == user_id).all()

@app.put("/complaints/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(complaint_id: int, update: ComplaintUpdate, db: Session = Depends(get_db)):
    """Officer Route: Update a complaint status (e.g., pending -> investigating -> resolved)"""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    complaint.status = update.status
    db.commit()
    db.refresh(complaint)
    return complaint