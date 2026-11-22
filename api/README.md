# PetCloud API

FastAPI and Pydantic backend for the adoption workflow, using PostgreSQL,
JWT authentication with Argon2 password hashes, and private S3 photo storage.
Python 3.12+ is required when running outside Docker.

## Run locally

From the repository root, with Docker Desktop running:

```sh
cp .env.example .env
docker compose up --build --wait
docker compose exec api python -m scripts.seed_demo
```

See [demo accounts and sample data](../db/README.md). The seed is intended for
an empty local database and never clears existing data.

For a Python virtual environment and live reload:

```sh
docker compose up -d db
cd api
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[dev]'
cp .env.example .env
python -m scripts.seed_demo
uvicorn petcloud.main:app --reload
```

Interactive API documentation: http://localhost:8000/docs.
`GET /health` checks API liveness; `GET /health/ready` checks the database.
Run backend lint with `python -m ruff check petcloud scripts` from `api/`.

## Contract and ownership

The frontend's `app/src/types/index.ts`, services, and rendered fields define
the HTTP contract. The Pydantic models implement that contract, including
`PetDetails.organization`, `Pet.photos[].url`, and paginated catalog results.
See the [endpoint table](../app/README.md#api-contract).

Only two user roles exist:

- `adopter`: public registration, adoption requests, and own request history.
- `organization_member`: pet management and request decisions for the linked organization.

Every pet and adoption request belongs to an organization. Creation derives the
organization from the authenticated member; clients cannot assign another one.
Members of organization B cannot modify pets, issue upload URLs, or review
requests belonging to organization A. Unauthorized resource access returns 404.

Accounts are authenticated with `Authorization: Bearer <JWT>`. Only adopters
can register publicly. The demo seed creates the two organization accounts;
`python -m scripts.create_organization` can create another local organization
and its member without any administrator user in the application.

Only available pets accept requests. Duplicate pending requests return 409.
Only pending requests can be reviewed. Approval locks the pet and changes its
status to `pending`; another approval for an unavailable pet returns 409.

## Database

`db/schema.sql` is the single initial schema, applied at API startup or by the
demo seed. The image is built from the repository root with `api/Dockerfile`.
Database tables store adoption data and S3 object keys, never image bytes or
expiring presigned URLs. No migrations are introduced for this local stage.

## Photos

Set `S3_BUCKET` to an existing private bucket and `AWS_REGION` to its region.
Local boto3 uses the default AWS credential chain; no credentials are sent to
the browser. Configuring or provisioning AWS resources is a separate action.

1. The member requests `POST /pets/{id}/photos/upload-url` with a filename and content type.
2. The API authorizes ownership and returns a presigned PUT URL valid for 10 minutes.
3. The browser uploads directly to S3 with the signed content type.
4. The member posts `{ "s3_key": "pets/..." }` to `/pets/{id}/photos`.
5. The API checks the object type/size, stores its permanent key in `pet_photos`,
   and returns a photo with a presigned GET `url`. Catalog and detail responses
   generate fresh GET URLs valid for one hour. The frontend renders that URL.

JPEG, PNG and WebP are accepted, up to 5 MB and five photos per pet. Repeating
registration of the same key returns the same photo instead of duplicating it.
The organization portal supports adding photos to seeded pets and retrying a
partially completed new-pet upload without creating another pet.

The bucket must allow browser PUT requests from `http://localhost:5173` with
`Content-Type` in its CORS configuration. The backend identity needs object
read, write and delete permissions in the photo prefix. Bucket access remains
private, but anyone holding a signed URL can use it until it expires. Browsing
the public catalog intentionally makes its photo URLs available to visitors.
With no bucket configured, photo upload returns 503; pet browsing still works.

## Configuration and logs

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Local PostgreSQL connection |
| `CORS_ORIGINS` | Allowed frontend origins as a JSON array |
| `JWT_SECRET` | Token signing secret; example values are for local development |
| `JWT_EXP_MINUTES` | Access token lifetime in minutes |
| `S3_BUCKET` | Existing private bucket for pet photos; empty disables uploads |
| `AWS_REGION` | Bucket region |

Each request writes JSON logs to stdout. `POST /logs` accepts browser error
reports. HTTP errors use `{ "detail": ... }`, including validation errors with
status 422. Set the frontend's optional `VITE_LOG_ENDPOINT` to
`http://localhost:8000/logs` to send browser errors to the API.
