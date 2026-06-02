*This project has been created as part of the 42 curriculum by ajacinto, almanuel, gudos-sa, marccarv, nfigueir.*

# ft_transcender

## Description

**ft_transcender** is a full-stack web project built with a React (Vite) frontend, a NestJS backend, and PostgreSQL.
The goal is to deliver a modern web platform with authentication, user management, and domain-specific features
implemented as independent modules.

Key features:
- Authentication with JWT and OAuth providers (Google and 42).
- Modular backend architecture (auth, user, bettor).
- Separate frontend and backend apps with a shared PostgreSQL database.

## Instructions

Prerequisites:
- Docker and Docker Compose
- Node.js (LTS) and npm
- GNU Make
- (Linux) `lsof` or `fuser` to release ports 3000 and 5173

Configuration:
1) Copy `.env.example` to `.env` and fill in the required values.
2) Ensure the database password exists at `secrets/db_password.txt`.
3) For OAuth login, set the Google and 42 client credentials in `.env`.

Run (development):
1) Initialize the database (migrations + seeds):

```bash
make db-init
```

2) Start database, backend, and frontend:

```bash
make dev
```

Useful commands:
- `make dev-status` to check running processes
- `make dev-stop` to stop apps and clean up
- `make migrate` to run migrations only
- `make seed` to run seeds only

Notes:
- Any database schema change must be done via migrations.
- Any business rule default values must be defined via seeds.

## Technical Stack

Frontend:
- React + TypeScript
- Vite (fast dev server and build tooling)
- React Router (data routes)
- Axios (HTTP client)

Backend:
- NestJS (modular architecture and dependency injection)
- TypeORM (ORM and migrations)
- Passport + JWT (authentication)

Database:
- PostgreSQL
	- Chosen for strong relational integrity, mature tooling, and good compatibility with TypeORM.

Other notable tools:
- Docker + Docker Compose (local dev environment)
- Makefile (consistent dev commands)

Major technical choices (justification):
- React + Vite for fast iteration and modern frontend tooling.
- NestJS for a structured, scalable backend with clear module boundaries.
- PostgreSQL for reliable relational modeling and constraints.
- TypeORM to keep schema changes versioned via migrations.

## Database Schema

Diagram (Miro): https://miro.com/app/board/uXjVHZf2X2E=/


## Resources

References:
- NestJS documentation: https://docs.nestjs.com
- React documentation: https://react.dev
- Vite documentation: https://vitejs.dev
- React Router (data routes): https://reactrouter.com/en/main/routers/create-browser-router
- PostgreSQL documentation: https://www.postgresql.org/docs/
- Docker documentation: https://docs.docker.com

AI usage:
- Used AI to explain concepts related to the tools/technologies and to help debug specific errors.