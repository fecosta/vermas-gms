# Vermas GMS

Internal grant/investment management system for Vermas+. Covers the full lifecycle from Sourcing → Onboarding for philanthropic investments across Latin America.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS 4** + shadcn/ui (Radix)
- **PostgreSQL** (Supabase or Neon) via **Prisma 7**
- **Auth.js v5** (email/password, JWT sessions)
- **Vitest** for unit tests

## Prerequisites

- Node.js 20.9+
- npm 10+
- A PostgreSQL database (Supabase free tier works)

## Local Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd vermas-gms
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL and AUTH_SECRET at minimum
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (direct, not pooled, for migrations) |
| `AUTH_SECRET` | Yes in prod | Random secret for JWT signing. Generate: `openssl rand -base64 32` |
| `AUTH_URL` | Recommended | Base URL of the deployment (e.g. `https://gms.vermas.org`) |

> **Supabase users:** Use the **Direct Connection** string (port 5432) for `DATABASE_URL` when running migrations. For production app runtime, switch to the **Transaction** pooler string. See [Supabase + Prisma docs](https://supabase.com/docs/guides/database/prisma).

## Dev Server

```bash
npm run dev
# Open http://localhost:3000
```

## Database

```bash
# Run migrations (applies schema changes)
npm run db:migrate

# Open Prisma Studio (DB browser)
npm run db:studio
```

## Seed

Populates the database with demo data: one user per role, sample organizations, and 12 initiatives spread across pipeline stages.

```bash
npm run db:seed
```

Credentials printed after seeding (all use password `Vermas2025!`):

| Role | Email |
|---|---|
| CEO | ceo@vermas.org |
| KMD | kmd@vermas.org |
| AL (Education) | al.education@vermas.org |
| AL (Democracy) | al.democracy@vermas.org |
| AT | at@vermas.org |
| AD | ad@vermas.org |
| TL | tl@vermas.org |
| Peer Reviewer 1 | reviewer1@vermas.org |
| Peer Reviewer 2 | reviewer2@vermas.org |
| Admin | admin@vermas.org |

## Tests

```bash
npm test          # run once
npm run test:watch  # watch mode
```

Tests cover the two highest-risk areas: the authorization layer (`tests/authz/`) and the stage-transition workflow (`tests/workflow/`).

## Project Structure

```
app/
  (auth)/login        Login page
  (app)/              Authenticated shell (layout + nav)
    dashboard/        Role-aware dashboard
    initiatives/      Pipeline (Kanban + table) — Sprint 1
    organizations/    Org & contact CRUD — Sprint 1
    legal/            Legal DD module — Sprint 4
    strategy/         Strategy docs — Sprint 5
    admin/            User management + audit log — Sprint 5
lib/
  auth/               Auth.js config + session types
  authz/              can(user, action, resource) — THE one permissions gate
  db/                 Prisma client singleton
  workflow/           Stage-transition rules + canTransition guard
  notifications/      Event → notification fan-out (Sprint 5)
prisma/
  schema.prisma       Full data model (24 models, 20 enums)
  seed.ts             Demo data
tests/
  authz/              Permission matrix tests
  workflow/           Stage-transition guard tests
```

## Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Set environment variables (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`)
4. Deploy

After deploy, run migrations and seed via Vercel's CLI or a one-off function:
```bash
npx vercel env pull .env.production.local
npx dotenv -e .env.production.local -- npm run db:migrate
npx dotenv -e .env.production.local -- npm run db:seed
```

## Sprint Plan

| Sprint | Scope |
|---|---|
| 0 ✅ | Foundation: scaffold, schema, auth, authz, workflow, seed, shell |
| 1 | Pipeline: Initiative/Org/Contact CRUD, Kanban, stage transitions, audit log |
| 2 | Documents, concept review, CEO decisions, comments |
| 3 | Application, review report, memo, peer review |
| 4 | Legal DD module, onboarding, Grant + KPIs |
| 5 | Dashboards, notifications, admin, polish |

## Open Questions (confirm before Sprint 1)

- **Contact.organizationId**: currently nullable (supports individual contacts). Should it be required (always create an Org record, even for individuals)?
