# CareerForge — AI Employability Copilot

> **100% local AI** — no API keys, no cloud costs. Runs entirely on your machine with Ollama.

CareerForge is a multi-agent AI system that analyses your resume, verifies your GitHub skills, simulates a technical recruiter review, scores your ATS compatibility, maps job market demand, recommends portfolio projects, and generates a personalised 180-day learning roadmap — all running locally on your CPU via Ollama.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts, Zustand |
| Backend | FastAPI, Python 3.11, SQLAlchemy 2 (async), LangGraph |
| AI | Ollama (local), LangChain, llama3.2:3b (default) |
| Database | PostgreSQL 16 |
| File parsing | PyPDF2, python-docx |
| Auth | JWT (python-jose), bcrypt |

---

## Prerequisites

Install all of the following before starting:

| Tool | Version | Download |
|---|---|---|
| Python | 3.11+ | https://www.python.org/downloads/ |
| Node.js | 20+ | https://nodejs.org/ |
| PostgreSQL | 16 | https://www.postgresql.org/download/ |
| Ollama | Latest | https://ollama.com/download |
| Git | Any | https://git-scm.com/ |
| Docker Desktop | Latest (optional) | https://www.docker.com/products/docker-desktop/ |

---

## Section 3 — Ollama Setup ⚠️ REQUIRED BEFORE FIRST RUN

Ollama is the local AI runtime that replaces OpenAI. You **must** complete these steps or the analysis pipeline will not work.

### Step 1 — Install Ollama

Download and install from: **https://ollama.com/download**

- **Windows/Mac:** Run the installer. Ollama starts as a background service automatically.
- **Linux:** Run `curl -fsSL https://ollama.com/install.sh | sh`

### Step 2 — Verify Ollama is running

```bash
curl http://localhost:11434/api/tags
```

Expected response: JSON like `{"models":[...]}` — even if the list is empty.

If you get "connection refused", start Ollama manually:
- **Windows/Mac:** Open the Ollama application from your Applications/Start menu.
- **Linux:** `ollama serve`

### Step 3 — Pull the required model

```bash
ollama pull llama3.2:3b
```

This downloads ~2GB. Wait for it to complete. You will see a progress bar.

### Step 4 — Verify the model is available

```bash
ollama list
```

You should see `llama3.2:3b` in the list.

### Step 5 — Test the model (optional)

```bash
ollama run llama3.2:3b "Say hello in one sentence"
```

If it responds, Ollama is working correctly.

### System Requirements

| Requirement | Minimum | Recommended |
|---|---|---|
| RAM | 8 GB | 16 GB |
| Disk space | 5 GB free | 10 GB free |
| CPU | Any modern CPU | Multi-core (faster inference) |
| GPU | Not required | Optional (speeds up inference) |

> **Note:** The first analysis will be slower (30–60 seconds extra) while Ollama loads the model into RAM. Subsequent analyses are faster while the model stays resident.

---

## Section 4 — GitHub Token Setup (Optional)

The GitHub token enables the **GitHub Intelligence** page which verifies your claimed skills against real code in your public repositories.

**Without a token:** The GitHub page shows "GITHUB_TOKEN not configured". All other 9 pages work normally.

### How to get a GitHub token

