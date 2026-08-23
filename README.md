# TaskFlow Backend

TaskFlow is a production-oriented, multi-tenant project management backend built with Node.js, TypeScript, Express, PostgreSQL, Redis, and BullMQ.

## Current milestone

Project foundation is initialized with TypeScript, Express, security middleware, environment configuration, and a health endpoint.

## Planned architecture

- Express API
- PostgreSQL + Prisma
- Redis + BullMQ worker
- JWT authentication and refresh-token rotation
- Organization-scoped RBAC and cross-tenant isolation
- Projects, tasks, assignments, and comments
- Background email notifications with retry and dead-letter handling
- Automated unit/integration/security tests
- OpenAPI/Swagger documentation
- Docker Compose for API, worker, PostgreSQL, and Redis

## Health check

`GET /health`
