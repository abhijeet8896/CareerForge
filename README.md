# CareerForge — AI Employability Copilot

> Analyse your resume with 8 AI agents running 100% locally via Ollama. No API keys required.

---

## What It Does

Upload your resume and get a complete employability report:

- **Resume Intelligence** — extracts skills, projects, gaps
- **GitHub Skill Verifier** — checks if claimed skills exist in real code
- **Recruiter Simulation** — shortlist probability + rejection reasons
- **ATS Optimization** — keyword matching + resume rewrites
- **Market Intelligence** — trending skills + salary range
- **Project Generator** — 3 portfolio projects tailored to your gaps
- **Roadmap Planner** — 180-day learning plan with free resources
- **What-If Simulator** — see how actions move your employability score

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, Python 3.11 |
| AI Pipeline | LangGraph, LangChain |
| LLM | Ollama (llama3.2:3b — runs locally) |
| Database | PostgreSQL |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Auth | JWT |

---

## Prerequisites

Install these before starting:

- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 20+](https://nodejs.org/)
- [PostgreSQL 16](https://www.postgresql.org/download/)
- [Ollama](https://ollama.com/download)
- [Git](https://git-scm.com/)

---

## Setup

### 1. Ollama

```bash
# Pull the model (downloads ~2GB)
ollama pull llama3.2:3b

# Verify
ollama list
```

### 2. Database

Open psql or pgAdmin and run:
```sql
CREATE DATABASE careerforge;
```

### 3. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env   # Windows: copy .env.example .env
```

Edit `.env` and set:
```
DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@localhost:5432/careerforge
SYNC_DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/careerforge
SECRET_KEY=any-long-random-string
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
GITHUB_TOKEN=ghp_yourtoken   # optional
```

```bash
# Start backend
uvicorn app.main:app --reload --port 8000
```

Verify at `http://localhost:8000/health`

### 4. Frontend

Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

---

## GitHub Token (Optional)

Enables the GitHub Skill Verification page. Without it everything else works normally.

1. GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
2. Generate new token — select scopes: `read:user` and `public_repo`
3. Add to `.env`: `GITHUB_TOKEN=ghp_yourtoken`

---

## Every Time You Start

```bash
# Terminal 1 — Backend
cd backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Ollama runs automatically in the background after install.
If it's not running: `ollama serve`

---

## Model Options

| Model | Size | RAM | Speed |
|---|---|---|---|
| llama3.2:3b *(default)* | 2 GB | 4 GB | Fast |
| mistral:7b | 4 GB | 6 GB | Medium |
| llama3.1:8b | 5 GB | 8 GB | Slow |

To change model: update `OLLAMA_MODEL` in `.env` and restart backend.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Ollama offline (red dot in sidebar) | Run `ollama serve` |
| Analysis fails | Run `ollama list` — confirm model is downloaded |
| Database error | Check PostgreSQL is running, verify password in `.env` |
| `venv` won't activate on Windows | Run PowerShell as admin: `Set-ExecutionPolicy RemoteSigned` |
| Port already in use | Change port: `uvicorn app.main:app --port 8001` |
| Resume text not extracted | Use a text-based PDF, not a scanned image |

---

## API Endpoints

POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me
POST   /api/v1/analysis/upload
GET    /api/v1/analysis/history
GET    /api/v1/analysis/roadmap/latest
POST   /api/v1/analysis/whatif
GET    /api/v1/analysis/{id}
GET    /api/v1/health/ollama
GET    /health

Swagger UI: `http://localhost:8000/docs`

---

## License

MIT
