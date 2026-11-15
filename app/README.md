# PetCloud web

React + Vite + TypeScript, generated from the official `react-ts` template.
Requires Node.js 22.12+ and pnpm 11.25 (the version used for the lockfile).

```sh
pnpm install
cp .env.example .env
pnpm dev
```

Open http://localhost:5173. The footer shows whether the backend's `/health`
endpoint responds (API liveness, not PostgreSQL readiness).

Until the API serves the pet endpoints, the catalog uses mock data from
`src/mocks/` (photos in `public/mock-pets/`). Set `VITE_USE_MOCKS=false` to load
pets from the API instead.

```sh
pnpm lint
pnpm build
pnpm preview
```

The production build is in `dist/`, ready for S3 + CloudFront.
Set `VITE_API_URL` to the HTTPS API URL before building for AWS.
