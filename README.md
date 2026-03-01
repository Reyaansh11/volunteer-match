# ServeConnect Website

A two-sided platform for students and volunteer programs/senior homes, with:
- role-based signup/login
- ranked matching
- two-way match requests
- contact reveal only after accepted requests
- service-hour form generation + NHS `.docx` export

## What Is Productionized

- Postgres-ready Prisma schema
- Bcrypt password hashing
- Hashed session tokens in DB
- Secure cookie defaults for production
- Same-origin checks on all POST routes
- Pure Node DOCX generation (no shell `zip/unzip` dependency)
- Template bundled in repo at `assets/templates/2022-NHS-Service-Hours-Tracking-Template.docx`

## Tech

- Next.js App Router + TypeScript
- Prisma + PostgreSQL
- Tailwind CSS

## Local Setup

1. Configure `.env`:

```bash
cp .env.example .env
```

2. Install and generate Prisma client:

```bash
npm install
npm run db:generate
```

3. Run migrations and seed:

```bash
npm run db:migrate -- --name init-production-ready
npm run db:seed
```

4. Start app:

```bash
npm run dev
```

## Demo Accounts

- Student: `student1@example.com` / `studentpass123`
- Program: `sunrise-home@example.com` / `orgpass123`

## Key Routes

- `/`
- `/login`
- `/register/student`
- `/register/org`
- `/dashboard/student`
- `/dashboard/org`

## API Routes

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/register/student`
- `POST /api/auth/register/org`
- `POST /api/org/opportunities/create`
- `POST /api/match-requests/create`
- `POST /api/match-requests/respond`
- `POST /api/service-hours/fill`
- `GET /api/service-hours/download/:formId`

## Go Live (Vercel + Neon)

1. Push this repo to GitHub.
2. Create a Neon Postgres database.
3. In Vercel, import repo and set environment variable:
   - `DATABASE_URL` (Neon connection string)
   - Optional `RESEND_API_KEY` + `RESEND_FROM_EMAIL` for match-request emails
   - Optional `NHS_TEMPLATE_PATH` (if not using bundled template)
4. Deploy once.
5. Run production migrations:

```bash
npm run db:deploy
```

6. Seed production data (optional):

```bash
npm run db:seed
```

7. Add custom domain in Vercel and update your DNS records at your domain registrar.

## Recommended Post-Launch

- Add password reset via email
- Add rate limiting on auth and request routes
- Add audit logging + error monitoring (Sentry)
- Add legal pages (Privacy, Terms)
