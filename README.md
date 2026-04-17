# JanSetu Complaint Management Platform

Production-ready complaint platform for MLA constituency operations.

## Stack

- Frontend: Next.js App Router + Tailwind CSS v4
- Backend: Next.js route handlers
- Database: MySQL + Prisma ORM
- Auth: OTP login (mock SMS provider)
- Storage: local uploads under `public/uploads`

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Run Prisma migration and generate client:

```bash
pnpm prisma:migrate --name init
pnpm prisma:generate
```

4. Seed departments/officers/admin:

```bash
pnpm prisma:seed
```

5. Run app:

```bash
pnpm dev
```

## Default Admin Login

- Mobile: `9999999999`
- OTP is mocked and logged through Notification service

## Core APIs

- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `POST /api/complaints`
- `GET /api/complaints`
- `GET /api/my-complaints`
- `POST /api/assign`
- `POST /api/respond`
- `POST /api/confirm-resolution`

Additional APIs include upload, cron escalations, heatmap analytics, officer token fetch, and PDF mock summary.

## Scheduled Automation

Run `POST /api/cron/escalations` from a scheduler with header:

- `x-cron-secret: <CRON_SECRET>`

Jobs included:

- Reminder after 48 hours
- Escalation after 7 days
- Auto-close citizen non-response after 7 days
- Resolution confirmation request
