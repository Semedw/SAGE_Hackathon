# InsureCheck AI

AI-powered insurance application document verification system. Automates first-stage document review, scoring, and prioritization.

## Architecture

```
┌─────────────────┐     HTTP/JSON      ┌─────────────────┐
│   Next.js 16    │ ◄──────────────► │   Django 5 + DRF  │
│   (Frontend)    │    JWT Auth       │   (Backend API)   │
└─────────────────┘                    └────────┬────────┘
                                                │
                                         ┌──────▼──────┐
                                         │ PostgreSQL 16 │
                                         └──────────────┘
```

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- PostgreSQL 16 (local or hosted)

### Local Development

#### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set up your .env (copy from .env.example)
# Make sure PostgreSQL is running locally

python3 manage.py migrate
python3 manage.py seed_demo
python3 manage.py runserver 0.0.0.0:8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- Django Admin: http://localhost:8000/admin/

### Deploy to Render

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **New → Blueprint** and connect your repo
4. Render will detect `render.yaml` and create all services automatically:
   - **insurecheck-db** — Free PostgreSQL database
   - **insurecheck-api** — Django backend (Python)
   - **insurecheck-frontend** — Next.js frontend (Node)
5. After deployment, seed demo data:
   - Go to the **insurecheck-api** service → Shell tab
   - Run: `python manage.py seed_demo`

> **Note:** Free tier services spin down after 15 min of inactivity. First request after spin-down takes ~30s.

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Applicant | john@example.com | password123 |
| Reviewer | reviewer@example.com | password123 |
| Admin | admin@example.com | password123 |

## Demo Applications (Seeded)

1. **John Smith** (Good) — Score ~92, LOW risk. All documents present and consistent.
2. **Maria Garcia** (Incomplete) — Score ~55, MEDIUM risk. Missing income proof.
3. **Robert Chen** (Fraud-risk) — Score ~38, HIGH risk. Name/address mismatches.
4. **Lisa Wong** (Blurry) — Score ~48, HIGH risk. Low quality/blurry images.

## Project Structure

```
insurecheck-ai/
├── backend/                    # Django REST API
│   ├── config/                 # Django settings/urls
│   ├── apps/
│   │   ├── users/              # Auth (register/login/JWT)
│   │   ├── applications/       # Application CRUD + seed data
│   │   ├── documents/          # Upload + OCR trigger
│   │   ├── evaluations/        # Scoring engine (5 criteria)
│   │   │   └── engine/         # Criteria evaluators
│   │   ├── reviewer/           # Reviewer actions + audit logs
│   │   ├── notifications/      # In-app notifications
│   │   └── analytics/          # Dashboard stats
│   ├── services/               # OCR, image quality, audit
│   └── build.sh                # Render build script
├── frontend/                   # Next.js SPA
│   └── src/
│       ├── app/                # Pages (8 routes)
│       ├── components/         # shadcn/ui components
│       └── lib/                # API client, auth, utils
├── render.yaml                 # Render deployment blueprint
└── .env.example
```

## API Endpoints

### Auth
- `POST /api/auth/register/` — Create account
- `POST /api/auth/login/` — Get JWT tokens
- `GET /api/auth/me/` — Current user
- `POST /api/auth/refresh/` — Refresh token

### Applications
- `GET/POST /api/applications/` — List/create applications
- `GET/PATCH /api/applications/{id}/` — Application detail
- `POST /api/applications/{id}/documents/` — Upload document
- `DELETE /api/applications/{id}/documents/{doc_id}/` — Delete document
- `POST /api/applications/{id}/evaluate/` — Trigger AI evaluation
- `GET /api/applications/{id}/evaluate/result/` — Get evaluation

### Reviewer
- `GET /api/reviewer/applications/` — All apps (filtered/sorted)
- `GET /api/reviewer/applications/{id}/` — Full detail
- `POST /api/reviewer/applications/{id}/action/` — Approve/reject/correct/escalate

### Notifications
- `GET /api/notifications/` — User notifications
- `PATCH /api/notifications/{id}/read/` — Mark as read

### Analytics
- `GET /api/analytics/dashboard/` — Stats for reviewer dashboard

## Scoring System

| Criterion | Weight | What It Checks |
|-----------|--------|----------------|
| Document Completeness | 30% | Required docs present (ID, income, form) |
| Data Consistency | 20% | Cross-document name/address/date matching |
| Document Quality | 20% | Blur detection, OCR confidence, resolution |
| Identity Verification | 15% | ID patterns, name matching, face indicators |
| Risk Assessment | 15% | Suspicious patterns, tampering flags |

**Risk Levels:** Score ≥80 = LOW, 50–79 = MEDIUM, <50 = HIGH

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, TailwindCSS, shadcn/ui |
| Backend | Django 5, DRF, SimpleJWT |
| Database | PostgreSQL 16 |
| OCR | Tesseract (pytesseract) |
| Image Analysis | OpenCV, NumPy |
| Fuzzy Matching | python-Levenshtein |
| Deployment | Render (Blueprint) |

## Environment Variables

See `.env.example` for all required variables. Key ones:

```
DATABASE_URL=postgresql://user:pass@host:5432/insurecheck
DJANGO_SECRET_KEY=<generate-a-secure-key>
FRONTEND_URL=https://your-frontend.onrender.com
```

## License

MIT — Built for the Insurance Verification Hackathon.

Demo accounts: john@example.com, reviewer@example.com, admin@example.com (password: password123)
