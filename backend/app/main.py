from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import Base, engine
from app.models import models  # noqa: F401 - ensures models are registered
from app.api import auth, cases, investigations, reports, dashboard, users, institutions, evidence

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CRYPTATRACE - solving transaction fraud")


@app.on_event("startup")
def seed_demo_data_if_empty():
    """Auto-seeds demo institutions/users/cases on first boot so a fresh
    deployment (e.g. Render with an empty SQLite/Postgres database) has a
    working demo login without needing manual shell access. seed() is
    idempotent - it checks for existing data and no-ops if any is found,
    so this is also safe to run on every restart."""
    try:
        from app.core.seed_data import seed
        seed()
    except Exception as e:  # never let a seeding hiccup take the app down
        print(f"[startup] Demo data seed skipped due to error: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Never leak raw stack traces to the client.
    return JSONResponse(status_code=500, content={"detail": "An internal error occurred. Please try again."})


app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(cases.router)
app.include_router(investigations.router)
app.include_router(reports.router)
app.include_router(evidence.router)
app.include_router(users.router)
app.include_router(institutions.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "ATHENS backend"}
