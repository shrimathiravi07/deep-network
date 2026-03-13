from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
import os

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:2801@localhost:5432/waterguard"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)  
    role = Column(String, default="citizen") 
    full_name = Column(String, nullable=True)
    district = Column(String, nullable=True)
    
    complaints = relationship("Complaint", back_populates="owner")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(Text, nullable=True)
    location = Column(String)
    image_path = Column(String, nullable=True) 
    status = Column(String, default="pending") 
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="complaints")

class WaterBody(Base):
    __tablename__ = "water_bodies"

    id = Column(Integer, primary_key=True, index=True)
    body_id = Column(String, unique=True, index=True) 
    name = Column(String)
    water_type = Column(String) 
    district = Column(String)
    area = Column(String) 
    boundary_geojson = Column(Text) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())

Base.metadata.create_all(bind=engine)
