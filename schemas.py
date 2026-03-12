from pydantic import BaseModel
from typing import Optional, List

# -------- User Schemas -------- #
class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "citizen"

class UserResponse(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True

# -------- Complaint Schemas -------- #
class ComplaintCreate(BaseModel):
    description: str
    location: str

class ComplaintResponse(BaseModel):
    id: int
    description: str
    location: str
    image_path: Optional[str] = None
    status: str
    user_id: int

    class Config:
        from_attributes = True

class ComplaintUpdate(BaseModel):
    status: str
