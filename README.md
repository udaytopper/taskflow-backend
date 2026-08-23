# TaskFlow Backend

Production-oriented multi-tenant project management API built with Node.js, TypeScript, Express, PostgreSQL/Prisma, Redis and BullMQ.

## Highlights

- JWT access tokens plus persisted, revocable refresh-token rotation
- Organization-level `ORG_ADMIN` / `MEMBER` RBAC
- Tenant context derived only from authenticated JWT claims
- Tenant-scoped projects, tasks, assignments, comments, activity and job status
- Cursor pagination, filtering and PostgreSQL full-text task search with GIN index
- Soft deletion for projects/tasks
- Activity timeline and project dashboard
- Transactional outbox for assignment notifications
- BullMQ retries with exponential backoff and retained failed jobs
- Five-second assignment deduplication
- Cross-tenant integration tests verifying 403 responses and no sensitive leakage
- Structured `{ error, code, details }` errors and authentication rate limiting
- Docker Compose services for API, worker, PostgreSQL and Redis

## Architecture

Client -> Express API -> JWT/RBAC tenant context -> Prisma -> PostgreSQL. Assignment transactions persist both the assignment and an outbox event. The worker-side publisher moves pending events to BullMQ/Redis; the worker processes notifications independently. Failed BullMQ jobs are retained for inspection/retry.

## Tenant isolation

The API never accepts `orgId` as authoritative tenant context. Protected services receive `req.auth.orgId`, and resource lookups include that organization identifier. Cross-tenant resource requests return a generic 403 without resource names or metadata.

## Local setup

1. Copy `.env.example` to `.env` and replace JWT secrets.
2. Run `npm install`.
3. Start PostgreSQL and Redis, or use `docker compose up --build`.
4. Generate Prisma client with `npm run prisma:generate`.
5. Apply migrations with `npm run prisma:deploy` (or `npm run prisma:migrate` for development).
6. Optional demo data: `npm run prisma:seed`.
7. Start API with `npm run dev`; start worker separately with `npm run dev:worker` when not using Compose.

## Verification

- `npm run typecheck`
- `npm test`
- `npm run test:integration` (requires configured PostgreSQL test/development database)
- `npm run build`
- `GET http://localhost:3000/health`

The integration suite creates isolated tenant fixtures and cleans them up. Do not point integration tests at production data.

## Demo seed

`npm run prisma:seed` creates two organizations, six users, four projects and twenty tasks. Demo password: `TaskFlow123!`. Seed credentials are development-only.

## API documentation

OpenAPI source is at `docs/openapi.yaml`. Main groups are `/auth`, `/organizations`, `/projects`, `/tasks`, `/jobs`, and `/dashboard`.

## Important design decisions

**PostgreSQL + Prisma:** relational constraints make organization membership and task relationships explicit while Prisma keeps application queries readable. A raw parameterized PostgreSQL query is intentionally used for full-text search.

**Transactional outbox:** assignment creation and the notification intent are persisted in one database transaction, avoiding the classic database-success/queue-failure inconsistency.

**403 for tenant boundaries:** cross-tenant lookups intentionally use a generic forbidden response to satisfy the security requirement without revealing whether another tenant's identifier exists.

**Soft deletion:** project/task records retain history while normal queries exclude deleted records.

**Queue failure handling:** notification jobs use four total attempts with exponential backoff starting at one second; failed jobs remain in BullMQ for inspection instead of disappearing.

## Repository structure

- `src/routes` HTTP boundary and validation
- `src/services` business and tenant-scoping rules
- `src/middleware` authentication/RBAC
- `src/jobs` outbox publishing
- `src/worker.ts` background notification processing
- `prisma` schema, migration and seed
- `tests` unit and cross-tenant integration tests
- `docs/openapi.yaml` API contract

## Security notes

Passwords use bcrypt cost 12. Authentication endpoints are rate-limited. Secrets are read from environment variables and `.env` is ignored. Error responses do not return stack traces. Production deployments should use strong secrets, TLS, restricted CORS, managed PostgreSQL/Redis credentials, and a real email provider in place of the demonstration notification sink.
