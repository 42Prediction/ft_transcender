_This project has been created as part of the 42 curriculum by ajacinto, nfigueir, gudos-sa, marccarv, almanuel._

# ft_transcendence — Prediction Market

## Description

**ft_transcendence** (internal codename: the **Market**) is a full-stack web platform built for the 42 School `ft_transcendence` project. Instead of the traditional Pong-based scope, the team chose to build a **prediction market**: users bet an internal currency (₳/xp) on real events from the 42 School ecosystem — exam results, project defenses, piscines, and cursus progress — sourced live from the 42 Intra API.

Key features:

- **Live prediction markets** auto-generated from real 42 exam data, with YES/NO betting, a dynamic AMM-style pricing pool, and admin/moderator resolution.
- **Full account system**: email/password signup, OAuth login via Google and 42 Intra, role-based access (`user` / `moderator` / `admin`), profiles, avatars, and a friends system with requests/acceptance.
- **Real-time everything**: live price/pool updates, per-market chat, and a notification inbox — all pushed over WebSockets (Socket.IO).
- **Internal economy**: a wallet with a full transaction ledger (deposits, bets, payouts, rewards), fed by a welcome bonus, daily streaks, and onboarding quests.
- **Admin tooling**: a dedicated admin panel for user management, market resolution, and an analytics dashboard (charts, CSV export, date-range filters).
- **Personal analytics & GDPR tooling**: a "My Activity" insights panel on the profile page and a one-click JSON export of everything the platform holds about a user's account.

## Instructions

### Prerequisites

- Docker + Docker Compose (used for PostgreSQL)
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

  The Postgres container additionally reads its password from `secrets/db_password.txt` (see `docker-compose.dev.yml`).

### Running the project

```bash
make dev          # starts Postgres (docker), backend (:3000) and frontend (:5173)
make migrate-run   # applies TypeORM migrations
make seed          # seeds the admin account and reference data
```

- Backend logs: `logs/backend.log` · Frontend logs: `logs/frontend.log` · PIDs: `.pids/`
- `make dev-status` — check what's running · `make dev-stop` — stop everything
- `make clean` / `make fclean` / `make re` — tear down containers/volumes (and images for `fclean`), then rebuild

### Running the full containerized stack (production-like, one command)

The entire platform — Postgres, backend, frontend, and the full observability stack
(ELK + Prometheus/Grafana) — runs from a single `docker-compose.yml`:

```bash
make up-prod       # docker compose up -d --build  (builds images, runs migrations on boot)
make ps-prod       # container status
make logs-prod     # follow all logs
make down-prod     # stop the stack   ·   make fclean-prod  (also removes volumes)
```

Endpoints once up:

| Service | URL | Credentials |
|---|---|---|
| Frontend | http://localhost:5173 | — |
| Backend API | http://localhost:3000 | — |
| Backend metrics | http://localhost:3000/metrics | — |
| Kibana (logs) | http://localhost:5601 | `elastic` / `ELASTIC_PASSWORD` |
| Grafana (dashboards) | http://localhost:3001 | `admin` / `GRAFANA_ADMIN_PASSWORD` |
| Prometheus | http://localhost:9090 | — |

Set `ELASTIC_PASSWORD`, `KIBANA_SYSTEM_PASSWORD`, `GRAFANA_ADMIN_PASSWORD` and
`LOG_RETENTION_DAYS` in `.env` (see `.env.example`). In Kibana, create a data view for
`transcendence-logs-*` to explore the ingested logs. Don't run `make up-prod` and `make dev`
at the same time — they bind the same host ports (Postgres 5432, backend 3000, frontend 5173).

### Running per app (when iterating on one side)

Backend (`app-backend/`): `npm run start:dev` (watch mode) · `npm test` (unit) · `npm run test:e2e` (e2e) · `npm run lint`
Frontend (`app-frontend/`): `npm run dev` · `npm run build` (also type-checks) · `npm run lint`

## Resources

