from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "citizen"
    full_name: Optional[str] = None
    district: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    full_name: Optional[str] = None
    district: Optional[str] = None

    class Config:
        from_attributes = True

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
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintUpdate(BaseModel):
    status: str

class WaterBodyCreate(BaseModel):
    body_id: str
    name: str
    water_type: str
    district: str
    area: str
    boundary_geojson: str

class WaterBodyResponse(BaseModel):
    id: int
    body_id: str
    name: str
    water_type: str
    district: str
    area: str
    boundary_geojson: str
    created_at: datetime

    class Config:
        from_attributes = True