1. Go to [github.com](https://github.com) → click your **avatar** (top-right) → **Settings**
2. Scroll to the bottom of the left sidebar → **Developer settings**
3. Click **Personal access tokens** → **Tokens (classic)**
4. Click **Generate new token (classic)**
5. Note: `CareerForge local`
6. Expiration: **90 days**
7. Check **only** these scopes: `read:user`, `public_repo`
8. Click **Generate token**
9. Copy the token — it starts with `ghp_`
10. Add it to `backend/.env`:

```
GITHUB_TOKEN=ghp_yourtoken
```

---

## Section 5 — Method A: Run Without Docker (Recommended for Development)

### Step 1 — Get the project

```bash
cd careerforge
```

### Step 2 — Set up the database

Install PostgreSQL 16 from https://www.postgresql.org/download/

Then open `psql` or pgAdmin and run:

```sql
CREATE DATABASE careerforge;
CREATE USER postgres WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE careerforge TO postgres;
```

> If `postgres` user already exists, just run the GRANT command.

### Step 3 — Set up the backend

```bash
cd backend
python -m venv venv
```

**Windows (PowerShell):**
```powershell
venv\Scripts\Activate.ps1
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

Then install dependencies:

```bash
pip install -r requirements.txt
```

Copy and configure your `.env` file:

**Windows:**
```powershell
copy .env.example .env
```

**Mac/Linux:**
```bash
cp .env.example .env
```

Open `.env` in a text editor and update these values:

```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/careerforge
SYNC_DATABASE_URL=postgresql://postgres:password@localhost:5432/careerforge
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
SECRET_KEY=change-this-to-any-long-random-string-minimum-32-chars
GITHUB_TOKEN=ghp_your_token_here
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

Verify it's running — open http://localhost:8000/health in your browser.

Expected response:
```json
{"status":"ok","app":"CareerForge","version":"1.0.0","env":"development"}
```

### Step 4 — Set up the frontend (new terminal window)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser. You should see the CareerForge login page.

### Step 5 — Verify Ollama connection

Open http://localhost:8000/api/v1/health/ollama in your browser.

Expected (model ready):
```json
{
  "status": "ok",
  "model": "llama3.2:3b",
  "model_ready": true,
  "available_models": ["llama3.2:3b"]
}
```

If `model_ready` is `false`, run:
```bash
ollama pull llama3.2:3b
```

---

## Section 6 — Method B: Run With Docker

### Prerequisites

Docker Desktop must be installed and running.

### Step 1 — Copy and configure `.env`

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set:

```env
SECRET_KEY=change-this-to-any-long-random-string
GITHUB_TOKEN=ghp_your_token_here
```

> The Docker Compose file automatically overrides `DATABASE_URL` and `OLLAMA_BASE_URL` with correct Docker network URLs — you do not need to change those.

### Step 2 — Start all services

```bash
docker-compose up --build
```

This starts: PostgreSQL, Ollama, Backend (FastAPI), Frontend (nginx).

### Step 3 — Pull the Ollama model inside Docker

Wait for all containers to start (watch the logs until you see `CareerForge API starting up`).

Then in a **new terminal**, run:

```bash
docker exec careerforge-ollama-1 ollama pull llama3.2:3b
```

This downloads the model inside the container (~2GB). Wait for it to complete.

> **Note:** The model is stored in the `ollama_data` Docker volume and persists across container restarts. You only need to pull it once.

### Step 4 — Access the app

| URL | Purpose |
|---|---|
| http://localhost:3000 | Frontend application |
| http://localhost:8000/docs | API documentation (Swagger) |
| http://localhost:8000/health | Backend health check |
| http://localhost:8000/api/v1/health/ollama | Ollama connection status |

---

## Section 7 — First Use Guide

1. Open the app in your browser (http://localhost:5173 or http://localhost:3000)
2. Click **"Create one free"** on the login page to register
3. Fill in:
   - **Name** — your full name
   - **Email** — your email address
   - **Password** — minimum 6 characters
   - **Target Role** — e.g. "Frontend Developer", "Python Backend Engineer"
   - **GitHub Username** — optional, enables skill verification
4. Click **Register**
5. You will be taken to the Overview dashboard
6. Click **"Upload Resume"** in the left sidebar
7. Drag and drop your PDF or DOCX resume (max 5 MB)
8. Fill in **Target Role** (pre-filled from registration) and optionally paste a **Job Description** for better ATS matching
9. Click **"Analyse My Profile"**
10. Watch the agent progress panel — 8 agents run in sequence
11. **First analysis takes 3–8 minutes** (Ollama loads model into RAM)
12. Subsequent analyses are faster (model stays in memory)
13. After completion you are automatically redirected to the Overview dashboard
14. Explore each section in the left sidebar:
    - **Overview** — overall employability score with charts
    - **Resume Intel** — extracted skills, projects, gaps
    - **GitHub Intel** — skill verification against your real code
    - **Recruiter Sim** — AI recruiter verdict and feedback
    - **Market Demand** — trending skills and salary ranges
    - **Projects** — 3 AI-recommended portfolio projects
    - **Roadmap** — 180-day personalised learning plan
    - **ATS Score** — keyword matching and rewrite suggestions
    - **What-If** — simulate score impact of learning new skills

---

## Section 8 — Performance Tips

- **First analysis is slowest** — Ollama cold-starts the model into RAM (~30–60s extra)
- **Keep Ollama running** in the background for faster subsequent analyses
- **Close heavy applications** (Chrome tabs, video streaming) during analysis to free RAM
- **llama3.2:3b** runs on any modern CPU with 4–6GB RAM available
- If analysis fails mid-way, check the backend logs — each failed agent returns a default result so the pipeline never crashes completely

---

## Section 9 — Changing the Model

To switch to a better (but slower) model:

**Step 1 — Pull the model first:**
```bash
ollama pull mistral:7b
```

**Step 2 — Update `backend/.env`:**
```env
OLLAMA_MODEL=mistral:7b
```

**Step 3 — Restart the backend.**

### Model Comparison

| Model | Download Size | RAM Required | Speed | Output Quality |
|---|---|---|---|---|
| `llama3.2:3b` | ~2 GB | 4 GB | Fast (~3–5 min analysis) | Good |
| `mistral:7b` | ~4 GB | 6 GB | Medium (~6–10 min) | Better |
| `llama3.1:8b` | ~5 GB | 8 GB | Slow (~10–15 min) | Best |

> **Recommendation:** Start with `llama3.2:3b`. If you have 16GB RAM, `mistral:7b` gives noticeably better JSON structure and analysis quality.

---

## Section 10 — Troubleshooting

**Problem:** Ollama status dot in sidebar is red ("Ollama offline")
**Fix:** Make sure Ollama is running.
- Windows/Mac: Open the Ollama app from your applications list
- Linux: `ollama serve`

---

**Problem:** Analysis fails immediately after clicking "Analyse My Profile"
**Fix:** Check http://localhost:8000/api/v1/health/ollama — if `model_ready` is `false`, run:
```bash
ollama pull llama3.2:3b
```

---

**Problem:** Analysis hangs for more than 15 minutes
**Fix:** The model may have run out of RAM. Restart Ollama and try again. Close other applications to free memory.

---

**Problem:** "Could not extract text from resume"
**Fix:** Your PDF may be a scanned image (not text-based). Use a text-based PDF. If your PDF is scanned, convert it first using an online OCR tool like https://www.ilovepdf.com/

---

**Problem:** Frontend shows a blank page
**Fix:**
1. Check the browser console (F12) for errors
2. Make sure the backend is running on port 8000
3. Check that CORS is configured in `.env`: `ALLOWED_ORIGINS=http://localhost:5173`

---

**Problem:** Database connection error on startup
**Fix:**
1. Make sure PostgreSQL is running
2. Check `DATABASE_URL` in `.env` matches your PostgreSQL credentials
3. Verify the `careerforge` database exists: `psql -U postgres -c "\l"`

---

**Problem:** Login fails after registering
**Fix:** Check that `SECRET_KEY` is set in `.env`. It must be the same value between restarts. Never leave it as the default.

---

**Problem:** GitHub Intel page shows "GITHUB_TOKEN not configured"
**Fix:** Add `GITHUB_TOKEN=ghp_yourtoken` to `backend/.env` and restart the backend. Token needs `read:user` and `public_repo` scopes. See Section 4 for setup instructions.

---

**Problem:** `langchain_ollama` import error on backend start
**Fix:** Make sure you are in the virtual environment and run:
```bash
pip install -r requirements.txt
```

---

## Section 11 — Project Structure

```
careerforge/
│
├── backend/                         # FastAPI Python backend
│   ├── app/
│   │   ├── agents/
│   │   │   ├── state.py             # LangGraph shared state TypedDict
│   │   │   ├── graph.py             # Agent pipeline wiring
│   │   │   ├── supervisor.py        # Input validation and routing
│   │   │   ├── resume_agent.py      # Resume parsing via Ollama
│   │   │   ├── github_agent.py      # GitHub skill verification (no LLM)
│   │   │   ├── recruiter_agent.py   # Recruiter simulation via Ollama
│   │   │   ├── ats_agent.py         # ATS keyword analysis via Ollama
│   │   │   ├── market_agent.py      # Market demand analysis via Ollama
│   │   │   ├── project_agent.py     # Portfolio project generation via Ollama
│   │   │   ├── roadmap_agent.py     # 180-day roadmap generation via Ollama
│   │   │   └── scoring.py           # Employability score aggregation (no LLM)
│   │   ├── api/
│   │   │   ├── auth.py              # Register, login, /me endpoints
│   │   │   ├── analysis.py          # Upload, history, roadmap, whatif endpoints
│   │   │   └── health.py            # /health/ollama status endpoint
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic settings (reads .env)
│   │   │   └── security.py          # JWT creation/validation, password hashing
│   │   ├── db/
│   │   │   └── database.py          # SQLAlchemy async engine and session
│   │   ├── models/
│   │   │   └── models.py            # SQLAlchemy ORM models
│   │   ├── schemas/
│   │   │   └── schemas.py           # Pydantic request/response schemas
│   │   ├── services/
│   │   │   └── analysis_service.py  # Orchestrates pipeline, file parsing, DB writes
│   │   └── main.py                  # FastAPI app, CORS, startup, routers
│   ├── .env.example                 # Environment variable template
│   ├── requirements.txt             # Python dependencies
│   └── Dockerfile                   # Backend container definition
│
├── frontend/                        # React TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardLayout.tsx  # Sidebar, nav, Ollama status indicator
│   │   │   └── ui/
│   │   │       ├── ScoreRing.tsx        # Animated SVG score ring component
│   │   │       └── EmptyState.tsx       # Empty state with CTA button
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx            # Login form
│   │   │   ├── RegisterPage.tsx         # Registration form
│   │   │   ├── OverviewPage.tsx         # Score charts, strengths, weaknesses
│   │   │   ├── UploadPage.tsx           # Resume upload with agent progress
│   │   │   ├── ResumeIntelPage.tsx      # Skills, projects, education
│   │   │   ├── GitHubIntelPage.tsx      # GitHub skill verification
│   │   │   ├── RecruiterSimPage.tsx     # Recruiter verdict and feedback
│   │   │   ├── MarketPage.tsx           # Market demand charts and salary
│   │   │   ├── ProjectsPage.tsx         # Recommended portfolio projects
│   │   │   ├── RoadmapPage.tsx          # 180-day accordion roadmap
│   │   │   ├── ATSPage.tsx              # ATS score, keywords, rewrites
│   │   │   └── WhatIfPage.tsx           # What-if score simulator
│   │   ├── services/
│   │   │   └── api.ts                   # Axios client, auth/analysis/health APIs
│   │   ├── store/
│   │   │   ├── authStore.ts             # Zustand auth state
│   │   │   └── analysisStore.ts         # Zustand analysis state
│   │   ├── App.tsx                      # Routes, AuthGuard, GuestGuard
│   │   └── index.css                    # Tailwind + custom design system
│   ├── package.json
│   ├── vite.config.ts                   # Vite config with proxy to backend
│   └── Dockerfile                       # Frontend container definition
│
├── docker-compose.yml               # Orchestrates db, ollama, backend, frontend
└── README.md                        # This file
```

---

## Section 12 — API Reference

All API endpoints are documented interactively at: **http://localhost:8000/docs**

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | No | Register a new user account |
| `POST` | `/api/v1/auth/login` | No | Login and receive JWT token |
| `GET` | `/api/v1/auth/me` | Yes | Get current user profile |
| `POST` | `/api/v1/analysis/upload` | Yes | Upload resume and run full 8-agent analysis |
| `GET` | `/api/v1/analysis/history` | Yes | Get last 20 analyses for current user |
| `GET` | `/api/v1/analysis/roadmap/latest` | Yes | Get most recent roadmap for current user |
| `POST` | `/api/v1/analysis/whatif` | Yes | Simulate score impact of hypothetical scenarios |
| `GET` | `/api/v1/analysis/{id}` | Yes | Get a specific analysis by ID |
| `GET` | `/api/v1/health/ollama` | No | Check Ollama connectivity and model availability |
| `GET` | `/health` | No | Backend health check |

### Authentication

All protected endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The token is returned by `/auth/register` and `/auth/login` and automatically stored in `localStorage` by the frontend.

---

## Quick Start Commands

```bash
# 1. Pull Ollama model (one-time, ~2GB download)
ollama pull llama3.2:3b

# 2. Start backend
cd backend && python -m venv venv && venv\Scripts\activate  # Windows
pip install -r requirements.txt
copy .env.example .env  # then edit .env
uvicorn app.main:app --reload --port 8000

# 3. Start frontend (new terminal)
cd frontend && npm install && npm run dev

# 4. Open app
# http://localhost:5173
```
