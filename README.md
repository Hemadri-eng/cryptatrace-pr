# ATHENS — Blockchain Intelligence & Fraud Investigation Platform

An NCRP-style investigation portal prototype built for **Smart India Hackathon 2026**,
Problem Statement 26183: *Real-Time Identification of Fraud-Linked Cryptocurrency
Exchanges from Victim-Reported Suspect Wallet Addresses through Automated Blockchain
Analytics.*

> All blockchain data, wallet addresses, and exchange attributions in this build are
> **simulated demo data** for demonstration purposes. No real blockchain, exchange,
> or financial data is used or represented.

## What it does

An investigator submits a suspected wallet address or transaction hash from an NCRP-style
report form. ATHENS automatically:

1. Traces funds across multiple hops (with branches and cycle-safe traversal)
2. Builds an interactive wallet-relationship graph
3. Detects behavioural red flags (layering, rapid movement, fan-out/fan-in, high-risk
   entity interaction, dormant-to-active wallets)
4. Computes a transparent, explainable 0–100 risk score
5. Identifies a probable destination exchange/VASP with a confidence score
6. Compiles supporting evidence and a chronological timeline
7. Generates a printable investigation report

## Architecture

```
React (Vite, Tailwind, React Flow, Recharts)
        │  REST + JWT
        ▼
FastAPI
        │
        ▼
SQLAlchemy ORM
        │
        ▼
SQLite (dev) — swappable to PostgreSQL via DATABASE_URL
        │
        ▼
Blockchain Service Abstraction (services/blockchain/base.py)
        │
        ▼
MockBlockchainProvider (deterministic simulated data)
   — swap for a real EVM provider later via BLOCKCHAIN_PROVIDER env var —

Risk scoring: services/risk_engine/ (RuleEngine today, MLEngine extension point later)
```

### Multi-tenant / data isolation

Every institution-owned resource (`cases`, `investigations`, `evidence`, `reports`,
`audit_logs`) carries an `institution_id`. Every backend query is scoped to the
authenticated user's institution — **never** filtered only on the frontend. Cross-institution
access returns `404 Not Found` without confirming whether the resource exists elsewhere.

## Project structure

```
athens/
├── backend/            FastAPI app (app/api, app/models, app/services, app/auth, app/core)
├── frontend/           React + Vite app (src/pages, src/components, src/services)
├── database/seed.py    Demo data seeder (2 institutions, 5 users, 3 cases)
├── .env.example
└── README.md
```

## Installation & running locally

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env         # edit values as needed
python ../database/seed.py      # creates demo institutions, users, and cases
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at `http://localhost:8000`. Interactive API docs at `/docs`.

### 2. Frontend

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000/api" > .env
npm run dev
```

Frontend runs at `http://localhost:5173`.

To build for production: `npm run build` (outputs to `frontend/dist`).

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./athens.db` |
| `JWT_SECRET` | Secret used to sign JWTs — **change in production** | dev placeholder |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `JWT_EXPIRE_MINUTES` | Token lifetime | `480` |
| `BLOCKCHAIN_PROVIDER` | `mock` today; select a real EVM provider later | `mock` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173,...` |
| `HOST`, `PORT` | Backend bind address | `0.0.0.0`, `8000` |
| `VITE_API_URL` | Frontend → backend base URL | `http://localhost:8000/api` |

No secrets are hardcoded anywhere in the codebase; `.env` files are gitignored.

## Demo accounts

All demo accounts share the password: **`Athens@2026`**

| Email | Role | Institution |
|---|---|---|
| `superadmin@athens.demo` | SUPER_ADMIN | — (system-level) |
| `admin@athens.demo` | INSTITUTION_ADMIN | Athens Cyber Crime Unit |
| `investigator@athens.demo` | INVESTIGATOR | Athens Cyber Crime Unit |
| `admin@dfiu.demo` | INSTITUTION_ADMIN | Demo Financial Intelligence Unit |
| `investigator@dfiu.demo` | INVESTIGATOR | Demo Financial Intelligence Unit |

**To see tenant isolation in action:** log in as `investigator@athens.demo`, note a case ID
in the URL, then log out and log in as `investigator@dfiu.demo` — that case ID returns
"Case not found."

## Demo walkthrough

1. Log in as `investigator@athens.demo`
2. Open **Cases** → `ATH-2026-0001` — a pre-computed CRITICAL (99/100) case with full
   graph, findings, evidence, and timeline already populated
3. Or click **New Report**, fill in the form with any wallet address (e.g. `0xTEST123...`),
   click **Submit & Investigate**, and watch the automated investigation run
4. Explore the **Fund Flow** tab (interactive graph — click nodes/edges for detail),
   **Evidence**, **Timeline**, and **Investigation** tabs
5. Click **Generate Report** to produce a printable investigation report

## Security notes

- Passwords are hashed with bcrypt; plaintext passwords are never stored
- JWTs carry user id, institution id, and role; every protected endpoint validates the
  token and re-derives the institution scope server-side
- All list/detail endpoints filter by the authenticated user's `institution_id`
- Unhandled exceptions return a generic message; stack traces are never sent to the client
- This is a **hackathon prototype** — it has not been audited or certified against any
  government security standard.

## Deployment readiness

- Backend binds to `0.0.0.0` on a configurable port and reads all config from environment
  variables — no hardcoded localhost references
- Frontend reads the API base URL from `VITE_API_URL` at build time
- SQLite is used for local development; switching to PostgreSQL only requires changing
  `DATABASE_URL` (SQLAlchemy handles the rest)
- Frontend and backend can be deployed and scaled independently

## Extending toward production

- **Real blockchain data:** implement `EvmProvider` in `backend/app/services/blockchain/`
  against the same `BlockchainProvider` interface, then set `BLOCKCHAIN_PROVIDER=evm`
- **ML-based risk scoring:** implement `MLEngine` in `backend/app/services/risk_engine/`
  against the same `RiskEngine` interface once labelled case outcomes are available
