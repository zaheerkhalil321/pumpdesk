# Operator app: from demo data to the real backend

Plan for taking the operator phone app (`mobile/`) off on-phone demo data and onto the same
Supabase backend as the dispatch web app, so a job Jessie books and assigns on the dashboard shows
up on Rob's phone, and every tap Rob makes (acknowledge, steps, ticket) shows on the dashboard.

Written 2026-11-19. Read with `mobile/docs/HANDOFF.md` (what the app does today) and the build plan
`docs/mobile-app-plan.md` in the web repo (section 7 data contract, section 8 backend list).

---

## Where things stand

**App (`mobile/`, PR pinecoastweb/pumpdesk#3 into `main`).** All screens are built. Every call goes
through one interface, `OperatorApi` (`mobile/src/api/operator-api.ts`). Today `mockApi` answers it;
`supabaseApi` (`mobile/src/api/supabase-api.ts`) is a stub that throws "not ready". The switch is
`EXPO_PUBLIC_API_MODE` (`mock` | `supabase`). Writes already go through an offline outbox
(`mobile/src/api/outbox.ts`) that retries, so every write must be safe to send twice.

**Backend (web repo, branch `feature/v1-step-4-feedback`, not on `main` yet).** 18 migrations in
`supabase/migrations`. What the app can build on:

| Have | Where |
|---|---|
| Companies, memberships, `membership_role` incl. `operator`, `private.company_id()`, `private.has_role()` | 0001 tenancy |
| `employees` with `is_operator`, `phone` (E.164), `user_id → app_users` | 0003 fleet & crew |
| `equipment` (pumps), `job_equipment_assignments` | 0003 / 0006 |
| `jobs` with `scheduled_start`, `arrive_by`, `timezone`, `site_label`, `site_instructions`, `field_status` enum (`scheduled, en_route, on_site, pumping, washout, returning, done`) | 0006 orders |
| `job_employee_assignments` with `acknowledged_at`, `released_at` | 0006 |
| `job_status_history`, `job_contacts`, `job_sites`, `yards`, `branches` | 0006 / later |
| pgTAP tests in `supabase/tests/*.test.sql` | — |

What is **missing** (section 8 of the build plan): phone sign-in, linking a login to an operator,
operator-only read access, the step/ticket functions, the ticket tables and the signature bucket.

**Branches.** `main` has neither the backend nor the app. Backend work must branch from
`feature/v1-step-4-feedback` (or from `main` once that branch is merged). App wiring (phase 2) needs
both the backend branch and PR #3.

---

## Decisions (made here, change only with the user)

1. **Operators read through functions, not tables.** The operator role gets no direct `select` on
   `jobs`, `customers` etc. All reads go through `security definer` RPCs that return exactly the
   app's shapes (`OperatorJob`, `WorkTicketDraft`). This keeps prices, internal notes and other
   operators' jobs out by construction instead of by many RLS policies.
2. **Writes are RPCs too**, each checks "caller is an active operator with a live assignment on this
   job", and each is **idempotent** (same call twice = same result), because the outbox retries.
   The client sends the moment the tap happened (`at`); the server stores it, not `now()`.
3. **Step → field status** (server side, written to `job_status_history`):
   `departed_shop → en_route`, `arrived_site → on_site`, `departed_site → returning`,
   ticket submitted after `departed_site` → `done`. `arrived_shop` changes no field status.
   Undo moves the field status back to what the previous step implies.
4. **Notes for the operator** = `jobs.site_instructions`. `customer_notes` and any internal notes
   are never sent to the app.
5. **Shop** = the operator's branch yard (fallback: the company's first yard).
6. **Phone sign-in** = Supabase Auth phone OTP, Twilio as sender in production. Locally, test OTPs
   from `config.toml` (`[auth.sms.test_otp]`), no real SMS. No secrets in the repo.
7. **Signature images** go to a private storage bucket `signatures`, path
   `<company_id>/<job_id>.png`; the ticket row keeps the path, not base64.
8. **Not in this plan's first phases:** customer SMS ("Pump en route", ticket review), live
   location, time clock on the server, profile photo on the server, push notifications. They are
   phase 4.

---

## Phase 1 — Backend for the operator app (web repo, Supabase)

Branch `feature/operator-backend` from `feature/v1-step-4-feedback`. Only `supabase/` (migrations,
tests, `config.toml`, `seed.sql`) and `docs/` change. No web UI changes.

1. **Phone sign-in config** (`supabase/config.toml`): enable phone sign-in for existing operators
   only (no public sign-up), keep Twilio disabled locally with env placeholders, add test OTPs for
   the seed operator phones.
2. **Link login to operator** — `public.link_operator_login()`: called right after a successful
   OTP verify. Finds the one active employee with `is_operator = true` and `phone = auth phone`,
   sets `employees.user_id`, creates/activates a `company_memberships` row with role `operator`.
   Raises `phone_not_found` when no match, `ambiguous_phone` when more than one company matches.
   Safe to call again.
