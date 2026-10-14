# PetCloud API

Python 3.12+ and FastAPI. From this directory:

```sh
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[dev]'
cp .env.example .env
uvicorn petcloud.main:app --reload
```

- API documentation: http://localhost:8000/docs
- Liveness: `GET /health`
- Database readiness: `GET /health/ready` (503 if PostgreSQL is unavailable)

Run `ruff check .` for linting. Check the health endpoints manually for a smoke test.
Dependencies are constrained in `pyproject.toml`; a production lockfile can
be introduced before deployment.

Alternatively, run `docker compose up --build -d` from the repository root
to start the API and PostgreSQL together. The container does not use live reload.
