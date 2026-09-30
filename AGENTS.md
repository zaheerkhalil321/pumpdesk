<!-- BEGIN:nextjs-agent-rules -->
# AGENTS.md — PumpDesk Master AI Instructions & Boundaries (2026 Edition)

PumpDesk is a modern SaaS platform for concrete pumping companies (target client: Midcoast Concrete Pumping).
The goal is not to recreate CreteSuite. The goal is to build a faster, simpler, AI-first platform that operators and office staff actually enjoy using.

---

## 0. Git & Deployment Governance (STRICT INVARIANT)

- 🚨 **NEVER RUN `git push` WITHOUT EXPLICIT USER PERMISSION.** 🚨
- Running `git push` automatically, proactively, or as part of a task completion is **STRICTLY FORBIDDEN**.
- You may ONLY run `git push` if the user explicitly writes a direct command in their prompt (e.g. "push", "git push", "push the code").
- Even if all tests pass, builds compile, and commits are made locally, **KEEP ALL CHANGES LOCAL**. Never push to remote without explicit approval.
- Local commits (`git commit`) are allowed to save work, but `git push` is locked down permanently.

---

## 1. Scope Governance (Strict V1 vs V2 Boundaries)

Every new conversation tab MUST adhere to the following scope boundaries:

### IN SCOPE (Phase 1 — Core Dispatch MVP):
- **Schedule Board:** Gantt dispatch timeline grid (pumps lanes: 34M, 28M, 47M, Line pumps) with date navigator.
- **Quick Order Booking:** 15-second Quick Order Drawer (Customer, Site, Pump size, Pour start time, Volume).
- **Pour Orders Directory:** Master table with status filters (`Pending`, `Confirmed`, `Turned In`, `Cancelled`) and Order Dossier.
- **CRM Master Directories:** Customers, Contacts & Superintendents, and Job Sites directories.
- **Fleet & Crew:** Equipment list (Pumps with boom lengths) and Operator roster.
- **Company Settings:** Midcoast Pumping profile, yard address, and base rate presets.

### STRICTLY OUT OF SCOPE (Deferred to Phase 2 / V2):
- ❌ **Do NOT build** the Operator Native/PWA Mobile App (Phase 2).
- ❌ **Do NOT build** QuickBooks Online two-way invoicing synchronization.
- ❌ **Do NOT build** Stripe/ACH Customer Self-Service Payment Portal.
- ❌ **Do NOT build** Live Uber-style GPS map telematics or tracking.
*If the user asks about these, clarify that they are designated for Phase 2.*

---

## 2. Dependency Governance (Package Lock)

- **NEVER install or add new packages (`npm install`) without explicit user permission.**
- Always build with the existing package roster:
  - Framework: `next` (16.x App Router), `react` (19.x), `typescript` (5.x).
  - UI & Styling: `tailwindcss` (v4), `shadcn/ui`, `lucide-react`, `sonner`.
  - Forms & Validation: `react-hook-form`, `@hookform/resolvers`, `zod`.
  - State & Dates: `nuqs`, `date-fns`, `date-fns-tz`.
  - Database: `@supabase/supabase-js`.
  - Testing: `@playwright/test`, `vitest`.
- If a new package is genuinely needed, you MUST ask the user and receive confirmation BEFORE installing it.

---

## 3. Frontend & Styling Standards (Strict Invariants)

- **NEVER use inline styles (`style={{ ... }}`).** Inline styling is completely forbidden.
- **Always use Tailwind CSS utility classes.**
- **Conditional Classes:** Always use the `cn()` utility (`clsx` + `tailwind-merge`) from `@/lib/utils`.
- **CSS Files Policy:**
  - Do NOT create random, ad-hoc `.css` files across the codebase.
  - All global tokens, color variables, and font settings live strictly in `src/app/globals.css` using Tailwind CSS v4 `@theme inline`.
- **Colors & Theme:**
  - Never hardcode colors (e.g., `#FF5500`, `#1E293B`, `rgb(...)`).
  - Always use theme variables (`text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`).
  - Safety Orange accents use the standardized `orange-600` / `orange-500` tokens.
- **UI Components:**
  - Use ONLY the approved components from `@/components/ui/` (shadcn/ui primitives).
  - Use `lucide-react` for all icons.
- **No Emojis:** Never use emojis in UI buttons, tables, or labels. Use crisp vector SVGs from `lucide-react`.

---

## 4. Code Style & Architecture

- **Language:** TypeScript everywhere in strict mode. Zero `any`.
- **Components & Modularity:**
  - **Always build small, reusable, single-responsibility components.** Never dump monolithic blocks of UI or logic into `page.tsx` routing files.
  - Structure feature components cleanly in dedicated directories (e.g., `src/components/schedule/`).
  - Always use reusable design system patterns, Tailwind utility classes, and approved UI primitives from `@/components/ui/`.
  - Functional components with named exports.
  - Prefer Server Components by default. Use `"use client"` only when interactivity (hooks, state, event listeners) is required.
- **Next.js 16 Standards:**
  - `params` and `searchParams` in pages and layouts are Promises. Always `await params` and `await searchParams`.
  - `cookies()` and `headers()` are Promises. Always `await cookies()`.
- **Forms:** Always use `react-hook-form` paired with `zod` and `@hookform/resolvers`.
- **Dates & Timezone:** Always format dates with `date-fns-tz` locked to `America/Chicago` (Central Time) to eliminate hydration mismatches.

---

## 5. Database Authority (Supabase & Multi-Tenancy)

- **Single Source of Truth:** `docs/pumpdesk-database.dbml`.
  - Do NOT create or modify tables or columns before checking the DBML.
- **Multi-Tenancy:** Every operational table MUST include `company_id` (UUID).
- **Primary Keys:** Use UUID primary keys (`gen_random_uuid()`). Never rely on sequential integer IDs.
- **Row Level Security (RLS):**
  - Assume the frontend is public.
  - All tables must have RLS enabled with subquery caching: `(SELECT auth.uid()) = user_id`.
  - Never expose Supabase Service Role keys to the client.
- **Soft Deletes:** Never run hard `DELETE` queries on core operational data (Pumps, Customers, Contacts, Orders). Always use `is_active: false` to preserve financial audit trails.

---

## 6. Definition of Done (Quality Gates)

Before concluding any development task, you MUST verify:
1. `npm run lint` &rarr; 0 errors, 0 warnings.
2. `npx tsc --noEmit` &rarr; 0 TypeScript errors.
3. `npm run build` &rarr; Production build compiles cleanly.
4. `npm run test:unit` &rarr; All unit tests pass.

---

## 7. Ultimate Goal

Every feature should answer:  
**Does this make a concrete pumping company (dispatcher Jessie) faster?**  
If not, reconsider the design. PumpDesk should become the simplest, fastest, and most enjoyable concrete pumping platform available.
<!-- END:nextjs-agent-rules -->
