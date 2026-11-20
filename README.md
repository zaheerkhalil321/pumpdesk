# PumpDesk

PumpDesk is a modern concrete pumping operations platform built for concrete pumping companies. It is designed to replace outdated dispatch and scheduling software with a faster, cleaner, and AI-powered experience.

> **Status:** Active development (Pre-Alpha)

---

## Tech Stack

### Frontend
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend
- Supabase
  - PostgreSQL
  - Authentication
  - Storage
  - Row Level Security (RLS)

### Infrastructure
- GitHub (Source Control)
- Vercel (Hosting & Deployments)

---

## Getting Started

### Clone the repository

```bash
git clone https://github.com/pinecoastweb/pumpdesk.git
cd pumpdesk
```

### Install dependencies

```bash
npm install
```

### Create environment variables

Create a `.env.local` file in the project root.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Start development server

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

## Project Structure

```
src/
│
├── app/             # Next.js App Router pages
├── components/      # Shared UI components
├── lib/             # Utilities & Supabase client
├── hooks/
├── types/
└── styles/
```

---

## Database

The database is hosted on Supabase.

Database design is maintained separately in:

```
docs/database.dbml
```

The DBML file is considered the source of truth before creating SQL migrations.

---

## Deployment

Every push to the `main` branch automatically deploys to Vercel.

Deployment workflow:

```
VS Code
    ↓
Git Commit
    ↓
GitHub
    ↓
Vercel
    ↓
Production
```

---

## Development Workflow

1. Create a feature branch.
2. Build the feature.
3. Test locally.
4. Commit changes.
5. Push to GitHub.
6. Open a Pull Request.
7. Merge into `main`.
8. Vercel deploys automatically.

---

## Coding Standards

- TypeScript only
- Use Server Components by default
- Client Components only when necessary
- Keep components small and reusable
- Prefer composition over duplication
- Never commit secrets or `.env.local`
- Database changes should begin in `database.dbml`

---

## Future Features

- AI Dispatch Assistant
- Drag-and-drop Scheduling
- Operator Mobile App
- GPS Tracking
- Equipment Maintenance
- Work Tickets
- Customer Portal
- Digital Signatures
- Invoicing
- Stripe Payments
- Reporting & Analytics

---

## License

Private repository.

Copyright © PumpDesk.
## Customer notifications (environment)

Automatic customer texts need two server-only variables (names only; set the values in `.env.local` and in the host's settings, never in the repo):

- `SUPABASE_SECRET_KEY`: the Supabase service-role key. Used only by the sender in `src/features/notifications/server/process-deliveries.ts`.
- `NOTIFICATIONS_RUN_SECRET`: the password for `POST /api/notifications/run`. The same value goes into Supabase Vault as `notifications_run_secret`, with the route's full URL as `notifications_run_url`; a pg_cron job calls the route every minute.
