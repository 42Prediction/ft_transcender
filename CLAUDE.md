# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

ft_transcender: a NestJS backend (`app-backend`) + React/Vite frontend (`app-frontend`), backed by PostgreSQL. The current branch (`feat/marteket`) adds a "Market" feature — a prediction market where users bet an internal currency (₳) on real events from the 42 school ecosystem (project defenses, exams, piscines, internships). See `MARKET_FEATURE.md` for the full design/file map of that feature and `FRIENDLIST_RELATIONS.md` for the friend-request/friendship data model.

## Common commands

Run from the repo root using the `Makefile` (wraps docker-compose + npm for both apps):

- `make dev` — start Postgres (docker), then backend (`nest start --watch` on :3000) and frontend (`vite` on :5173) as background processes, logging to `logs/backend.log` / `logs/frontend.log`, with PIDs in `.pids/`.
- `make dev-status` — show backend/frontend PIDs.
- `make dev-stop` — kill backend/frontend and stop the DB container.
- `make migrate-run` — run TypeORM migrations against the DB.
- `make migrate-generate` — run migrations then generate a new one under `app-backend/src/migrations`.
- `make seed` — run backend seeds (`npm run seed:run`, see `app-backend/src/seeds/`).
- `make test` — runs `test-backend` (waits for DB, `npm ci`, `npm test`, `npm run test:e2e` in `app-backend`).
- `make clean` / `make fclean` / `make re` — stop and tear down containers/volumes (and images for fclean), then rebuild.

Per-app commands (when iterating inside one app instead of via Makefile):

Backend (`app-backend/`):
- `npm run start:dev` — Nest in watch mode.
- `npm test` — Jest unit tests (`*.spec.ts` colocated with source).
- `npx jest src/modules/market/market.service.spec.ts` — run a single test file.
- `npm run test:e2e` — e2e tests via `test/jest-e2e.json`.
- `npm run lint` — ESLint with `--fix`.
- `npm run migration:generate -- src/migrations/<Name>` / `npm run migration:run` / `npm run migration:revert` — TypeORM CLI migrations (uses `src/data-source.ts`).

Frontend (`app-frontend/`):
- `npm run dev` — Vite dev server.
- `npm run build` — `tsc -b && vite build` (build also type-checks).
- `npm run lint` — ESLint.

Environment config is `.env` at the repo root (see `.env.example`); `app.module.ts` loads `['.env', '../.env']`. Postgres credentials for docker-compose come from `.env` plus `secrets/db_password.txt`.

## Backend architecture (`app-backend/src`)

NestJS app organized by domain module under `src/modules/`: `auth`, `user`, `bettor`, `wallet`, `market`, `school42`. Each module follows the standard Nest shape: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, `entities/`.

- **Entities/migrations**: TypeORM entities live under each module's `entities/`; `entities: [__dirname + '/modules/**/*.entity{.ts,.js}']` in `app.module.ts` auto-discovers them. `synchronize` is disabled — schema changes must go through migrations in `src/migrations/`, applied in numeric/timestamp order.
- **Auth**: JWT-based (`@nestjs/jwt` + `passport-jwt`), plus OAuth via Google and 42 School (`school42` module) strategies. Guards: `JwtAuthGuard`, `OptionalJwtAuthGuard`, `GoogleAuthGuard`; `RolesGuard` + `@Roles()` decorator enforce role-based access (roles enum in `shared/enums/roles.enum.ts`) by reading `request.user.role`.
- **Bettor vs User vs Wallet**: `user` is the base account entity; `bettor` is the betting-domain profile (friends, avatar) built on top of it — see `FRIENDLIST_RELATIONS.md` for how friend requests (`FriendRequest` entity, PENDING/ACCEPTED/DECLINED) differ from confirmed friendships (`user_friends` many-to-many join table). `wallet` tracks balances/transactions in the internal currency and is what `market` debits/credits when bets are placed.
- **Market module** (`modules/market/`): `market.entity.ts` (markets) and `market-position.entity.ts` (a bettor's position/bet in a market) plus `create-market.dto.ts` / `place-bet.dto.ts`. This is the newest module — cross-reference `MARKET_FEATURE.md` for intended endpoints and behavior before extending it.
- **Response shape**: controllers should return the `ApiResponse<T>` shape from `shared/helper/api-response.helper.ts` (`successResponse`, `errorResponse`, `unauthorizedResponse` — `{ success, statusCode, data, error }`). The frontend's auth middleware relies on this exact `statusCode` field to decide auth state, so don't change it casually.
- **Static uploads**: served from `app-backend/uploads` at `/uploads/` (see `main.ts`, `config/multer.config.ts`, `bettor/avatar.service.ts` for avatar upload handling).
- CORS is locked to `FRONTEND_URL` with `credentials: true`; auth relies on cookies (`cookie-parser`), not bearer headers, for the browser client.

## Frontend architecture (`app-frontend/src`)

React 19 + React Router v7 using **data routers** (`createBrowserRouter`) with route-level `loader`/`middleware`, not `<Routes>`/`<Route>`. Full rules are in `FRONTEND_RULES.md` — key points:

- **Feature-first structure**: code is organized by business domain under `features/<domain>/` (`pages/`, `components/`, `hooks/`, `services/`/`actions/`, `routes.tsx`), not by file type. Domain-specific UI/state stays inside its feature; only cross-domain UI goes in `shared/`/`components/`. Current domains: `auth`, `admin`, `market`, `public`, `user` (with `user/portfolio`, `user/profile`, `user/settings`).
- **Routing composition**: each feature exports a `routes.tsx` array; `src/routes.tsx` is the single place that assembles them into the router, under two top-level trees — `/` (App shell, `authMiddleware`) and `/admin` (separate shell, `adminAuthMiddleware`).
- **Auth via router context, not React context for gating**: `authMiddleware`/`adminAuthMiddleware` (`src/middleware/auth.ts`) call the backend `/me` endpoints and stash the response in a shared `dataContext` (a React Router `createContext`, defined in `src/routes.tsx`). Route loaders (`src/loader/guards.ts`: `protectedLoader`, `publicLoader`, `adminProtectedLoader`, `adminPublicLoader`) read that context to redirect authenticated/unauthenticated users. There's also a separate `AuthContext` (`src/context/AuthContext.tsx`) for in-component reactive auth state — know which one a given piece of code needs.
- **API clients**: `src/api/api.ts` exports a shared axios instance (`withCredentials: true`, base URL from `VITE_API_URL`, default `http://localhost:3000`). Per-domain API modules (`src/api/<domain>/<domain>.api.ts`) wrap it, mirroring backend modules (`auth`, `bettor` incl. `friend.api.ts`, `market` incl. `school42.api.ts`, `user`).
- **Styling**: colocate CSS with its component (`Component.tsx` + `Component.css` in the same folder), except shared/global styles under `src/shared`/`src/styles`. Tailwind v4 + shadcn/radix-ui components live in `components/ui/`.

## PR / branch workflow

Enforced by `.github/workflows/pr-rules.yml` (see `PR_RULES.md` for full detail and troubleshooting):

- Branch naming: `feat/<name>` or `fix/<name>` (lowercase, digits, `.`, `_`, `-` only) or `dev`.
- Branch flow: `feat/*`/`fix/*` → `dev`; `dev` → `main`/`master`. Other target branches fail the check.
- Every commit message must start with `feat:` or `fix:` (squash/rebase if history is mixed).
- Review requirements before merge: 1 approval when targeting `dev`, 2 approvals when targeting `main`/`master`.