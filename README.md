# ◈ ResumeAI — Brutally Honest Job Fit Analyzer

> An AI-powered full-stack application that analyzes resumes against job descriptions — delivering fit scores, skill gap analysis, ATS keyword insights, and actionable recommendations. Built with React, Python/FastAPI, PostgreSQL, and Google Gemini AI. Deployable in one command via Docker.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-7-F9A03C?style=flat-square&logo=d3dotjs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-EC2-FF9900?style=flat-square&logo=amazonaws&logoColor=white)

---

## 🌐 Live Demo

**[https://resumeai.devlaunched.com](https://resumeai.devlaunched.com)**

---

## ✨ What it does

Upload your resume and paste a job description — ResumeAI gives you a brutally honest assessment of your fit for the role. No sugar-coating. Just facts.

- 🎯 **Fit Score** — 0–100% match score with color-coded verdict
- ✅ **Strengths Analysis** — what in your resume aligns with the job
- ⚠️ **Skill Gap Detection** — direct callout of missing qualifications
- 👁 **Reality Check** — honest assessment of your interview chances
- 🗺 **Action Plan** — specific steps to improve your chances
- 📊 **Analytics Dashboard** — D3.js charts tracking all your analyses over time
- 🗄️ **PostgreSQL Database** — every analysis saved with full history

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                          │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │  React   │───▶│    Nginx     │───▶│    FastAPI    │  │
│  │  + D3.js │    │  (port 3000) │    │  (port 5000)  │  │
│  └──────────┘    └──────────────┘    └──────┬────────┘  │
│                                             │            │
│                                    ┌────────▼────────┐  │
│                                    │   PostgreSQL    │  │
│                                    │   (port 5432)   │  │
│                                    └─────────────────┘  │
│                                             │            │
│                                    ┌────────▼────────┐  │
│                                    │  Google Gemini  │  │
│                                    │     AI API      │  │
│                                    └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, D3.js v7, react-markdown |
| Backend | Python 3.12, FastAPI, SQLAlchemy, Uvicorn |
| AI | Google Gemini 2.5 Flash (Free Tier) |
| File Parsing | pdfplumber (PDF), python-docx (Word) |
| Database | PostgreSQL 16 |
| Containerization | Docker, docker-compose |
| Reverse Proxy | Nginx |
| Process Manager | PM2 |
| Cloud | AWS EC2 (Ubuntu 22.04) |
| SSL | Let's Encrypt via Certbot |

---

## 🚀 Run with Docker — One Command

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running
- Free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/MounicKumarNadimpally/resume-ai-v2.git
cd resume-ai-v2

# 2. Set up environment
cp .env.example .env
# Open .env and add your GEMINI_API_KEY

# 3. Set up prompt file
cp backend/prompt.example.py backend/prompt.py
# The example prompt works out of the box

# 4. Launch everything
docker-compose up --build

# 5. Open the app
# http://localhost:3000
```

That's it. Docker handles Python, Node.js, PostgreSQL — everything runs automatically.

---

## 💻 Run Without Docker (Development)

### Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Add your GEMINI_API_KEY and DATABASE_URL to .env

# Set up prompt
cp prompt.example.py prompt.py

# Run the server
python main.py
# API running at http://localhost:5000
# Swagger docs at http://localhost:5000/docs
```

### Frontend

```bash
cd frontend

npm install
npm install react-markdown d3
npm run dev
# App running at http://localhost:3000
```

---

## 📁 Project Structure

```
resume-ai-v2/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # SQLAlchemy models + PostgreSQL setup
│   ├── ai_service.py        # Gemini API integration + response parser
│   ├── routes/
│   │   ├── analysis.py      # POST /api/analyze, GET /api/history
│   │   └── stats.py         # GET /api/stats (dashboard metrics)
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile
│   ├── .env.example         # Environment variable template
│   └── prompt.example.py   # Analysis prompt template
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main analyzer UI
│   │   ├── App.css
│   │   ├── Dashboard.jsx    # D3.js analytics dashboard
│   │   ├── Dashboard.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── nginx.conf           # Nginx config for Docker
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml       # Orchestrates all 3 services
├── .env.example             # Root environment template
├── .gitignore
└── README.md
```

---

## 📊 API Reference

### `POST /api/analyze`

Analyzes a resume against a job description.

**Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `resume` | File | PDF or Word document (max 10MB) |
| `jobDescription` | string | Full job description text (min 50 chars) |

**Response:**
```json
{
  "id": 1,
  "success": true,
  "analysis": "JOB FIT ANALYSIS\n\nOverall Fit Score: 72%...",
  "parsed": {
    "score": 72,
    "strengths": ["React experience matches requirements"],
    "gaps": ["No AWS certification mentioned"],
    "recommendation": { "verdict": "UPSKILL FIRST", "detail": "..." }
  },
  "meta": {
    "resumeFileName": "resume.pdf",
    "analyzedAt": "2026-04-10T05:00:00Z"
  }
}
```

### `GET /api/history`
Returns list of all past analyses.

### `GET /api/stats`
Returns dashboard metrics — score distribution, verdict counts, top skill gaps.

### `GET /api/health`
Health check endpoint.

### Interactive API Docs
FastAPI provides automatic Swagger UI at:
```
http://localhost:5000/docs
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE analyses (
  id              SERIAL PRIMARY KEY,
  created_at      TIMESTAMP DEFAULT NOW(),
  resume_filename VARCHAR(255),
  fit_score       FLOAT,
  verdict         VARCHAR(50),       -- APPLY NOW / UPSKILL FIRST / LOOK ELSEWHERE
  strengths       JSON,
  gaps            JSON,
  action_plan     JSON,
  reality_check   TEXT,
  recommendation  TEXT,
  job_snippet     VARCHAR(300),      -- first 300 chars of job description
  raw_analysis    TEXT               -- full AI response
);
```

---

## ☁️ AWS Deployment

Deployed on AWS EC2 (Ubuntu 22.04) with:

- **Nginx** — reverse proxy handling HTTPS and routing
- **PM2** — process manager keeping FastAPI running 24/7
- **Certbot** — free SSL certificates from Let's Encrypt
- **PostgreSQL** — database running on the same instance
- **Elastic IP** — static IP address that never changes

### Update deployed app after code changes:
```bash
cd ~/resume-ai
git pull origin main
cd frontend && npm run build
pm2 restart resumeai-v2
```

---

## 🔐 Environment Variables

### Root `.env` (for Docker):
| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |

### `backend/.env` (for manual run):
| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |
| `DATABASE_URL` | PostgreSQL connection string |

---

## 👤 Author

**Mounic Kumar Nadimpally**
- GitHub: [@MounicKumarNadimpally](https://github.com/MounicKumarNadimpally)
- LinkedIn: [linkedin.com/in/mounic-nadimpally](https://linkedin.com/in/mounic-nadimpally)
- Live: [https://resumeai.devlaunched.com](https://resumeai.devlaunched.com)

---

*Built as a portfolio project demonstrating React, Python/FastAPI, PostgreSQL, D3.js data visualization, Google Gemini AI integration, Docker containerization, and AWS EC2 deployment with Nginx and SSL.*
