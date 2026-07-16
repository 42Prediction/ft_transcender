_This project has been created as part of the 42 curriculum by ajacinto, nfigueir, gudos-sa, marccarv, almanuel._

# ft_transcendence — 42 Prediction (Prediction Market)

## Description

**42 Prediction** is a full-stack web platform built for the 42 School `ft_transcendence` project. Instead of the traditional Pong-based scope, the team chose to build a **prediction market**: users bet an internal currency (xp) on real events from the 42 School ecosystem — exam results sourced live from the 42 Intra API — on binary YES/NO markets with pool-based (parimutuel/AMM-style) pricing.

Key features:

- **Live prediction markets** auto-generated from real 42 Luanda exam data (Exam Rank 02–06), with YES/NO betting, a dynamic pool-based pricing model, automatic resolution when the exam ends, and manual resolution by market creators.
- **Full account system**: email/password signup, OAuth login via Google and 42 Intra, **TOTP two-factor authentication** (QR enrolment + login challenge), role-based access (`user` / `moderator` / `admin`), profiles, avatars, and a friends system with requests/acceptance.
- **Real-time everything**: live price/pool updates, per-market chat with @mentions, and a notification inbox — all pushed over WebSockets (Socket.IO).
- **Internal economy**: a wallet with a full transaction ledger (bets, payouts, seed, commission, rewards), fed by a welcome bonus, daily streaks, and onboarding quests. A 5% rake on losing stakes goes to the market creator.
- **Admin tooling**: a dedicated admin panel for user management (with a read-only moderator view), market resolution, and an analytics dashboard (charts, CSV export, date-range filters).
- **Personal analytics & GDPR tooling**: a "My Activity" insights panel on the profile page and a one-click JSON export of everything the platform holds about a user's account.
- **Production observability**: single-command containerized deployment with ELK log management and Prometheus/Grafana monitoring.

## Instructions

### Prerequisites

- Docker + Docker Compose
- Node.js 20+ and npm
- `make` (the project is orchestrated through a root `Makefile`)
- A `.env` file at the repo root (copy `.env.example` and fill in the blanks):

  ```
  SERVER_PORT=3000
  DB_HOST=localhost
  DB_PORT=5432
  DB_PASS=
  DB_USER=
  DB_NAME=transcendence_db

  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

  _42SCHOOL_CLIENT_ID=
  _42SCHOOL_CLIENT_SECRET=
  _42SCHOOL_CALLBACK_URL=http://localhost:3000/auth/42luanda/callback
  _42SCHOOL_API_URL_AUTHORIRIZE=https://api.intra.42.fr/oauth/authorize
  _42SCHOOL_API_URL_TOKEN=https://api.intra.42.fr/oauth/token
  _42SCHOOL_API_URL_OAUTH_PROFILE=https://api.intra.42.fr/v2/me
  _42SCHOOL_CAMPUS_ID=68

  JWT_SECRET=
  FRONTEND_URL=http://localhost:5173
  ```

  The Postgres container additionally reads its password from `secrets/db_password.txt` (see `docker-compose.dev.yml`). The observability stack reads `ELASTIC_PASSWORD`, `KIBANA_SYSTEM_PASSWORD`, `GRAFANA_ADMIN_PASSWORD` and `LOG_RETENTION_DAYS` from `.env`; the boot-time admin seed needs `ADMIN_PWD`.

### Running in development

```bash
make dev           # starts Postgres (docker), backend (:3000) and frontend (:5173)
make migrate-run   # applies TypeORM migrations
make seed          # seeds the admin account and reference data
```

- Backend logs: `logs/backend.log` · Frontend logs: `logs/frontend.log` · PIDs: `.pids/`
- `make dev-status` — check what's running · `make dev-stop` — stop everything
- `make clean` / `make fclean` / `make re` — tear down containers/volumes (and images for `fclean`), then rebuild

### Running the full containerized stack (production-like, one command)

The entire platform — Postgres, backend, frontend (nginx), and the full observability stack (ELK + Prometheus/Grafana) — runs from a single `docker-compose.yml`:

```bash
make up-prod       # docker compose up -d --build  (builds images, runs migrations + admin seed on boot)
make ps-prod       # container status
make logs-prod     # follow all logs
make down-prod     # stop the stack   ·   make fclean-prod  (also removes volumes)
```

