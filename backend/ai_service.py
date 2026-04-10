import os
import re
import sys
from pathlib import Path
from google import genai
from dotenv import load_dotenv

# Load env at module level
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# ── Prompt builder ─────────────────────────────
def build_prompt(resume_text: str, job_description: str) -> str:
    try:
        from prompt import JOB_PROMPT as job_prompt
    except ImportError:
        job_prompt = "You are a brutally honest job fit analyzer."

    return f"""
{job_prompt}

---
## JOB DESCRIPTION PROVIDED:
{job_description}

---
## CANDIDATE RESUME:
{resume_text}
""".strip()


# ── Call Gemini ────────────────────────────────
async def analyze_with_gemini(resume_text: str, job_description: str) -> str:
    prompt = build_prompt(resume_text, job_description)

    # Reload env and create fresh client every call
    load_dotenv(dotenv_path=env_path, override=True)
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt
    )
    return response.text


# ── Parse AI output into sections ─────────────
def parse_analysis(text: str) -> dict:
    result = {
        "score": None,
        "strengths": [],
        "gaps": [],
        "reality_check": "",
        "recommendation": {"verdict": "", "detail": ""},
        "action_plan": [],
        "raw": text
    }

    # Score
    score_match = re.search(r"Overall Fit Score:\s*(\d{1,3})\s*%", text, re.IGNORECASE)
    if score_match:
        result["score"] = int(score_match.group(1))

    # Section extractor
    def get_section(start_label: str, end_labels: list) -> str:
        pattern = rf"{start_label}[:\s*\n]+"
        start = re.search(pattern, text, re.IGNORECASE)
        if not start:
            return ""
        after = text[start.end():].strip()
        end_idx = len(after)
        for lbl in end_labels:
            end_pat = re.search(rf"\n\**{lbl}\**[:\s*\n]", after, re.IGNORECASE)
            if end_pat and end_pat.start() < end_idx:
                end_idx = end_pat.start()
        return after[:end_idx].strip()

    # Bullet extractor
    def get_bullets(block: str) -> list:
        return [
            re.sub(r"\*\*", "", line.lstrip("*-• ").strip())
            for line in block.split("\n")
            if len(line.strip()) > 4 and not re.match(
                r"^(Strengths|Critical|Reality|Recommendation|Action|Overall)", line.strip(), re.IGNORECASE
            )
        ]

    strengths_block = get_section("Strengths Alignment", ["Critical Gaps", "Reality Check", "Recommendation", "Action Plan"])
    result["strengths"] = get_bullets(strengths_block)

    gaps_block = get_section("Critical Gaps", ["Reality Check", "Recommendation", "Action Plan"])
    result["gaps"] = get_bullets(gaps_block)

    result["reality_check"] = re.sub(r"\*\*", "", get_section("Reality Check", ["Recommendation", "Action Plan"])).strip()

    rec_block = get_section("Recommendation", ["Action Plan"])
    verdict_match = re.search(r"\**(APPLY NOW|UPSKILL FIRST|LOOK ELSEWHERE)\**", rec_block, re.IGNORECASE)
    if verdict_match:
        result["recommendation"]["verdict"] = verdict_match.group(1).upper()
        result["recommendation"]["detail"] = re.sub(r"\*\*", "", rec_block.replace(verdict_match.group(0), "")).strip()
    else:
        result["recommendation"]["detail"] = re.sub(r"\*\*", "", rec_block).strip()

    action_block = get_section("Action Plan", ["$$$END$$$"])
    result["action_plan"] = get_bullets(action_block)

    return result