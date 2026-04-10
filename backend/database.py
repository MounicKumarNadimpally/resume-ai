from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://resumeai:resumeai@localhost:5433/resumeai")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ── Database Models ────────────────────────────
class Analysis(Base):
    __tablename__ = "analyses"

    id              = Column(Integer, primary_key=True, index=True)
    created_at      = Column(DateTime, default=datetime.utcnow)
    resume_filename = Column(String(255))
    fit_score       = Column(Float, nullable=True)
    verdict         = Column(String(50), nullable=True)   # APPLY NOW / UPSKILL FIRST / LOOK ELSEWHERE
    strengths       = Column(JSON, nullable=True)         # list of strings
    gaps            = Column(JSON, nullable=True)         # list of strings
    action_plan     = Column(JSON, nullable=True)         # list of strings
    reality_check   = Column(Text, nullable=True)
    recommendation  = Column(Text, nullable=True)
    job_snippet     = Column(String(300), nullable=True)  # first 300 chars of JD
    raw_analysis    = Column(Text, nullable=True)         # full AI output

# ── Dependency ─────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