`make up-prod` also generates (once, idempotently) a self-signed TLS certificate under `certs/` via `make certs`, used by both nginx (frontend) and the backend so the whole app is served over **HTTPS**. Browsers will show a "not private" warning on first visit to `localhost` — that's expected for a self-signed dev/demo cert; accept/proceed once per browser.

Endpoints once up:

| Service | URL | Credentials |
|---|---|---|
| Frontend | https://localhost:5173 | — |
| Backend API | https://localhost:3000 | — |
| Backend metrics | https://localhost:3000/metrics | — |
| Kibana (logs) | http://localhost:5601 | `elastic` / `ELASTIC_PASSWORD` |
| Grafana (dashboards) | http://localhost:3001 | `admin` / `GRAFANA_ADMIN_PASSWORD` |
| Prometheus | http://localhost:9090 | — |

In Kibana, create a data view for `transcendence-logs-*` to explore the ingested logs. Don't run `make up-prod` and `make dev` at the same time — they bind the same host ports (Postgres 5432, backend 3000, frontend 5173).

> **OAuth redirect URIs**: the containerized stack overrides `GOOGLE_CALLBACK_URL`/`_42SCHOOL_CALLBACK_URL` to their `https://localhost:3000/...` form (see `docker-compose.yml`). If you use Google/42 login against this stack, add those exact HTTPS URIs as authorized redirect URIs in the Google Cloud Console / 42 Intra API app settings — the HTTP versions used by `make dev` won't work here since the backend only listens on HTTPS once a cert is present.

### Running per app (when iterating on one side)

- Backend (`app-backend/`): `npm run start:dev` (watch mode) · `npm test` (unit) · `npm run test:e2e` (e2e) · `npm run lint`
- Frontend (`app-frontend/`): `npm run dev` · `npm run build` (also type-checks) · `npm run lint`
- CI entry point: `make test-all` (backend unit + e2e; runs on every PR via GitHub Actions)

## Resources

