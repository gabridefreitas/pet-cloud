# PetCloud API

FastAPI and Pydantic backend for the adoption workflow, using PostgreSQL,
JWT authentication with Argon2 password hashes, and private S3 photo storage.
Python 3.12+ is required when running outside Docker.

## Run locally

From the repository root, with Docker Desktop running:

```sh
cp .env.example .env
docker compose -f compose.yaml -f compose.local.yaml up --build --wait
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

1. The browser sends `POST /pets/{id}/photos` with multipart field `file` and its JWT.
2. The API checks organization ownership, declared type, image signature and size.
3. The API uploads the file to S3 and registers its permanent key in `pet_photos`.
4. The response is a `PetPhoto` with a presigned GET `url`. Catalog and detail
   responses also generate fresh GET URLs valid for one hour; the browser renders them.

JPEG, PNG and WebP are accepted, up to 5 MB and five photos per pet. Retrying the
same file for the same pet returns its existing photo without another S3 upload.
Uploads for a pet are serialized to enforce the limit. If photo registration
fails after upload, the API attempts to remove the newly uploaded object before
releasing the pet lock. An ambiguous database commit failure may leave an object
for later reconciliation; S3 and PostgreSQL do not share a transaction.
The organization portal supports adding photos to seeded pets and retrying a
partially completed new-pet upload without creating another pet.

There is no browser-to-S3 PUT or upload-ticket endpoint. The backend identity
needs object read, write and delete permissions in the photo prefix. No S3
browser-upload CORS configuration is required for this flow. Bucket access
remains private, but anyone holding a signed GET URL can read that object until
it expires. The browser downloads displayed images using those returned URLs;
image bytes are not proxied through the API on reads. With no bucket configured,
photo upload returns 503; pet browsing still works.

## Configuration and logs

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL URI, including any required TLS options; Compose defaults to the local database when empty/unset |
| `CORS_ORIGINS` | Allowed frontend origins as a JSON array |
| `JWT_SECRET` | Token signing secret; example values are for local development |
| `JWT_EXP_MINUTES` | Access token lifetime in minutes |
| `S3_BUCKET` | Existing private bucket for pet photos; empty disables uploads |
| `AWS_REGION` | Bucket region |

All API settings are runtime inputs. In Compose, the root `.env` or process
environment supplies them to the container; a nonempty `DATABASE_URL` overrides
the URI assembled from `POSTGRES_*`. `CORS_ORIGINS` accepts a JSON array of
browser origins, including scheme/host/port and no page paths. The default is
`["http://localhost:5173"]`. For host execution from `api/`, settings read
`api/.env`; process environment overrides that file. No cloud secret retrieval
is required, and the Docker image excludes `.env` files.

For a real deployment, inject the connection URI and signing secret at runtime
through the authorized secret-delivery mechanism. PostgreSQL TLS options travel
in the URI query, for example `?sslmode=verify-full&sslrootcert=/path/to/mounted/ca.pem`.
Use the actual database hostname and a trusted CA file mounted in the API container;
percent-encode special characters in URI credentials. Local PostgreSQL uses its
existing non-TLS Docker connection. Certificate delivery and a real RDS TLS handshake
are deferred infrastructure checks; this implementation does not contact RDS.

Restart a host-run API or recreate the Compose API service after changing settings;
settings are cached per process. Signing-key changes invalidate old tokens. Local
defaults and fictional demo credentials require no AWS setup. The local overlay
forces `S3_BUCKET` empty; API logs remain stdout/stderr without `awslogs` enabled.
Do not put API runtime secrets in `VITE_*` variables or frontend build arguments.

Each request writes a JSON event to stdout with method, route template, status
and duration. Authentication failures, denied access and unexpected errors also
produce structured events. Logs exclude submitted credentials, tokens, query strings,
request/response bodies and raw exception messages. Exception type and code locations
remain available for diagnosis. HTTP errors use `{ "detail": ... }`, including 422
validation errors.

Locally Docker keeps these logs without AWS credentials or a CloudWatch connection.
For EC2, configure Docker's `awslogs` logging driver and the instance IAM permissions
separately to forward stdout/stderr to CloudWatch Logs. The API needs no CloudWatch
SDK or keys. Browser telemetry uses optional CloudWatch RUM directly; the former
`POST /logs` endpoint has been removed.
