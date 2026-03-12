from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os

# Create SQLite database in the current directory
SQLALCHEMY_DATABASE_URL = "sqlite:///./waterguard.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)  # Note: For production, hash the passwords
    role = Column(String, default="citizen") # Roles can be 'citizen' or 'officer'
    
    complaints = relationship("Complaint", back_populates="owner")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(Text, nullable=True)
    location = Column(String)
    image_path = Column(String, nullable=True) # Path to the uploaded photo
    status = Column(String, default="pending") # pending, investigating, resolved
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="complaints")

# Create tables if they do not exist
Base.metadata.create_all(bind=engine)