- [NestJS documentation](https://docs.nestjs.com/) — backend framework
- [React documentation](https://react.dev/) / [React Router v7 (data routers)](https://reactrouter.com/) — frontend framework and routing
- [TypeORM documentation](https://typeorm.io/) — ORM and migrations
- [Socket.IO documentation](https://socket.io/docs/v4/) — real-time engine
- [PostgreSQL documentation](https://www.postgresql.org/docs/)
- [42 Intra API (v2) documentation](https://api.intra.42.fr/apidoc) — source of exam/cursus data for markets
- [OAuth 2.0 (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749) — used for the Google and 42 login strategies
- [TOTP (RFC 6238)](https://datatracker.ietf.org/doc/html/rfc6238) / [otplib](https://github.com/yeojz/otplib) — two-factor authentication
- [Prediction market / parimutuel betting references](https://en.wikipedia.org/wiki/Prediction_market) — conceptual basis for the YES/NO pool pricing model
- [Elastic Stack (ELK) documentation](https://www.elastic.co/guide/index.html) / [Prometheus](https://prometheus.io/docs/) / [Grafana](https://grafana.com/docs/) — observability stack
- [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) — headless component primitives behind `components/ui/`
- [Tailwind CSS v4](https://tailwindcss.com/docs)

### How AI was used

AI assistance (Claude Code) was used during the later stages of development, always with a team member driving and reviewing the changes. Concretely, it was used for:

- Writing/fixing unit tests broken by refactors (e.g., the "always return HTTP 200 + `ApiResponse`" standardization).
- Running and interpreting `tsc`, `jest`, ESLint and headless-Chrome (Playwright) checks against a live local instance to verify each change before considering it done — including the app-wide responsiveness audit (measuring `scrollWidth` vs `clientWidth` at 360/768/1280 px).
- Auditing the project against the subject's module list and drafting this `README.md` (feature/module attribution derived from `git log`) and the platform documentation (betting rules, payout formula, observability pipeline).
- Targeted fixes: suppressing browser-console errors on wrong 2FA codes by extending the `ApiResponse` pattern to the 2FA endpoints, responsive layout fixes (navbar, settings page), and removing non-informative code comments with an AST-based script.

All AI-assisted changes were reviewed, tested, and committed by a human team member — AI was used as a pair-programming and research tool, not as an unreviewed autonomous contributor.

## Team Information

| Login      | Role(s)              | Responsibilities |
| ---------- | -------------------- | ----------------- |
| `ajacinto` | Product Owner (PO) + Developer | Owns the product vision and scope — defined the prediction-market concept and the internal economy rules. Built the market feature itself (betting, pricing, chat, notifications, gamification) and the 42 Intra API integration. |
| `nfigueir` | Project Manager (PM) + Developer | Organized workflow and integration between features. Built the auth foundation (JWT cookies, Google OAuth), the `ApiResponse` API standard, the automatic exam-market pipeline and the WebSocket events layer. |
| `gudos-sa` | Technical Lead + Developer | Owns architectural decisions and cross-cutting quality. Built the wallet/ledger module and the whole DevOps/observability stack (containerized deployment, ELK, Prometheus/Grafana); led reviews and integration merges. |
| `marccarv` | Developer | Full-stack owner of the social/admin slice: friends system, moderator role, analytics dashboard, GDPR export, design system, static pages. |
| `almanuel` | Developer | Full-stack owner of two-factor authentication (TOTP backend + enrolment/challenge UX) and production Makefile fixes. |

> The team organized around **feature ownership**: each member is responsible for a vertical slice of a module — both its backend endpoints and its frontend UI — rather than splitting strictly by frontend/backend.

## Project Management

- **Task distribution**: work was split by feature/module, each owned end-to-end (backend + frontend) by one or two people — see the Features List below for the exact mapping (derived from `git log`).
- **Tools**: GitHub (branches, Pull Requests with mandatory reviews) as the single source of truth, tracked against the subject's module list, reviewed and updated as work landed.
- **Process enforcement**: Pull requests are gated by `.github/workflows/pr-rules.yml` — branch naming `feat/*`/`fix/*` → `dev` → `main`, commit messages prefixed `feat:`/`fix:`, 1 review to merge into `dev` and 2 into `main` (see `PR_RULES.md`) — and `.github/workflows/pr-tests.yml` runs the full backend test suite (`make test-all`) on every PR.
- **Integration flow**: feature branches (`feat/wallet`, `feat/marteket`, `feat/2fa`, `feat/admin_page`, `feat/friends_frontend-marccarv`, `feat/implement_devops`, …) merged into `dev` after review, then `dev` → `master`.
- **Communication channels**: GitHub PR reviews for technical discussion; _[team to confirm the day-to-day channel — e.g. WhatsApp/Discord — and meeting cadence, not derivable from the repository]_.

## Technical Stack

- **Frontend**: React 19 + Vite, React Router v7 (data routers — `createBrowserRouter`, route-level `loader`/`middleware`), Tailwind CSS v4, shadcn/ui + Radix UI primitives, Recharts (charts), Axios, Socket.IO client.
- **Backend**: NestJS 11 (Express platform), TypeORM 0.3, `@nestjs/websockets` + `@nestjs/platform-socket.io` (Socket.IO gateway), `@nestjs/jwt` + Passport (`passport-jwt`, `passport-google-oauth20`, custom 42 School strategy), `otplib` + `qrcode` (TOTP 2FA), `class-validator`/`class-transformer`, `bcrypt`, `@nestjs/schedule` (cron sync of 42 exam data), `multer` + `sharp` (avatar upload/processing).
- **Database**: **PostgreSQL 16**, chosen for its strong relational guarantees (foreign keys, unique constraints, enum types) and native support for `jsonb` (used for notification payloads) — a good fit for a domain with real money-like invariants (wallet balances, bet settlement) where consistency matters more than horizontal write scale.
- **Observability**: `nestjs-pino` (structured JSON logs) → Logstash → Elasticsearch → Kibana; `prom-client` + `@willsoto/nestjs-prometheus` (`/metrics`) → Prometheus (+ node-exporter, postgres-exporter, alert rules) → Grafana with auto-provisioned dashboards.
- **Other significant technologies**: Docker Compose (12-service production stack; Postgres-only in dev), nginx (serving the frontend build), `@dicebear` (generated avatars), GitHub Actions (CI), Makefile (single entry point for every workflow).
- **Justification for major technical choices**:
  - **NestJS over a lighter framework** — the domain has many cross-cutting concerns (auth guards, role-based access, DTO validation, module boundaries) that NestJS's DI/module system handles natively, keeping the growing module count (`auth`, `user`, `bettor`, `wallet`, `market`, `school42`) maintainable.
  - **React Router v7 data routers over a client-side auth store** — auth state is resolved once per navigation via `loader`/`middleware` against the backend `/me` endpoints, avoiding a separate client store going stale relative to the server.
  - **TypeORM migrations, `synchronize: false`** — schema changes are explicit and reviewable, important for a project with real financial-style data (wallets, transactions).
  - **Parimutuel pools over fixed odds** — no house exposure: bettors bet against each other, the platform never "prints" money (every credit is matched by prior debits), and the price doubles as the displayed probability.

## Database Schema

Relational schema (PostgreSQL), managed via TypeORM entities under `app-backend/src/modules/**/entities/` and versioned migrations under `app-backend/src/migrations/`.

```
users ──1:1── bettors ──1:1── wallet ──1:N── transaction
                │  │
                │  └──N:M── bettors (bettor_friends, via friend requests)
                │
                ├──1:N── market_positions ──N:1── markets
                ├──1:N── bettor_quests
                └──1:N── notifications
```

| Table              | Key fields | Notes |
| ------------------ | ----------- | ------ |
| `users`            | `id` (uuid, PK), `email` (unique), `password` (hashed, excluded from API responses), `role` (enum: `user`/`moderator`/`admin`), `state`, `is_two_factor_enabled`, `two_factor_secret`, `created_at`, `updated_at` | Base account/identity. `role` drives `RolesGuard` + `@Roles()`. |
| `bettors`          | `id` (uuid, PK), `user_id` (FK → `users`, 1:1), `nick` (unique), `bio`, `avatar`, `is_nick_setted`, `campus`, `school42_login`, `school42_level`, `daily_streak`, `last_daily_claim_at` | The betting-domain profile built on top of `users`. |
| `friend`           | `id` (uuid, PK), `sender_id`/`receiver_id` (FK → `bettors`), `status` (enum: `PENDING`/`ACCEPTED`/`REJECTED`), unique (`sender`, `receiver`) | Friend requests; accepted requests are additionally reflected in the `bettor_friends` M:N join table. |
| `wallet`           | `id` (uuid, PK), `id_bettor` (FK → `bettors`, unique/1:1), `balance` (decimal), `created_at`, `updated_at` | One wallet per bettor. |
| `transaction`      | `id` (uuid, PK), `id_wallet` (FK → `wallet`), `amount`, `type` (enum: `DEPOSIT`/`WITHDRAW`/`BET`/`PAYOUT`/`COMMISSION`/`MARKET_SEED`/`SCHOOL42_REWARD`/`ENGAGEMENT_REWARD`), `status`, `balance_before`, `balance_after`, `description`, `created_at` | Full ledger — every wallet mutation is an immutable row. |
| `markets`          | `id` (uuid, PK), `exam_id` (nullable, unique with `subject_login`), `subject_login`, `subject_name`, `subject_avatar`, `project`, `category` (enum: `Exam 02`…`Exam 06`), `status` (enum: `new`/`live`/`closing`/`closed`/`resolved`/`cancelled`), `yes_pool`/`no_pool` (decimal — pool pricing), `closes_at`, `exam_ends_at` (nullable — real exam end time from the 42 API, drives auto-resolution), `resolved_at`, `resolution` (enum: `YES`/`NO`), `final_grade`, `creator_id` (FK → `bettors`), `created_at`, `updated_at` | One market per (exam, cadet) when auto-generated. |
| `market_positions` | `id` (uuid, PK), `market_id` (FK → `markets`), `bettor_id` (FK → `bettors`), `side` (enum: `YES`/`NO`), `amount`, `shares`, `entry_price`, `payout` (nullable until resolved), `created_at` | One row per bet. `payout = (shares / Σ winning shares) × (total pool − 5% rake)`. |
| `notifications`    | `id` (uuid, PK), `bettor_id` (FK → `bettors`), `type` (enum: `bet_resolved`/`bet_cancelled`/`chat_mention`/`friend_request_received`/`friend_request_accepted`), `market_id` (nullable), `data` (**jsonb**, type-specific payload), `is_read`, `created_at` | Persistent inbox, pushed live over the `MarketGateway` WebSocket. |
| `bettor_quests`    | `id` (uuid, PK), `bettor_id` (FK → `bettors`), `quest_key`, `reward`, `completed_at`, unique (`bettor_id`, `quest_key`) | One row per completed/paid onboarding quest — its presence is the "claimed" flag. |

## Features List

Ownership derived from `git log` (author of the feature's commits; reviewers/mergers not listed).

| Feature | Description | Worked on by |
| ------- | ----------- | ------------ |
| Auth (email/password + JWT cookie) | Signup/signin, JWT via httpOnly cookie, guards, `ApiResponse` standard (all endpoints return HTTP 200 + `statusCode` in body) | `nfigueir` |
| OAuth (Google + 42 Intra) | Two OAuth strategies, account auto-provisioning | `nfigueir` (Google), `ajacinto` (42 Intra) |
| Two-factor authentication (TOTP) | QR enrolment (otplib + qrcode), temp-token login challenge, settings toggle | `almanuel` (feature), `gudos-sa` (console-error hardening) |
| Bettor profiles & avatars | Nick/bio/avatar management, public profile page, profile refactor | `nfigueir`, `marccarv` |
| Friends system | Friend requests with accept/decline/cancel, friends list UI, nickname-existence tests | `marccarv` |
| Prediction markets (core) | Market creation with 100/100 seed, YES/NO betting, pool pricing, price chart, resolution & cancellation with refunds | `ajacinto` |
| Automatic exam markets | Cron sync of 42 exam registrations → market create/resolve lifecycle; 42 API rate-limit handling | `nfigueir` (pipeline), `ajacinto` (42 API + rate limit) |
| Wallet & transaction ledger | Balance, immutable transaction ledger, debit/credit invariants, withdrawal policies ("the platform never prints money") | `gudos-sa` (module + tests), `ajacinto` (withdrawal policies) |
| Real-time layer | Socket.IO gateway — live price/pool updates, market removal events | `nfigueir`, `ajacinto` |
| Per-market chat | Live chat with @mention autocomplete of friends, mention notifications | `ajacinto` |
| Notifications | Persistent inbox + live push (bet resolved/cancelled, chat mentions, friend requests) | `ajacinto`, `marccarv` (friend-request types) |
| Global search + advanced search/sort/pagination | Navbar search (markets + users), `/markets` filters, sort (volume/closing/probability), pagination | `ajacinto` |
| Gamification | Daily bonus with streaks, onboarding quests, leaderboard | `ajacinto` |
| Role-based permissions (`moderator`) | Third role between `user` and `admin` — resolves/cancels markets, read-only user list | `marccarv` |
| Admin panel (users) | User list, role promote/demote, delete, search | `ajacinto`, `gudos-sa` |
| Admin analytics dashboard | Line/bar/pie charts, date-range filters, CSV export, real-time refresh | `marccarv` |
| Personal activity insights | "My Activity" card on the profile page (day-bucketed personal aggregates) | `marccarv` |
| GDPR data export | One-click JSON export of everything held about the caller's account | `marccarv` |
| Design system page | `/design-system` — palette, typography, icons, reusable component catalog | `marccarv` |
| Static/legal pages | Terms, Privacy, About, FAQ, How it works, Trading guide — all functional from the footer | `nfigueir` (terms/privacy), `marccarv` (footer wiring) |
| DevOps / observability | One-command containerized stack, ELK log pipeline, Prometheus/Grafana monitoring, boot-time migrations + admin seed | `gudos-sa` (stack), `almanuel` (prod Makefile) |
| Responsiveness & UI hardening | App-wide responsive audit/fixes (navbar, settings, market detail), console-error suppression, comment cleanup | `gudos-sa` |

## Modules

Point calculation per the subject (Chapter IV): **Major = 2 pts, Minor = 1 pt**; summarized here with justification as required by Chapter VII.

### Core modules (14 pts minimum)

| Module | Pts | Justification | How implemented | Who |
| ------ | --- | ------------- | ---------------- | --- |
| Web framework (frontend + backend) | 2 (Major) | Required baseline; React+NestJS matches the team's familiarity and the real-time needs. | `app-frontend` (React 19/Vite), `app-backend` (NestJS 11). | whole team |
| Real-time via WebSockets | 2 (Major) | The core product loop (live prices, chat, notifications) is inherently real-time — a prediction market with stale prices has no value. | `market.gateway.ts` (Socket.IO namespace `/market`). | `nfigueir`, `ajacinto` |
| User interaction (chat, profile, friends) | 2 (Major) | Social features increase engagement and retention around the betting loop. | `MarketChat.tsx`, bettor profiles, `friend.service.ts`. | `ajacinto`, `marccarv`, `nfigueir` |
| ORM | 1 (Minor) | TypeORM gives migration-based schema control, important for the wallet/ledger's consistency requirements. | Used across every backend module; migrations in `src/migrations/`. | whole team |
| Complete notification system | 1 (Minor) | Users need to know when their bets resolve or someone interacts with them, without polling. | `NotificationService`, `notification.entity.ts`, pushed via `MarketGateway`. | `ajacinto`, `marccarv` |
| Advanced search with filters/sort/pagination | 1 (Minor) | `/markets` needed to stay usable as the auto-generated exam markets scale up. | `Markets.tsx` (filters + sort + pagination) and the navbar global search. | `ajacinto` |
| OAuth 2.0 (remote) | 1 (Minor) | Reduces signup friction — 42 students already have a 42/Google account. | `google.strategy.ts`, `school42.service.ts`. | `nfigueir`, `ajacinto` |
| Two-factor authentication (2FA) | 1 (Minor) | Accounts hold a wallet balance — a second factor materially raises the cost of account takeover. | `two-factor.service.ts` (otplib TOTP), QR enrolment, temp-token login challenge, settings toggle. | `almanuel` |
| User management standard | 2 (Major) | Baseline account/profile management is required for any multi-user platform. | `bettor` module + `features/user/profile`. | `nfigueir`, `marccarv` |
| Advanced permissions / roles | 2 (Major) | Markets need day-to-day moderation (resolving/cancelling) without granting full admin — a `moderator` role fits the operational need. | `RolesGuard` + `@Roles()`, `role` enum, migration `AddModeratorRole`. | `marccarv` |
| Analytics dashboard | 2 (Major) | Admins/moderators need visibility into platform volume/activity to moderate effectively. | `/admin/analytics`, `market.service.ts#getAnalytics`. | `marccarv` |
| Gamification | 1 (Minor) | Daily bonus/quests/leaderboard drive return visits independent of any single market's outcome. | `RewardsMenu.tsx`, `useQuests.ts`, `useDailyBonus.ts`, engagement module. | `ajacinto` |

**Core total: 18 pts** (4 pts above the 14-pt minimum).

### Bonus modules (Chapter VII — bonus capped at 5 extra points)

| Module | Pts | Justification | How implemented | Who |
| ------ | --- | ------------- | ---------------- | --- |
| GDPR compliance features | 1 (Minor) | Users placing bets should be able to export everything the platform holds about them, without asking support. | `GET /bettor/me/export` (JWT-guarded, own-data-only) + "Export my data" button in Settings → Account. | `marccarv` |
| Personal activity insights | 1 (Minor) | Admin analytics answers "how is the platform doing"; users also want "how am I doing" without admin access. | `GET /market/portfolio/activity` (day-bucketed, scoped to the caller) + "My Activity" card on the profile. | `marccarv` |
| Documented design system | 1 (Minor) | The app already had a token-based palette and reused components; documenting it makes that consistency verifiable. | `/design-system` — live palette, typography scale, icons, `Button` variants, catalog of reusable components. | `marccarv` |

### DevOps modules (IV.7 — implemented beyond the point cap)

These two Major modules are fully implemented but the 5-pt bonus cap is already reached by the extra core + bonus modules above. They were built to (a) satisfy the **mandatory** single-command containerized deployment and (b) make the running platform observable and demonstrable.

| Module | Pts | Justification | How implemented | Who |
| ------ | --- | ------------- | ---------------- | --- |
| Log management with ELK | 2 (Major) | A platform debiting user wallets needs a searchable, retained audit trail — grepping one file doesn't scale and disappears on restart. | `nestjs-pino` JSON logs → Logstash tail → Elasticsearch daily indices (`transcendence-logs-*`, ILM retention) → Kibana. One-shot `elk-setup` bootstraps security. | `gudos-sa` |
| Monitoring with Prometheus + Grafana | 2 (Major) | Real-time trading means latency/error spikes directly hurt users; the team needs to see them, not discover them from complaints. | Backend `/metrics` (`@willsoto/nestjs-prometheus` + HTTP middleware on every route), Prometheus scraping backend + node/postgres exporters with alert rules, Grafana auto-provisioned dashboards. | `gudos-sa`, `almanuel` (prod Makefile) |

**Score summary: 18 core + 3 bonus + 4 DevOps = 25 raw pts; creditable per the subject: 14 mandatory + 5 bonus cap = 19 pts.**

## Individual Contributions

Commit volume by author (`git log`, aliases merged — a rough proxy for activity, not for contribution quality/scope):

| Login | Commits | Role |
| ----- | ------- | ---- |
| `nfigueir` | ~120 | Project Manager |
| `ajacinto` | ~71 | Product Owner |
| `gudos-sa` | ~53 | Technical Lead |
| `marccarv` | ~52 | Developer |
| `almanuel` | ~10 | Developer |

### `nfigueir` — Project Manager

Built the **auth foundation**: email/password signup/signin, JWT in httpOnly cookies, Google OAuth strategy, and the guards used across the app. Designed and rolled out the **`ApiResponse` standard** — every controller returns HTTP 200 with `{ success, statusCode, data, error }` — so the frontend can read auth state without browser-console noise. Built the **automatic exam-market pipeline** (markets created from 42 exam registrations) and the **WebSocket market-events layer**, plus the profile refactor, terms/privacy pages, and dependency vulnerability updates.

*Challenge:* the always-200 refactor touched every controller at once and broke both the test suite and the frontend's data reads; it was landed by updating controllers, tests and frontend consumers together in one reviewed branch (`fix/return_200_always`).

### `ajacinto` — Product Owner

Owner of the **market feature** from `market v0.0.1`: the betting flow, the 100/100 pool seeding, the price chart, market filters, and resolution UX. Built the **per-market chat**, the **notification system**, the **navbar global search**, the **daily bonus** and quests (gamification), the **withdrawal policies** (three phases, ending with "the platform does not print money any more"), the admin panel improvements, and the **42 Intra API integration**.

*Challenge:* the 42 API's rate limits kept breaking the exam sync — fixed by throttling/deferring requests at application boot (`fix: solve limit rate for 42 API`, `fix: request api 42 during lunch app`).

### `gudos-sa` — Technical Lead

Built the **wallet module** end-to-end (service, migration, unit tests, REST hygiene on the controller) — the financial backbone every bet settles through. Built the entire **DevOps module**: the 12-service production `docker-compose.yml`, the ELK log pipeline, Prometheus/Grafana monitoring with auto-provisioned dashboards, and boot-time migrations + idempotent admin seed. Did the **app-wide responsiveness pass**, the 2FA console-error hardening, the AST-based comment cleanup, `.env.example` sanitization, and a large share of the integration merges and PR reviews.

*Challenge:* the settings page kept horizontal-scrolling on phones even after adding responsive classes — root cause was CSS grid's implicit `min-width: auto` on grid items; found by scripting headless Chrome to measure `scrollWidth` at 360 px and fixed with `min-w-0`.

### `marccarv` — Developer

Built the **friends system** end-to-end: `friend.api.ts`, the friends list UI, request validation and user feedback, unit + e2e tests for nickname existence, and the PT→EN naming cleanup. Added the **moderator role** (guards, migration, read-only admin view), the **analytics dashboard**, the friend-request **notification types**, and the bonus round of **GDPR export**, **personal activity insights** and the **design system page**. Made all footer/static pages functional and wrote the services guide.

*Challenge:* the friend-request state machine (duplicate/stale requests racing between two users) produced 409s and ghost entries — solved by re-fetching the authoritative state before every accept/reject/cancel action and reconciling the UI from it.

### `almanuel` — Developer

Built **two-factor authentication** end-to-end: the TOTP backend (`otplib`), QR-code enrolment, the temp-token cookie flow that challenges 2FA-enabled users at login (for password *and* OAuth logins), and the frontend verify page; also fixed the production Makefile.

*Challenge:* wiring the 2FA challenge into three different login paths (credentials, Google, 42) while `dev` kept moving — resolved through successive merges of `dev` into the `feat/2fa` branch and a final integration pass (`feat: merge feat/2fa to feat/devops`).


