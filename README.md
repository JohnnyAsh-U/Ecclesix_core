# Ecclesix Core

Ecclesix Core is the control-plane service for a multi-tenant church management platform Ecclesix. It provides a FastAPI API for administration, authentication, user management, tenant operations, billing and plan administration, tenant database migrations, backups, audit logs and storage reporting.

The repository also contains a React/Vite administrative frontend. The backend is the primary application surface. Some frontend control-plane screens currently use generated in-memory mock data, so the frontend should be treated as a work in progress until each screen is connected to the API.

## Contents

- [Architecture](#architecture)
- [Features](#features)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Backend setup](#backend-setup)
- [Frontend setup](#frontend-setup)
- [First login](#first-login)
- [API overview](#api-overview)
- [Authentication and authorization](#authentication-and-authorization)
- [Database and migrations](#database-and-migrations)
- [Backups and object storage](#backups-and-object-storage)
- [Django integration](#django-integration)
- [Development workflow](#development-workflow)
- [Current implementation notes](#current-implementation-notes)
- [Contributing](#contributing)

## Architecture

```text
React/Vite control plane
          |
          | JSON API, Bearer access token, HttpOnly refresh cookie
          v
FastAPI (Ecclesix Core)
    |             |             |             |
    v             v             v             v
PostgreSQL     Redis       Django API     S3-compatible storage
                              |
                              v
                         Tenant services

APScheduler runs scheduled PostgreSQL backups
```

The backend uses:

- FastAPI for HTTP routing and dependency injection.
- SQLAlchemy 2 async sessions for application data.
- Alembic for schema migrations.
- PostgreSQL as the intended production database.
- JWT access and refresh tokens with bcrypt password hashing.
- TOTP-based two-factor authentication through `pyotp`.
- APScheduler for scheduled backup jobs.
- `pg_dump` and `psql` for database backup and restore operations.
- S3-compatible object storage through `boto3`.
- An async HTTP client for authenticated Django internal API calls.
- React 19, Vite, TanStack Router, TanStack Query, Axios, and TypeScript in the frontend.

## Features

### Authentication and administration

- Username/password login.
- JWT access tokens and refresh tokens.
- Refresh token stored in an HttpOnly cookie.
- Optional TOTP two-factor authentication.
- TOTP setup, enable, verification, and disable flows.
- Current-user profile and password management.
- Admin-managed creation, activation, deactivation, update, listing, and deletion of moderator users.
- Role-based access control for `admin` and `mod` users.

### Multi-tenant control plane

The FastAPI service proxies tenant management to the Django service and can:

- List and create tenants.
- Retrieve and update tenant details.
- Activate and deactivate tenants.
- Manage tenant domains.
- Read and update tenant storage quotas.
- Read migration summaries and migration state.
- Run migrations for a tenant.

When a tenant is created or activated successfully, the backend attempts to create/register its local backup configuration and scheduled backup job. When a tenant is deactivated, it attempts to unregister that job.

### Billing and plans

Billing and plan endpoints proxy requests to Django. They support recent billing records, billing statistics, month/year filtering, billing creation, plan changes, plan listing, plan CRUD, and plan detail retrieval.

### Backups

- Per-tenant schema backups.
- Full database backups.
- Scheduled backup jobs managed by APScheduler.
- On-demand tenant and full backup triggers.
- Backup status and history.
- S3-compatible upload and presigned download URLs.
- Configurable per-tenant retention.
- Purging of old backups.
- Tenant schema restore from object storage.
- Shared concurrency limit for backup jobs.
- Audit entries for download URL issuance.

### Frontend

The frontend includes routes and UI areas for:

- Login and unauthenticated error states.
- Tenants.
- Billing.
- Profile.
- Shared loading, error, navigation, theme, confirmation, and sign-out components.



## Repository layout

```text
.
├── main.py                    # FastAPI application and startup lifecycle
├── requirements.txt           # Python dependencies
├── .env.example               # Backend environment template
├── alembic.ini                # Alembic configuration
├── alembic/
│   ├── env.py                 # Reads DATABASE_URL and model metadata
│   └── versions/              # Database revisions
├── src/
│   ├── core/                  # Settings, security, DB dependencies, clients, storage
│   ├── database/              # SQLAlchemy models, engine, seed helpers
│   ├── routers/               # Public and Django-proxy API routers
│   ├── schemas/               # Pydantic request/response schemas
│   └── services/              # Authentication, users, backups, audit
└── frontend/
    ├── package.json           # Frontend scripts and dependencies
    └── src/
        ├── routes/            # TanStack Router route tree
        ├── views/              # Page and error views
        ├── services/           # API and current mock control-plane service
        ├── hooks/              # Query and mutation hooks
        └── config/api.ts       # Axios API client
```

## Prerequisites

Install the following before running the complete stack:

- Python 3.11 or newer is recommended.
- Node.js 20 or newer and npm.
- PostgreSQL and the PostgreSQL client tools (`pg_dump` and `psql`).
- Redis, if code paths requiring the configured Redis service are enabled.
- A running Django service exposing the internal API paths used by `DjangoClient`.
- An S3-compatible object store such as MinIO, AWS S3, or another compatible provider for backups.

For a backend-only development session, PostgreSQL, Django, and object storage are still required by the startup and feature paths that use them. The application creates a Django client and starts the backup scheduler during startup.

## Configuration

Create the backend environment file:

```bash
cp .env.example .env
```

Do not use the example secrets or passwords outside local development. Generate strong, separate values for both JWT secrets and internal service secrets.

### Environment variables

| Variable | Purpose | Example/default |
| --- | --- | --- |
| `DATABASE_URL` | Application and Alembic database URL | `postgresql+asyncpg://user:password@localhost:5432/ecclesix` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379/0` |
| `ACCESS_SECRET_KEY` | Signs access JWTs | required in production |
| `REFRESH_SECRET_KEY` | Signs refresh JWTs | required in production |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `10080` |
| `REFRESH_TOKEN_EXPIRE_MINUTES` | Refresh token lifetime | `10080` |
| `CORS_ORIGINS` | Comma-separated browser origins | `http://localhost:5173` |
| `ALLOWED_HOSTS` | Allowed host list | `localhost,127.0.0.1` |
| `APP_NAME` | FastAPI title | `Ecclesix Core API` |
| `APP_VERSION` | API version string | `1.0.0` |
| `PROD` | Disables OpenAPI, Swagger, ReDoc, and uvicorn Reload when `true` | `false` |
| `DJANGO_BASE_URL` | Django service base URL | `http://localhost:8000` |
| `INTERNAL_API_SECRET_ADMIN` | Django header secret for admin calls | required for admin api calls must be identical to the one in Ecclesix  |
| `INTERNAL_API_SECRET_MOD` | Django header secret for moderator calls | required for mod api calls must be identical to the one in Ecclesix |
| `DJANGO_REQUEST_TIMEOUT` | Django request timeout in seconds | `10` |
| `DJANGO_RETRY_MAX_ATTEMPTS` | Django retry count | `3` |
| `DJANGO_RETRY_DELAY` | Delay between Django retries | `1.0` |
| `S3_ENDPOINT_URL` | S3-compatible endpoint | `http://localhost:9000` |
| `S3_ACCESS_KEY` | Object-store access key | required |
| `S3_SECRET_KEY` | Object-store secret key | required |
| `S3_REGION` | Object-store region | `us-east-1` |
| `S3_BUCKET_NAME` | Backup bucket | required |
| `BACKUP_DB_HOST` | Database host used by `pg_dump`/`psql` | `localhost` |
| `BACKUP_DB_PORT` | Database port used by backup tools | `5432` |
| `BACKUP_DB_USER` | Backup database user | required |
| `BACKUP_DB_PASSWORD` | Backup database password | required |
| `BACKUP_DB_NAME` | Database name passed to backup tools | required |

`src/core/config.py` supplies development fallbacks for several values, but production deployments should set every integration credential explicitly.

## Backend setup

From the repository root:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
```

Update `.env` with a reachable PostgreSQL database and the required service credentials. Then apply migrations:

```bash
alembic upgrade head
```

Start the API with Uvicorn:

```bash
python main.py
```

The API is then available at `http://localhost:8080`.

Development API documentation is available at:

- Swagger UI: `http://localhost:8080/docs`
- ReDoc: `http://localhost:8080/redoc`
- OpenAPI JSON: `http://localhost:8080/openapi.json`

These endpoints are disabled when `PROD=true`.

For a production-style process, Gunicorn is included in the dependency list. Use an appropriate worker configuration for the deployment environment, for example:

```bash
gunicorn main:app -k uvicorn.workers.UvicornWorker --workers 2 --bind 0.0.0.0:8001
```

## Frontend setup

In a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env.local` and point the client at the backend:

```dotenv
VITE_API_URL=http://localhost:8001/api/v1
```

Run the Vite development server:

```bash
npm run dev
```

The default Vite URL is normally `http://localhost:5173`.

Available frontend commands:

```bash
npm run dev       # Start Vite with hot reload
npm run build     # Type-check and create a production build
npm run lint      # Run ESLint
npm run preview   # Serve the production build locally
```

## First login

On first backend startup, the lifespan handler:

1. Creates missing SQLAlchemy tables.
2. Creates `public` and `__full__` backup configurations when absent.
3. Creates an admin user when no admin exists.
4. Connects the Django client.
5. Bootstraps backup jobs and starts APScheduler.

The current development seed credentials are:

```text
Username: admin
Password: 1234
Email:    support@ecclesix.com
```

Change this password immediately in any non-local environment. The default administrator is created only when no admin role exists.

## API overview

All application routes are prefixed with `/api/v1`.

### Authentication: `/api/v1/auth`

| Method | Path | Access |
| --- | --- | --- |
| `POST` | `/login` | Public |
| `GET` | `/logout` | Authenticated |
| `GET` | `/me` | Authenticated |
| `GET` | `/refresh` | Refresh cookie |
| `POST` | `/verify-2fa` | Temporary 2FA token |
| `POST` | `/2fa/setup` | Admin or moderator |
| `POST` | `/2fa/enable` | Admin or moderator |
| `POST` | `/2fa/disable` | Admin or moderator |
| `POST` | `/change-password` | Authenticated |
| `PUT` | `/me` | Authenticated |

Login uses `application/x-www-form-urlencoded` fields named `username` and `password`, as required by `OAuth2PasswordRequestForm`. A successful response includes an access token and sets the refresh token cookie. If 2FA is enabled, login first returns a short-lived `temp_token`; submit that token and the TOTP code to `/verify-2fa`.

### Users: `/api/v1/users`

Admin-only endpoints for creating, listing, updating, activating, deactivating, and deleting non-admin users. New users currently receive the service's default initial password (`1234`), so an administrator should require a password change after provisioning.

### Backups: `/api/v1/backups`

| Method | Path | Access |
| --- | --- | --- |
| `GET` | `/` | Admin or moderator |
| `GET` | `/{tenant_schema}` | Admin or moderator |
| `POST` | `/tenant/{tenant_schema}` | Admin or moderator |
| `POST` | `/full` | Admin or moderator |
| `POST` | `/{backup_id}/restore` | Admin |
| `POST` | `/{backup_id}/download-url` | Admin |
| `POST` | `/purge` | Admin |

Tenant backups use `pg_dump --schema`; full backups use a database-wide dump. Backup files are temporarily written under `/tmp`, uploaded to object storage when possible, and then removed locally. A failed object-storage upload can still leave a job marked successful with a null storage path, so operators should inspect logs and job metadata.

### Audit logs: `/api/v1/audit-logs`

Admin-only listing, filtering, single-record lookup, and lookup by administrator. Supported list filters include `limit`, `offset`, `admin`, and `action`.


### Django-backed control-plane routes

These routes authenticate locally, then call Django using an `X-Internal-Token` header:

| Area | Prefix | Capabilities |
| --- | --- | --- |
| Tenants | `/api/v1/tenants` | List, create, detail/update, activate, deactivate, domains, storage |
| Migrations | `/api/v1/migrations` | Summary, run tenant migration, migration state |
| Billing | `/api/v1/billings` | Recent records, stats, filters, create, plan changes |
| Plans | `/api/v1/plans` | List, create, detail, update, delete |
| Storage | `/api/v1/storage` | Tenant storage list and overall statistics |

The internal service client retries connection/time-out failures and maps Django errors into FastAPI responses. It does not replace the need for the Django service to be running and correctly configured.

### Operational endpoints

- `GET /health` returns the current simple health payload.

## Authentication and authorization

Access tokens are sent as:

```http
Authorization: Bearer <access-token>
```

The frontend Axios client automatically reads the token from its auth store and sends it with API requests. It also sends cookies with `withCredentials: true` and clears local auth state after a `401` response.

The backend checks that the token identifies an active user. Role checks use the values `admin` and `mod`:

- `admin`: full control-plane administration, user management, audit logs, backup restore/download/purge.
- `mod`: tenant, backup, billing, plan, storage, and migration access where explicitly allowed.

The database stores passwords as bcrypt hashes. Refresh tokens are signed separately from access tokens and stored in an HttpOnly cookie.

## Database and migrations

The local SQLAlchemy models currently cover:

- `users`: admin and moderator accounts.
- `backup_jobs`: backup execution status and storage metadata.
- `tenant_backup_configs`: tenant backup enablement and retention.
- `audits`: administrative audit events.

Useful Alembic commands:

```bash
alembic current
alembic history
alembic upgrade head
alembic downgrade -1
alembic revision --autogenerate -m "describe the change"
```

Always review autogenerated revisions before applying them. The application currently also runs `Base.metadata.create_all` during startup. That is useful for a fresh development database, but Alembic should remain the source of truth for controlled schema changes and deployments.

## Backups and object storage

The backup implementation depends on all of the following:

1. A PostgreSQL database accessible with the credentials in `BACKUP_DB_*`.
2. The `pg_dump` and `psql` binaries available on the API host.
3. An S3-compatible bucket configured through the `S3_*` variables.
4. APScheduler's persistent job store, which uses the configured database URL.

Backup schedules are bootstrapped during application startup. The global concurrency limit defaults to three simultaneous backup tasks and can be changed with `BACKUP_CONCURRENCY_LIMIT` in code/configuration as supported by the current settings model.

Do not treat a successful API response alone as proof that a backup is safely stored. Confirm the backup job status, `storage_path`, object-store presence, and logs.

## Django integration

`src/core/django_client.py` owns a singleton `httpx.AsyncClient`. It is initialized and connected in the FastAPI lifespan and disconnected during shutdown. The client:

- Uses `DJANGO_BASE_URL` as its base URL.
- Adds `X-Internal-Token` based on the local user's role.
- Retries connection and timeout failures.
- Applies the configured timeout.
- Converts Django error responses to FastAPI `HTTPException` responses.

The Django service must expose the internal paths listed in `src/core/internal_urls.py`, including tenant, migration, billing, plan, storage, and health-related paths.


## Development workflow

Before opening a pull request:

```bash
# Backend: activate the virtual environment first
python -m compileall main.py src
alembic upgrade head

# Frontend
cd frontend
npm run lint
npm run build
```

When changing an API contract:

1. Update the backend router and Pydantic schema.
2. Update the relevant frontend type, service, and hook.
3. Verify authentication and role requirements.
4. Add or update an Alembic migration when the database schema changes.
5. Exercise the route through Swagger or an API client.
6. Run the frontend lint and build checks.

There is currently no dedicated automated test suite visible in the repository. New behavior should ideally include focused backend API/service tests and frontend component or route tests as the codebase matures.

## Current implementation notes

These items are important for contributors and deployers:

- The frontend contains a substantial mock `ApiService` that generates tenants, billing data, backups, email, users, logs, and automation data in memory. Do not assume every dashboard screen is backed by the FastAPI API.
- `frontend/src/config/api.ts` is the real Axios client and uses `VITE_API_URL`; integration work should converge screen hooks on this client and the backend routes.
- `main.py` currently allows every host through `TrustedHostMiddleware` (`allowed_hosts=["*"]`). Restrict this before production deployment.
- The example environment contains placeholder secrets and a sample database password. Replace all of them before sharing or deploying an environment.
- The first-start administrator and newly created users currently use the initial password `1234`. This is suitable only for local development and should be replaced with an invitation or forced-reset workflow.
- Startup calls `create_all` in addition to Alembic. Production operations should define which mechanism is authoritative and avoid relying on implicit schema creation.
- Backup execution invokes blocking `subprocess.run` calls from async service methods. High-volume deployments should consider moving dump/restore work to a worker process or job queue.
- Full and public schema restore operations are intentionally rejected by the tenant schema restore path. Treat full-database restoration as an operational procedure requiring explicit safeguards.
- The current `/health` response is a static list and does not validate database, Redis, Django, or storage connectivity.
- The repository contains a generated TanStack route tree. Follow the frontend routing conventions and regenerate it with the project's configured tooling when adding routes.

## Contributing

1. Create a focused branch from the current default branch.
2. Keep backend, frontend, migration, and configuration changes scoped to the feature.
3. Never commit `.env`, credentials, tokens, database dumps, or generated build output.
4. Document new environment variables and API behavior in this README or a more specific document.
5. Run the relevant backend compilation/migration checks and frontend lint/build checks.
6. Include manual verification steps and note any required external services in the pull request.

For questions about the original backend, the source header identifies John Ashimedua and links to [JohnnyAsh-U on GitHub](https://github.com/JohnnyAsh-U).