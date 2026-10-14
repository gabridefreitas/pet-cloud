# PetCloud

- Special Topics in Computing: Trending Information Technologies
- Professor: Daniel Stefani Marcon
- UNISINOS - Universidade do Vale do Rio dos Sinos
- São Leopoldo - 2026/2


## Group H

- Gabriel de Freitas
- Lucas Fischer
- Luiz Dias
- Vinicius Jaeger

## Project structure

- `app/`: React, Vite, and TypeScript frontend.
- `api/`: Python FastAPI backend.
- `db/`: PostgreSQL documentation and future schema migrations.
- `aws/`: AWS deployment documentation and future infrastructure scripts.

## Local development

Prerequisites: Docker with Compose, Node.js 22.12+, and pnpm 11.25.
Python 3.12+ is needed only if running the API outside Docker.

Start Docker Desktop, then run from the repository root:

```sh
cp .env.example .env
docker compose up --build -d
```

In another terminal:

```sh
cd app
pnpm install
cp .env.example .env
pnpm dev
```

Open http://localhost:5173 and use **Check API connection**.
API docs are available at http://localhost:8000/docs.
Visit http://localhost:8000/health/ready to check the database connection.
Use `docker compose down` to stop the services while keeping database data.

For a Python virtual environment and backend live reload, follow `api/README.md`
and start only PostgreSQL with `docker compose up -d db`.

## AWS architecture

The frontend build is served from a private S3 bucket through CloudFront.
The API runs on EC2 and connects to RDS PostgreSQL. A separate S3 bucket
stores pet images. CloudWatch collects backend logs; CloudWatch RUM handles
browser errors once configured. See `aws/README.md` for the deployment plan.

This is a development starter. Authentication, adoption features, schema
migrations, AWS resources, and monitoring integration are not implemented yet.
