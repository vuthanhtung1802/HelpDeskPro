# HelpDesk Pro Backend

NestJS API for HelpDesk Pro, backed by PostgreSQL and Prisma.

## Requirements

- Node.js 22.13 or newer
- npm 11 or newer
- PostgreSQL 17, or Docker with Docker Compose

## Local setup

```bash
cp .env.example .env
npm install
npm run prisma:generate
docker compose up -d postgres
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

The API runs at `http://localhost:3000/api/v1`. Swagger is available at
`http://localhost:3000/api/docs`; health status is available at
`http://localhost:3000/api/v1/health`.

Authentication endpoints:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me` with a Bearer access token
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `PATCH /api/v1/auth/change-password` with a Bearer access token
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

Register and login return an access token in the response body. The refresh
token is only sent through the `helpdesk_refresh_token` HttpOnly cookie and its
hash is stored in PostgreSQL.

## User administration

All user-management endpoints require an ADMIN Bearer access token:

- `GET /api/v1/users?page=1&limit=10&search=&role=&status=`
- `GET /api/v1/users/agents`
- `GET /api/v1/users/:id`
- `PATCH /api/v1/users/:id`
- `PATCH /api/v1/users/:id/role`
- `PATCH /api/v1/users/:id/status`
- `DELETE /api/v1/users/:id`

Blocking, changing the role of, or soft-deleting a user revokes that user's
active refresh-token sessions. An administrator cannot perform those actions on
their own account.

## Categories

Every authenticated user can read active categories. ADMIN users can additionally
create, update, and deactivate categories:

- `GET /api/v1/categories`
- `GET /api/v1/categories/:id`
- `POST /api/v1/categories`
- `PATCH /api/v1/categories/:id`
- `DELETE /api/v1/categories/:id`

Deleting a category only marks it inactive, preserving every existing ticket
relationship.

## Tickets

Authenticated users only see tickets allowed by their role. Ticket mutations
enforce ownership, assignment, and the status-transition matrix documented in
`PROJECT_SPEC.md`:

- `POST /api/v1/tickets`
- `GET /api/v1/tickets`
- `GET /api/v1/tickets/:id`
- `PATCH /api/v1/tickets/:id`
- `DELETE /api/v1/tickets/:id`
- `PATCH /api/v1/tickets/:id/assign`
- `PATCH /api/v1/tickets/:id/take`
- `PATCH /api/v1/tickets/:id/status`
- `GET /api/v1/tickets/:id/history`

Assignment, status, content, and deletion changes are recorded in ticket
history. Taking an unassigned ticket and changing its status use conditional
updates to prevent conflicting concurrent changes.

## Conversation, notifications, dashboard, and ratings

Ticket participants can read and add comments, upload attachments, and remove
attachments they own. ADMIN users may remove any attachment:

- `GET /api/v1/tickets/:id/comments`
- `POST /api/v1/tickets/:id/comments`
- `GET /api/v1/tickets/:id/attachments`
- `POST /api/v1/tickets/:id/attachments`
- `DELETE /api/v1/attachments/:id`

Attachments use local storage by default. For deployments with ephemeral disks,
set `ATTACHMENT_STORAGE=cloudinary` and configure the `CLOUDINARY_*`
variables. Downloads continue through the authenticated API, so Cloudinary URLs
are not exposed by the attachment response.
Uploads are grouped under `helpdesk/attachments` by default. Change the root
folder with `CLOUDINARY_FOLDER` when multiple environments share one account.

Authenticated users can read their notifications and mark one or all as read.
Each role has a scoped dashboard, and the ticket owner can rate a closed ticket:

- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`
- `PATCH /api/v1/notifications/read-all`
- `GET /api/v1/dashboard/admin`
- `GET /api/v1/dashboard/agent`
- `GET /api/v1/dashboard/user`
- `POST /api/v1/tickets/:id/rating`

Forgot-password never returns a raw reset token. Enable SMTP and configure the
`SMTP_*`, `MAIL_FROM`, and `RESET_PASSWORD_URL` variables to email a 15-minute
one-time reset link. When SMTP is disabled or delivery fails, the endpoint keeps
the same anti-enumeration response and no usable token remains. Changing or
resetting a password revokes every active refresh token for that account.

## AI Q&A chatbot

USER and AGENT accounts can access the stateless Q&A endpoint:

- `POST /api/v1/ai-chat/ask`

Set `GEMINI_API_KEY` and optionally `GEMINI_MODEL` in `.env` to enable it. The
browser sends at most the latest 10 messages; conversations are not stored in
the database. ADMIN accounts cannot access this endpoint.

Replace both JWT secrets in `.env` with different random values of at least 32
characters before starting the application. Do not commit `.env`.

## Docker

Create `.env` from `.env.example`, replace the JWT secrets, then run:

```bash
docker compose up --build
```

This starts PostgreSQL, the NestJS API at `http://localhost:3000`, and the
frontend at `http://localhost:3001`. The backend container applies committed
migrations before starting. Seed the idempotent demo data once with:

```bash
docker compose exec backend npm run prisma:seed
```

If port 5432 is already in use, choose another host port without changing the
container network:

```bash
POSTGRES_PORT=5433 docker compose up --build
```

For access from another machine, set `FRONTEND_URL` and
`NEXT_PUBLIC_API_URL` in `.env` to the browser-visible origins before building.
Set `NEXT_PUBLIC_SOCKET_URL` as well when Socket.IO is exposed at a different
public origin from the REST API.

## Database commands

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:seed
```

The idempotent seed creates one admin, two agents, three users, five categories,
18 tickets, and sample comments, notifications, and ticket history.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `Admin@123` |
| Agent | `staff@example.com` | `Staff@123` |
| User | `customer@example.com` | `Customer@123` |

These credentials are for local development only.

## Quality checks

```bash
npm run format
npm run lint
npm run build
npm run test
npm run test:e2e
```

## Production

```bash
npm ci
npm run prisma:generate
npm run build
npm run prisma:deploy
npm run start:prod
```