3. **Tables** (new migration):
   - `job_step_events` (company_id, job_id, employee_id, step `job_step` enum
     `arrived_shop | departed_shop | arrived_site | departed_site`, `at`, `recorded_at`,
     `edited_at`, `undone_at`), one live row per (job, step).
   - `work_tickets` (company_id, job_id unique, the `WorkTicketDraft` fields, `signer_name`,
     `signature_path`, `signed_at`, `status` `draft | submitted`, `submitted_at`, `submitted_by`).
   - `ticket_extras` (company_id, code, label, sort, active) seeded with Off-site washout,
     Primer bag, Extra operator.
   - Storage bucket `signatures` (private) + storage policies: an operator can write only
     `<their company>/<a job they are assigned>.png`; office roles can read.
   - RLS on all new tables: office roles read/write per company; operators no direct access
     (they use the RPCs).
4. **RPCs** (all `security definer`, `set search_path = ''`, granted to `authenticated`):
   - `operator_me()` → `Operator`
   - `operator_jobs(p_from timestamptz, p_to timestamptz)` → `OperatorJob[]` (live assignments
     only, ordered by `scheduled_start`; `isCancelled` from booking status; `changedSinceSeen`
     from a `seen_at` on the assignment)
   - `operator_job(p_job_id)` → `OperatorJob`
   - `mark_job_seen(p_job_id)`
   - `acknowledge_assignment(p_job_id, p_at)`
   - `record_job_step(p_job_id, p_step, p_at)` — also field status + history
   - `undo_job_step(p_job_id, p_step)` — only the latest step
   - `edit_job_step_time(p_job_id, p_step, p_at)` — keeps steps in order, else error
   - `ticket_extras()`, `get_work_ticket(p_job_id)`, `save_work_ticket(p_draft jsonb)`,
     `submit_work_ticket(p_job_id)` (validates like `mobile/src/features/ticket-schema.ts`,
     locks the ticket, sets `done` when the site was left)
   - Errors use clear codes the app maps: `not_operator`, `not_assigned`, `job_cancelled`,
     `step_out_of_order`, `ticket_locked`, `invalid_ticket`.
5. **Seed** (`supabase/seed.sql`): Midcoast, operator Rob Black (+1 207 555 0168, test OTP),
   a yard, a pump "02 · 28m boom", 3 jobs today + 2 upcoming assigned to Rob (mirror
   `mobile/src/api/mock-seed.ts`).
6. **Tests** (`supabase/tests/0005_operator_app.test.sql`, pgTAP like the others): linking,
   operator sees only own jobs and no prices/internal notes, office user unaffected, every write
   RPC is idempotent, step order rules, field status + history writes, undo, ticket lock.
7. **Types:** regenerate `src/types/database.types.ts` (`npm run db:types`).
8. **Docs:** add the operator section to `docs/backend-architecture.md`.

**Done when:** `supabase db reset` applies cleanly, all pgTAP tests pass, web `npx tsc --noEmit`,
`npm run lint`, `npm run test:unit` and `npm run build` still pass, and a short report lists every
RPC with its input/output and errors. Docker must be running for `supabase start`; if it is not,
the report says the SQL was not run.

## Phase 2 — Wire the app (`mobile/`)

After phase 1 is reviewed. Ask the user before adding `@supabase/supabase-js`
(`npx expo install @supabase/supabase-js`; session stored in AsyncStorage).

1. `mobile/src/lib/supabase.ts` — client from `EXPO_PUBLIC_SUPABASE_URL` /
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` (`.env.local`, git-ignored; `.env.example` committed).
2. Fill `supabase-api.ts`: `sendCode` → `signInWithOtp({ phone })`, `verifyCode` → `verifyOtp` then
   `link_operator_login()`, every other method → its RPC; map RPC errors to `ApiError` codes.
   Signature: upload PNG to `signatures`, store the path.
3. Keep `mockApi` for demo and tests; tests for the error mapping and the JSON → type mapping.
4. Run against local Supabase: full flow on a phone in Expo Go.

## Phase 3 — Real end-to-end check

On a shared (staging) Supabase project: Jessie books and assigns a job on the dashboard → it
appears on Rob's phone → acknowledge shows on the dashboard → each step moves the dashboard's field
status → ticket submitted shows on the job. Airplane-mode test: taps queue and send once, no
duplicates. Dashboard gaps found here (e.g. showing the ticket) become web tasks.

## Phase 4 — After it works

Customer SMS on Depart shop and on ticket submit (server side, uses the SMS tables from 0016/0017),
time clock and profile photo on the server, location while en route (only after the client agrees
on privacy), push notifications for new or changed jobs.

## Phase 5 — Release

EAS build (`bunx`/`npx eas-cli`), TestFlight / internal testing for Midcoast, then the stores.
Decide first with the client: native app vs web app (still open). The backend above serves both.

---

## Rules for anyone working on this

- Never `git commit` or `git push` unless the user says so in those words.
- Ask before adding any package.
- Do not change web app screens in phases 1–2.
- No secrets in the repo; Twilio and Supabase keys only in env files that git ignores.
- Report check results faithfully, including anything that could not be run.
