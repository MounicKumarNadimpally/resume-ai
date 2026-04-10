from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from collections import Counter

from database import get_db, Analysis

router = APIRouter()

# ── GET /api/stats ─────────────────────────────
@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    records = db.query(Analysis).all()

    if not records:
        return {
            "total": 0,
            "avg_score": 0,
            "verdict_counts": {"APPLY NOW": 0, "UPSKILL FIRST": 0, "LOOK ELSEWHERE": 0},
            "score_distribution": [],
            "top_gaps": [],
            "top_strengths": [],
            "recent": []
        }

    # Basic stats
    scores = [r.fit_score for r in records if r.fit_score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    # Verdict counts
    verdict_counts = {"APPLY NOW": 0, "UPSKILL FIRST": 0, "LOOK ELSEWHERE": 0}
    for r in records:
        if r.verdict in verdict_counts:
            verdict_counts[r.verdict] += 1

    # Score distribution (buckets of 20)
    buckets = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
    for s in scores:
        if s <= 20:   buckets["0-20"] += 1
        elif s <= 40: buckets["21-40"] += 1
        elif s <= 60: buckets["41-60"] += 1
        elif s <= 80: buckets["61-80"] += 1
        else:         buckets["81-100"] += 1

    score_distribution = [{"range": k, "count": v} for k, v in buckets.items()]

    # Top skill gaps
    all_gaps = []
    for r in records:
        if r.gaps:
            all_gaps.extend(r.gaps)
    gap_counter = Counter(all_gaps)
    top_gaps = [{"skill": k, "count": v} for k, v in gap_counter.most_common(8)]

    # Top strengths
    all_strengths = []
    for r in records:
        if r.strengths:
            all_strengths.extend(r.strengths)
    strength_counter = Counter(all_strengths)
    top_strengths = [{"skill": k, "count": v} for k, v in strength_counter.most_common(8)]

    # Recent 5
    recent = [
        {
            "id": r.id,
            "created_at": r.created_at.isoformat(),
            "resume_filename": r.resume_filename,
            "fit_score": r.fit_score,
            "verdict": r.verdict,
        }
        for r in sorted(records, key=lambda x: x.created_at, reverse=True)[:5]
    ]

    return {
        "total": len(records),
        "avg_score": avg_score,
        "verdict_counts": verdict_counts,
        "score_distribution": score_distribution,
        "top_gaps": top_gaps,
        "top_strengths": top_strengths,
        "recent": recent
    }
