# PostgreSQL

Local development uses PostgreSQL 17 through the root `compose.yaml`.
AWS will use Amazon RDS for PostgreSQL. This directory is for database
documentation and future versioned schema migrations, not database data files.

No adoption schema is defined yet. Once the data model is agreed on, add
migrations managed by the API (for example, Alembic) rather than manually
maintaining separate local and production schemas.

```sh
docker compose up -d db
docker compose exec db psql -U petcloud -d petcloud
```

The named Docker volume preserves data between restarts. Credentials in
`.env.example` are for local development only. If you change the root `.env`,
update `api/.env` accordingly when running the API outside Docker.
