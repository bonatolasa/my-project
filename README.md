# Virtual Phone Platform

Responsive web SaaS monorepo for managing provider-backed virtual numbers. The API is versioned and designed for future mobile clients. Current work establishes the Phase 2 foundation; customer authentication and telecom/payment workflows are not implemented yet.

## Requirements

- Node.js 20.19+ (Node 24 LTS/current works)
- npm 10+
- Docker Engine/Desktop with Docker Compose v2

## Local setup

1. Copy `.env.example` to `.env` and keep `.env` private (it is ignored by Git). The sample values are for local development only. (If package installation fails because the npm registry is unreachable, retry when network/DNS access is available.)
2. Install workspace dependencies: `npm install`.
3. Start PostgreSQL and Redis: `npm run dev:infra`.
4. Generate Prisma client: `npm run db:generate` (loads the repository root `.env`).
5. Create/apply the initial development migration: `npm run db:migrate` (loads the repository root `.env`).
6. Start the web and API apps: `npm run dev`.

Web app: <http://localhost:3000>  
API liveness: <http://localhost:4000/api/v1/health/live>  
API readiness: <http://localhost:4000/api/v1/health/ready>

Validation commands: `npm run build`, `npm run lint`, and `npx prisma validate --schema apps/backend/prisma/schema.prisma`.

Before starting local services, run `npm run check:services` to confirm that Docker is reachable to the current user. If it reports a permission error on `/var/run/docker.sock`, the Docker daemon owner must grant access (commonly through the `docker` group, followed by logging out and back in) or an administrator can start a managed PostgreSQL/Redis service. This check never reads or prints `.env` values.

Use `docker compose down` to stop local services; `docker compose down -v` removes local database/cache data.

## Environment values

Local PostgreSQL and Redis defaults are in `.env.example`. Integration credentials are not required yet; leave them empty. Before real provider or payment integration, create sandbox accounts and provide credentials in your local `.env` or a deployment secret manager. Never add credentials to source control or `NEXT_PUBLIC_*` variables.

## Current scaffold status

- Workspace manifests and shared package established.
- Next.js landing page and NestJS versioned health endpoints established.
- PostgreSQL and Redis local Compose services described.
- Initial Prisma domain schema drafted; migration generation is part of local setup.
- Provider-neutral schema foundations for telecom providers, API keys, customer webhooks, referrals, and multi-currency wallets.
- Initial Prisma migration is checked in at `apps/backend/prisma/migrations/20261030090000_init/`; generated from and verified against the current schema.
- Startup validates database configuration; readiness checks PostgreSQL availability.
- Cookie-authenticated customer accounts, workspace data endpoints, incoming SMS inbox, and a sandbox-first SMS/OTP API are implemented.

## SMS sandbox API

Set `SMS_MODE=test` (the default) and `OTP_PEPPER` in `.env`. The `mock` adapter records outbound messages in PostgreSQL and marks them as simulated; it never sends to a carrier. Include `[FAIL]` in a message to exercise its failed-delivery scenario. Sandbox OTP responses include a `testCode` for local testing only. OTP values are hashed in storage, expire after `OTP_TTL_SECONDS` (default 300), allow up to five guesses, and are single-use. All application API routes use the `/api/v1` prefix and require the existing `vp_session` cookie except the inbound webhook.

Implemented routes include `POST /api/v1/sms/send`, `POST /api/v1/sms/bulk`, `GET /api/v1/sms/history`, `GET /api/v1/sms/:id/status`, `POST /api/v1/otp/send`, `POST /api/v1/otp/resend`, `POST /api/v1/otp/verify`, `POST /api/v1/webhooks/sms`, and `GET /api/v1/providers`. Phone numbers must be E.164. Bulk requests are capped at 100 recipients. Provider capability listing identifies the four requested live providers as not configured. `SMS_MODE=live` fails at startup until a verified live adapter is implemented; no real delivery or number inventory is claimed. Number purchase/release also fail explicitly until provider and billing integration exist.

Apply the database migration with `npm run db:migrate` in development or `npm run db:deploy` in deployment, then regenerate Prisma client with `npm run db:generate`.

## Provider and production notes

The platform is designed to normalize Twilio, Telnyx, Vonage, and later integrations behind provider adapters. A provider must explicitly report inventory and capabilities; the app must never create pretend number availability or claim that SMS/calls were delivered. Provider eligibility, commercial resale permission, local number registration, and target-market requirements must be confirmed before enabling a real country or provider.

The current request limiter is in-process for the scaffold and is not sufficient for multiple API instances. Add Redis-backed rate limits and queues before production. Admin access must require MFA before production. Secrets should be stored in a deployment secret manager; `.env` is for local development only.

## Current verification

`npm run build`, `npm run lint`, Prisma schema validation, and schema-to-initial-migration SQL comparison pass. The migration has not been applied to a live database, and API readiness has not been exercised because Docker socket access is denied and the host PostgreSQL cluster is stopped. After Docker access is restored, run `npm run dev:infra`, `npm run db:generate`, and `npm run db:migrate`, then inspect API readiness.

See [Phase 1 architecture](docs/phase-1-architecture.md) for domain, API, provider, security, and roadmap decisions.
