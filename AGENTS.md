# Project conventions

PetCloud is an academic group project focused on the pet adoption workflow.
Follow these conventions when working in this repository.

## Language

- Write code, identifiers, comments, documentation, UI text, and commit messages in English.

## Structure and stack

- Frontend code belongs in `app/`: React, Vite, and TypeScript.
- Backend code belongs in `api/`: FastAPI and Python.
- Database documentation and migrations belong in `db/`: PostgreSQL.
- AWS scripts and configuration belong in `aws/`.
- Discuss changes to the stack before introducing them.

## Simplicity and scope

- Prefer straightforward implementations.
- Avoid unnecessary abstractions, dependencies, and features outside the adoption workflow.
- Do not impose new folder patterns, migration tooling, or UI libraries before they are agreed on.

## Validation

- Do not add unit tests or test frameworks.
- Validate changes with relevant lint/build checks and manual smoke tests.
- Report what was verified and any checks that could not be completed.

## Configuration and credentials

- Read environment-specific settings from environment variables.
- Keep `.env.example` files updated with placeholders or local development values.
- Never commit credentials, AWS access keys, or production passwords.

## Frontend

- Use functional React components and TypeScript.
- Avoid `any` unless justified.
- Show loading, empty, and error states for API requests.

## Backend

- Validate request and response data with Pydantic.
- Use appropriate HTTP status codes.
- Keep business logic out of route handlers as it grows.

## Database

- Apply schema changes through versioned migrations once migration tooling is introduced.
- Never change a shared database schema manually.

## Collaboration and Git

- Make focused changes and preserve unrelated work.
- Avoid broad formatting or refactoring during feature work.
- Use feature branches and pull requests into the default branch, unless explicitly instructed otherwise.
- Write clear commit messages and explain how changes were verified.

## AWS

- Keep infrastructure changes explicit and documented.
- Do not provision, deploy, or delete AWS resources unless requested.
