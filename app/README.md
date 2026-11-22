# PetCloud web

React + Vite + TypeScript single-page app, styled with Tailwind CSS, routed
with React Router, and using `lucide-react` icons.
Requires Node.js 22.12+ and pnpm 11.25 (the version used for the lockfile).

```sh
pnpm install
cp .env.example .env
pnpm dev
```

Open http://localhost:5173. The footer shows whether the backend's `/health`
endpoint responds (API liveness, not PostgreSQL readiness).

```sh
pnpm lint
pnpm build
pnpm preview
```

The production build is in `dist/`, ready for S3 + CloudFront.
Set `VITE_API_URL` to the HTTPS API URL before building for AWS.

## Environment variables

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Base URL of the API (`http://localhost:8000` locally, the HTTPS EC2 URL in AWS). |
| `VITE_USE_MOCKS` | `true` explicitly enables mocks; otherwise services use the real API. |
| `VITE_LOG_ENDPOINT` | Optional URL that receives browser error logs as JSON (for CloudWatch). Empty disables it. |

Vite embeds these values at build time. Never put secrets in them.

## Local API integration

Start the API and populate the database using the [root instructions](../README.md#local-development).
Keep `VITE_USE_MOCKS=false` and `VITE_API_URL=http://localhost:8000` in `app/.env`.
Restart Vite after changing configuration. The [database guide](../db/README.md)
lists persistent local demo accounts. Mock credentials with the same email do
not create a real API account; run the seed first.

Login stores a JWT and restores the user with `/auth/me` after reload. An expired
token clears the session. A network/server failure during session restoration
offers retry without silently discarding the token. Mock and real tokens use
separate storage keys. Catalog and portal services show loading, empty and
error states rather than falling back to mock data.

Organization members can add photos to existing pets from their portal. If a
photo fails during new-pet creation, retry uploads the remaining photos without
creating the pet again. Photos are rendered from the API's `photos[].url`.

## Mock mode

While `VITE_USE_MOCKS` is on, `src/mocks/` answers every request with the same
behavior the API must have: auth checks, HTTP errors, and business rules. Data
lives in memory and resets when the page reloads. Demo accounts (password
`petcloud123`, also listed on the login page):

- `marina@petcloud.example`: adopter
- `carlos@happypaws.example`: member of the Happy Paws Shelter organization

Mock photos are in `public/mock-pets/`. Mocks remain an explicit optional demo and are never a fallback for API errors.

## Source structure

```
src/
  types/        Domain types shared with the API (snake_case, like the database)
  services/     HTTP client (api.ts) and one module per resource; each function documents its route
  mocks/        In-memory mock backend used while VITE_USE_MOCKS is on
  hooks/        useAsyncData (loading/error/data), usePets, useAuth
  components/   Layout, pet components, shared UI, AuthProvider, RequireAuth, ErrorBoundary
  pages/        One component per route (organization/ and auth/ group related pages)
  utils/        Logger (CloudWatch-ready JSON), pet formatting helpers, auth helpers
```

Routes: `/` landing, `/adopt` catalog, `/pets/:id` details, `/login`,
`/register`, `/about`, `/my-requests` (adopters), `/organization` and
`/organization/pets/new` (organization members). In AWS, CloudFront must rewrite
these paths to `/index.html`.

## API contract

Endpoints the frontend calls. Request and response bodies use the types in
`src/types/index.ts`. Authenticated routes expect `Authorization: Bearer <JWT>`.
Errors use FastAPI's `{ "detail": ... }` format with an appropriate status code.

| Method and path | Auth | Body → Response |
| --- | --- | --- |
| `POST /auth/register` | – | `RegisterInput` → `TokenResponse` (creates an adopter) |
| `POST /auth/login` | – | `LoginInput` → `TokenResponse` (401 on wrong credentials) |
| `GET /auth/me` | any | → `User` |
| `GET /pets` | – | query `PetFilters` → `Paginated<Pet>` (available pets, newest first; arrays as repeated params) |
| `GET /pets/{id}` | – | → `PetDetails` (pet with its organization) |
| `POST /pets` | organization | `PetInput` → `Pet` |
| `PATCH /pets/{id}` | organization | `PetStatusUpdate` → `Pet` |
| `POST /pets/{id}/photos` | organization | multipart `file` → `PetPhoto` (API validates, uploads and registers) |
| `GET /organizations/me/pets` | organization | → `Pet[]` (all statuses) |
| `POST /adoption-requests` | adopter | `AdoptionRequestInput` → `AdoptionRequest` |
| `GET /adoption-requests/me` | adopter | → `AdoptionRequestDetails[]` |
| `GET /organizations/me/adoption-requests` | organization | → `AdoptionRequestDetails[]` |
| `PATCH /adoption-requests/{id}` | organization | `AdoptionRequestDecision` → `AdoptionRequest` |

Business rules implemented by the API:

- Adopters can request only `available` pets, with one `pending` request per pet (409 otherwise).
- Organization members can only change their own organization's pets and requests (404 otherwise).
- Only `pending` requests can be approved or rejected (409 otherwise).
- Approving a request sets the pet to `pending`, which hides it from the catalog.
- Age filter groups: baby under 12 months, young 12–35, adult 36–95, senior 96+.
- Photos: JPEG, PNG, or WebP up to 5 MB, sent to the API, which uploads them to S3. The browser only renders the returned image URL.

## Manual smoke checklist

With mocks disabled and the demo database populated:

1. Browse the catalog, filter species/age/size and switch pages; open pet details.
2. Register an adopter, log out/in, and reload to verify session persistence.
3. Submit a request for an available pet and verify it in My requests. Repeat
   the request to check the duplicate conflict message.
4. Log in as the pet's organization member, review the request, and approve it.
   Verify the request history and that the pet is now pending and hidden from
   the available catalog. Review another pending request with rejection.
5. Log in as the other organization. Its portal must contain only its own
   pets and requests; direct API mutation of the first organization's records
   must return 404.
6. Create a pet and upload a photo with the existing S3 bucket configured.
   Verify rendering after reload and adding a photo to a seeded pet. Interrupt
   an upload and retry without duplicating the pet or successful photos.
7. Check empty results, missing pets, invalid/expired tokens, and API downtime.
   Run `pnpm lint` and `pnpm build` before opening a pull request.