- [NestJS documentation](https://docs.nestjs.com/) — backend framework
- [React documentation](https://react.dev/) / [React Router v7 (data routers)](https://reactrouter.com/) — frontend framework and routing
- [TypeORM documentation](https://typeorm.io/) — ORM and migrations
- [Socket.IO documentation](https://socket.io/docs/v4/) — real-time engine
- [PostgreSQL documentation](https://www.postgresql.org/docs/)
- [42 Intra API (v2) documentation](https://api.intra.42.fr/apidoc) — source of exam/cursus data for markets
- [OAuth 2.0 (RFC 6749)](https://datatracker.ietf.org/doc/html/rfc6749) — used for the Google and 42 login strategies
- [Prediction market / AMM pricing references](https://en.wikipedia.org/wiki/Prediction_market) — conceptual basis for the YES/NO pool pricing model
- [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) — headless component primitives behind `components/ui/`
- [Tailwind CSS v4](https://tailwindcss.com/docs)

### How AI was used

AI assistance was used throughout the later stages of this project's development, always with a team member driving and reviewing the changes. Concretely, it was used for:

- Writing/fixing unit tests broken by changes.
- Running and interpreting `tsc`, `jest`, and manual `curl`-based smoke tests against a live local instance to verify each change before considering it done.
- Auditing the project against the `en.subject.pdf` module list and drafting `MODULES_PROGRESS.md` (module-by-module status tracking) and this `README.md`.

All AI-assisted changes were reviewed, tested, and committed by a human team member — AI was used as a pair-programming and research tool, not as an unreviewed autonomous contributor.

## Team Information

| Login      | Role(s)              | Responsibilities                                                                                                                                                      |
| ---------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ajacinto` | Product Owner (PO)   | Owns the product vision and scope — defined the prediction-market concept, prioritized features against the subject's module list, made the final call on trade-offs. |
| `nfigueir` | Project Manager (PM) | Organized the team's workflow, tracked progress against the module checklist, coordinated integration between features owned by different members.                    |
| `gudos-sa` | Technical Lead       | Owns architectural decisions (module boundaries, data model, real-time design), reviewed technical choices across the stack.                                          |
| `marccarv` | Developer            | Full-stack feature ownership (frontend + backend) on an assigned slice of the product — see Features List / Individual Contributions below.                           |
| `almanuel` | Developer            | Full-stack feature ownership (frontend + backend) on an assigned slice of the product — see Features List / Individual Contributions below.                           |

> The team organized around **feature ownership**: each developer (and each of PO/PM/Tech Lead, when contributing code) is responsible for a vertical slice of a module — both its backend endpoints and its frontend UI — rather than splitting strictly by frontend/backend.

## Project Management

- **Task distribution**: work was split by feature/module, each owned end-to-end (backend + frontend) by one or two people, per the "Team Information" table above.
- **Tracking**: this repository's own `MODULES_PROGRESS.md` was used as a running checklist against the subject's module list (✅/🟡/❌/🚫 per module), reviewed and updated as work landed. Pull requests are gated by `.github/workflows/pr-rules.yml` (branch naming `feat/*`/`fix/*` → `dev` → `main`, commit messages prefixed `feat:`/`fix:`, 1 review to merge into `dev` and 2 into `main`) — see `PR_RULES.md`.
- **Communication channel**: _[team to confirm — e.g. Discord/Slack — not derivable from the repository]_.
- **Meetings**: _[team to confirm cadence/format]_.

## Technical Stack

- **Frontend**: React 19 + Vite 8, React Router v7 (data routers — `createBrowserRouter`, route-level `loader`/`middleware`), Tailwind CSS v4, shadcn/ui + Radix UI primitives, Recharts (charts), Axios, Socket.IO client.
- **Backend**: NestJS 11 (Express platform), TypeORM 0.3, `@nestjs/websockets` + `@nestjs/platform-socket.io` (Socket.IO gateway), `@nestjs/jwt` + Passport (`passport-jwt`, `passport-google-oauth20`, custom 42 School strategy), `class-validator`/`class-transformer`, `bcrypt`, `@nestjs/schedule` (cron sync of 42 exam data).
- **Database**: **PostgreSQL**, chosen for its strong relational guarantees (foreign keys, unique constraints, enum types) and native support for `jsonb` (used for notification payloads) — a good fit for a domain with real money-like invariants (wallet balances, bet settlement) where consistency matters more than horizontal write scale.
- **Other significant technologies**: Docker Compose (Postgres in dev), `@dicebear` (generated avatars), `sharp` + `multer` (avatar upload/processing), `date-fns`/native `Date` for scheduling.
- **Justification for major technical choices**:
  - **NestJS over a lighter framework** — the domain has many cross-cutting concerns (auth guards, role-based access, DTO validation, module boundaries) that NestJS's DI/module system handles natively, keeping the growing module count (`auth`, `user`, `bettor`, `wallet`, `market`, `school42`) maintainable.
  - **React Router v7 data routers over a state-management library for auth** — auth state is resolved once per navigation via `loader`/`middleware` against the backend `/me` endpoints, avoiding a separate client-side auth store going stale relative to the server.
  - **TypeORM migrations, `synchronize: false`** — schema changes are explicit and reviewable, important for a project with real financial-style data (wallets, transactions).

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

| Table              | Key fields                                                                                                                                                                                                                                                                                                                                                                        | Notes                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `users`            | `id` (uuid, PK), `email` (unique), `password` (hashed, excluded from API responses), `role` (enum: `user`/`moderator`/`admin`), `state`, `created_at`, `updated_at`                                                                                                                                                                                                               | Base account/identity. `role` drives `RolesGuard` + `@Roles()`.                                       |
| `bettors`          | `id` (uuid, PK), `user_id` (FK → `users`, 1:1), `nick` (unique), `bio`, `avatar`, `is_nick_setted`, `campus`, `school42_login`, `school42_level`, `daily_streak`, `last_daily_claim_at`                                                                                                                                                                                           | The betting-domain profile built on top of `users`.                                                   |
| `friend`           | `id` (uuid, PK), `sender_id`/`receiver_id` (FK → `bettors`), `status` (enum: `PENDING`/`ACCEPTED`/`REJECTED`), unique (`sender`, `receiver`)                                                                                                                                                                                                                                      | Friend requests; accepted requests are additionally reflected in the `bettor_friends` M:N join table. |
| `wallet`           | `id` (uuid, PK), `id_bettor` (FK → `bettors`, unique/1:1), `balance` (decimal), `created_at`, `updated_at`                                                                                                                                                                                                                                                                        | One wallet per bettor.                                                                                |
| `transaction`      | `id` (uuid, PK), `id_wallet` (FK → `wallet`), `amount`, `type` (enum: `DEPOSIT`/`WITHDRAW`/`BET`/`PAYOUT`/`COMMISSION`/`MARKET_SEED`/`SCHOOL42_REWARD`/`ENGAGEMENT_REWARD`), `status` (enum), `balance_before`, `balance_after`, `description`, `created_at`                                                                                                                      | Full ledger — every wallet mutation is an immutable row.                                              |
| `markets`          | `id` (uuid, PK), `exam_id` (nullable, unique with `subject_login`), `subject_login`, `subject_name`, `subject_avatar`, `project`, `category` (enum: `Exam 02`…`Exam 06`), `status` (enum: `new`/`live`/`closing`/`resolved`/`cancelled`), `yes_pool`/`no_pool` (decimal, AMM pricing), `closes_at`, `resolved_at`, `resolution` (enum: `YES`/`NO`), `creator_id` (FK → `bettors`) | One market per (exam, cadet) when auto-generated.                                                     |
| `market_positions` | `id` (uuid, PK), `market_id` (FK → `markets`), `bettor_id` (FK → `bettors`), `side` (enum: `YES`/`NO`), `amount`, `shares`, `entry_price`, `payout` (nullable until resolved), `created_at`                                                                                                                                                                                       | One row per bet.                                                                                      |
| `notifications`    | `id` (uuid, PK), `bettor_id` (FK → `bettors`), `type` (enum: `bet_resolved`/`bet_cancelled`/`chat_mention`/`friend_request_received`/`friend_request_accepted`), `market_id` (nullable), `data` (**jsonb**, type-specific payload), `is_read`, `created_at`                                                                                                                       | Persistent inbox, pushed live over the `MarketGateway` WebSocket.                                     |
| `bettor_quests`    | `id` (uuid, PK), `bettor_id` (FK → `bettors`), `quest_key`, `reward`, `completed_at`, unique (`bettor_id`, `quest_key`)                                                                                                                                                                                                                                                           | One row per completed/paid onboarding quest — its presence is the "claimed" flag.                     |

## Features List

| Feature                                             | Description                                                                                  | Worked on by                        |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| Auth (email/password, Google OAuth, 42 Intra OAuth) | Signup/signin, JWT via httpOnly cookie, two OAuth strategies                                 | _[team to confirm exact ownership]_ |
| Bettor profiles, avatars, friends                   | Nick/bio/avatar management, friend requests with accept/decline, friends list                | _[team to confirm]_                 |
| Prediction markets                                  | Auto-generated from 42 exam data, YES/NO betting, AMM-style pricing, resolution/cancellation | _[team to confirm]_                 |
| Wallet & economy                                    | Balance + full transaction ledger, welcome bonus, daily streak, onboarding quests            | _[team to confirm]_                 |
| Real-time layer                                     | Socket.IO gateway — live price updates, per-market chat, notification push                   | _[team to confirm]_                 |
| Notifications                                       | Persistent inbox (bet resolved/cancelled, chat mentions, friend requests)                    | _[team to confirm]_                 |
| Advanced search, sort & pagination                  | Filters + sort (volume/closing soon/probability) + pagination on `/markets`                  | _[team to confirm]_                 |
| Role-based permissions (`moderator`)                | Third role between `user` and `admin` — resolves/cancels markets, read-only user list        | _[team to confirm]_                 |
| Admin analytics dashboard                           | Line/bar/pie charts, date-range filters, CSV export, real-time refresh                       | _[team to confirm]_                 |
| Personal activity insights                          | "My Activity" card on the profile page, personal bet history over time                       | _[team to confirm]_                 |
| GDPR data export                                    | One-click JSON export of everything held about the caller's account                          | _[team to confirm]_                 |
| Design system page                                  | `/design-system` — palette, typography, icons, reusable component catalog                    | _[team to confirm]_                 |
| Admin panel                                         | User management (list, role promote/demote, delete), market resolution                       | _[team to confirm]_                 |
| Gamification                                        | Daily bonus, quests, XP, leaderboard                                                         | _[team to confirm]_                 |

## Modules

Point calculation per `en.subject.pdf` (Chapter IV): **Major = 2 pts, Minor = 1 pt**. Full status tracking lives in [`MODULES_PROGRESS.md`](./MODULES_PROGRESS.md); summarized here with justification as required by Chapter VII (Bonus).

### Core modules (14 pts minimum — all validated)

| Module                                       | Pts       | Justification                                                                                                                                            | How implemented                                                                                    |
| -------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Web framework (frontend + backend)           | 2 (Major) | Required baseline; chosen stack (React+NestJS) matches team's existing familiarity and the subject's real-time/module needs.                             | `app-frontend` (React 19/Vite), `app-backend` (NestJS 11).                                         |
| Real-time via WebSockets                     | 2 (Major) | The core product loop (live prices, chat, notifications) is inherently real-time — a prediction market with stale prices has no value.                   | `market.gateway.ts` (Socket.IO namespace `/market`).                                               |
| User interaction (chat, profile, friends)    | 2 (Major) | Social features increase engagement and retention around the betting loop.                                                                               | `MarketChat.tsx`, bettor profiles, `friend.service.ts`.                                            |
| ORM                                          | 1 (Minor) | TypeORM gives migration-based schema control, important given the wallet/ledger's consistency requirements.                                              | Used across every backend module.                                                                  |
| Complete notification system                 | 1 (Minor) | Users need to know when their bets resolve or someone interacts with them, without polling.                                                              | `NotificationService`, `notification.entity.ts`, pushed via `MarketGateway`.                       |
| Advanced search with filters/sort/pagination | 1 (Minor) | `/markets` needed to stay usable as the auto-generated exam markets scale up.                                                                            | `Markets.tsx` (client-side sort/paginate over the filtered API result).                            |
| OAuth 2.0 (remote)                           | 1 (Minor) | Reduces signup friction for the target audience (42 students already have a 42/Google account).                                                          | `google.strategy.ts`, `school42.service.ts`.                                                       |
| User management standard                     | 2 (Major) | Baseline account/profile management is required for any multi-user platform.                                                                             | `bettor` module + `features/user/profile`.                                                         |
| Advanced permissions / roles                 | 2 (Major) | Markets need day-to-day moderation (resolving/cancelling) without granting full admin (user CRUD) — a `moderator` role fits the actual operational need. | `RolesGuard` + `@Roles()`, `role` enum (`user`/`moderator`/`admin`), migration `AddModeratorRole`. |
| Analytics dashboard                          | 2 (Major) | Admins/moderators need visibility into platform volume/activity to moderate effectively — not just per-market data.                                      | `/admin/analytics`, `market.service.ts#getAnalytics`.                                              |
| Gamification                                 | 1 (Minor) | Daily bonus/quests/leaderboard drive return visits independent of any single market's outcome.                                                           | `RewardsMenu.tsx`, `useQuests.ts`, `useDailyBonus.ts`.                                             |

**Total core: 16 pts** (2 pts above the 14-pt minimum, itself counted toward the 5-pt bonus cap below).

### Bonus modules (Chapter VII — capped at 5 extra points)

| Module                     | Pts       | Justification                                                                                                                                                       | How implemented                                                                                                                                                      |
| -------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GDPR compliance features   | 1 (Minor) | Users placing real (in-app-currency) bets should be able to see and export everything the platform holds about them, without asking support.                        | `GET /bettor/me/export` (JWT-guarded, own-data-only) + "Export my data" button in Settings → Account.                                                                |
| Personal activity insights | 1 (Minor) | The admin analytics module answers "how is the platform doing"; users also want "how am I doing" without needing admin access.                                      | `GET /market/portfolio/activity` (same day-bucketed aggregation as admin analytics, scoped to the caller's own bettor id) + "My Activity" card on the profile page.  |
| Documented design system   | 1 (Minor) | The app already had a consistent token-based palette and a growing set of reused components; documenting it makes that consistency verifiable rather than implicit. | `/design-system` — live color palette (read from CSS custom properties), typography scale, icon set, all `Button` variants, and a catalog of 12 reusable components. |

**Total with bonus: 19 pts** (14 mandatory + 5 bonus, the subject's stated cap).

### DevOps modules (IV.7 — completed for platform robustness, beyond the point cap)

These two Major modules are fully implemented but **do not add to the score**: the 5-pt bonus
cap is already reached. They were built to (a) satisfy the **mandatory** requirement of a
single-command containerized deployment and (b) make the running platform observable and
demonstrable. See the containerized-stack instructions above and `observability/`.

| Module | Pts | Justification | How implemented |
| --- | --- | --- | --- |
| Log management with ELK | 2 (Major) | A market platform debiting user wallets needs a searchable, retained audit trail of what the backend did — grepping a single file doesn't scale and disappears on restart. | Backend emits structured JSON logs (`nestjs-pino`); **Logstash** tails them and indexes into **Elasticsearch** (X-Pack security on); **Kibana** for search/dashboards; ILM policy enforces retention (`observability/`, `elk-setup` bootstrap). |
| Monitoring with Prometheus + Grafana | 2 (Major) | Real-time trading means latency/error spikes directly hurt users; the team needs to see them and be alerted, not discover them from complaints. | Backend `/metrics` (`@willsoto/nestjs-prometheus` + a middleware covering every request incl. 4xx); **Prometheus** scrapes backend + node/postgres exporters with alert rules; **Grafana** provisions a datasource + dashboard, access password-protected. |

> Two extra core modules beyond the minimum (`AdvancedPermissions` and `Advanced search+pagination`, 2+1=3pts) plus the 3 modules above (3pts) would exceed the 5-pt bonus cap — only 5 of those "extra" points are actually creditable as bonus per Chapter VII; the rest simply pad the core total above 14.

## Individual Contributions

Commit volume by author (`git shortlog -sn`, at time of writing — a rough proxy, not a full picture of contribution quality/scope):

| Login      | Commits | Role            |
| ---------- | ------- | --------------- |
| `nfigueir` | 121     | Project Manager |
| `ajacinto` | 70      | Product Owner   |
| `gudos-sa` | 46      | Technical Lead  |
| `marccarv` | 45      | Developer       |
| `almanuel` | 5       | Developer       |

> **Note for the team**: this table is derived automatically from `git shortlog` and the role list supplied by the team; it does **not** yet include a specific feature-by-feature breakdown of "what each person built" or "challenges faced and how they were overcome", as required by Chapter VI. Please fill in the `[team to confirm]` placeholders above (Features List, Project Management communication channel/meeting cadence) and expand this section with 2-4 sentences per person before submission.
