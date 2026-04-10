from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import io

import pdfplumber
from docx import Document

from database import get_db, Analysis
from ai_service import analyze_with_gemini, parse_analysis

router = APIRouter()

# ── Extract text from uploaded file ───────────
async def extract_text(file: UploadFile) -> str:
    content = await file.read()

    if file.content_type == "application/pdf":
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)

    elif file.content_type in [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword"
    ]:
        doc = Document(io.BytesIO(content))
        return "\n".join(para.text for para in doc.paragraphs)

    raise HTTPException(status_code=400, detail="Only PDF and Word documents are supported")


# ── Response schema ────────────────────────────
class AnalysisResponse(BaseModel):
    id: int
    success: bool
    analysis: str
    parsed: dict
    meta: dict

    class Config:
        from_attributes = True


# ── POST /api/analyze ──────────────────────────
@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    resume: UploadFile = File(...),
    jobDescription: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        # Validate file size (10MB)
        content = await resume.read()
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be under 10MB")
        await resume.seek(0)

        # Validate JD length
        if len(jobDescription.strip()) < 50:
            raise HTTPException(status_code=400, detail="Job description must be at least 50 characters")

        # Extract text
        resume_text = await extract_text(resume)
        if len(resume_text.strip()) < 100:
            raise HTTPException(status_code=400, detail="Could not extract text from resume.")

        # Call Gemini
        raw_analysis = await analyze_with_gemini(resume_text, jobDescription)

        # Parse into sections
        parsed = parse_analysis(raw_analysis)

        # Save to database
        record = Analysis(
            resume_filename = resume.filename,
            fit_score       = parsed.get("score"),
            verdict         = parsed.get("recommendation", {}).get("verdict"),
            strengths       = parsed.get("strengths"),
            gaps            = parsed.get("gaps"),
            action_plan     = parsed.get("action_plan"),
            reality_check   = parsed.get("reality_check"),
            recommendation  = parsed.get("recommendation", {}).get("detail"),
            job_snippet     = jobDescription[:300],
            raw_analysis    = raw_analysis
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        return AnalysisResponse(
            id=record.id,
            success=True,
            analysis=raw_analysis,
            parsed=parsed,
            meta={
                "id": record.id,
                "resumeFileName": resume.filename,
                "analyzedAt": record.created_at.isoformat(),
                "resumeChars": len(resume_text)
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print("=" * 60)
        print("ANALYZE ERROR:", str(e))
        print(traceback.format_exc())
        print("=" * 60)
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /api/history ───────────────────────────
@router.get("/history")
def get_history(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    records = db.query(Analysis).order_by(Analysis.created_at.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": r.id,
            "created_at": r.created_at.isoformat(),
            "resume_filename": r.resume_filename,
            "fit_score": r.fit_score,
            "verdict": r.verdict,
            "job_snippet": r.job_snippet,
        }
        for r in records
    ]


# ── GET /api/analysis/{id} ─────────────────────
@router.get("/analysis/{analysis_id}")
def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    record = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {
        "id": record.id,
        "created_at": record.created_at.isoformat(),
        "resume_filename": record.resume_filename,
        "fit_score": record.fit_score,
        "verdict": record.verdict,
        "strengths": record.strengths,
        "gaps": record.gaps,
        "action_plan": record.action_plan,
        "reality_check": record.reality_check,
        "recommendation": record.recommendation,
        "job_snippet": record.job_snippet,
        "raw_analysis": record.raw_analysis,
    }
