# Local database and demo data

`db/schema.sql` is the single schema definition. The API applies it on startup;
the Docker image includes this same file. This stage uses a local PostgreSQL
database, with no migration tooling or environment synchronization.

Start the stack from the repository root, then populate an empty database:

```sh
cp .env.example .env
docker compose -f compose.yaml -f compose.local.yaml up --build --wait
docker compose exec api python -m scripts.seed_demo
```

The seed creates two fictional organizations, one member per organization,
three adopters, 24 pets, and five adoption requests. Pet attributes and form
answers are randomized with a fixed default seed (`--seed 42`) for repeatability.
Available pets span both species, sizes, age groups, and organizations. Requests
include pending, approved, rejected, and cancelled examples. One approved
request has its pet in `pending` status.

| Account | Role | Organization |
| --- | --- | --- |
| `carlos@happypaws.example` | organization_member | Happy Paws Shelter (A) |
| `julia@secondchance.example` | organization_member | Second Chance Shelter (B) |
| `marina@petcloud.example` | adopter | None |
| `pedro@petcloud.example` | adopter | None |
| `ana@petcloud.example` | adopter | None |

All demo accounts use the local-only password `petcloud123`, stored as an
Argon2 hash. No administrator account exists. The script refuses to populate
a database that already contains users; it does not delete or overwrite data.
Pets initially have no photos, and the frontend displays its empty-image state.
With S3 configured, members can add photos to these pets from their portal.

Outside Docker, start PostgreSQL, set `DATABASE_URL` in `api/.env`, and run:

```sh
cd api
python -m scripts.seed_demo
```

The seed also applies the schema, so it can run before starting the API.
Only use this initial schema with an empty local database; updating existing
schemas is outside this task's scope. The Docker volume persists between restarts.

## Assisted organization provisioning (Extra)

Organization accounts and their operational portal are implemented **Extra**
functionality beyond the Grade A adopter journey. An organization contacts the
PetCloud team, which provides its account and member access. Public registration
creates adopters; there is no application administrator role or public NGO signup.

With the local stack running, a trusted team operator can run the existing
interactive backend command from the repository root:

```sh
docker compose exec api python -m scripts.create_organization
```

For a host-run API, run `python -m scripts.create_organization` from `api/`, using
the intended API database configuration. The schema must already exist. The
command asks for organization details, the first member's name/login email and
a confirmed password (at least eight characters, prompted without echo). It
creates the organization and linked member in one transaction and stores an
Argon2 password hash. Do not put passwords in command arguments or documentation.
Running this procedure writes to the selected database; it is not a seed reset.

Members log in through `/login` and are redirected to `/organization`. The footer's
Organization portal link leads to that guarded route; visitors are redirected to
login, and adopter accounts do not gain organization access.

The schema supports multiple members of one organization. They share that
organization's pet/request queue and authorization boundary; members cannot act
on another organization's records. Request decisions lock the row and accept
only pending requests, preventing a second resolution of the same request.
The command above provisions only the first member. Additional-member tooling,
invitations and password-management flows are not implemented or added to the
required Grade A backlog.
