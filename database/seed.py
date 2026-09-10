"""
Manual local seeding entrypoint.

The backend now also seeds itself automatically on startup if the
database is empty (see backend/app/main.py), so running this script by
hand is optional - useful mainly for local resets after deleting
athens.db.

Run with:  python database/seed.py   (from repo root, backend venv active)
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.core.seed_data import seed  # noqa: E402

if __name__ == "__main__":
    seed()
