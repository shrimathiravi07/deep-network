from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.orm import Session
import torch
import cv2
import numpy as np
import os
import shutil
import io
from PIL import Image
from torchvision import transforms
from fastapi.staticfiles import StaticFiles

from model import get_water_guard_model
from database import SessionLocal, engine, User, Complaint
from schemas import UserCreate, UserResponse, ComplaintCreate, ComplaintResponse, ComplaintUpdate

app = FastAPI()

device = "cuda" if torch.cuda.is_available() else "cpu"

# Load model
model = get_water_guard_model().to(device)
try:
    model.load_state_dict(torch.load("models/best_unet.pth", map_location=device, weights_only=True))
except Exception as e:
    print(f"Warning: Could not load model - {e}")
model.eval()


@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    # Read image
    data = await file.read()
    img = Image.open(io.BytesIO(data)).convert("RGB")

    # Preprocess
    img_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    
    tensor = img_transform(img).unsqueeze(0).to(device)

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

# Mount static files at the end so it doesn't shadow API routes
app.mount("/dataset", StaticFiles(directory="dataset"), name="dataset")
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)