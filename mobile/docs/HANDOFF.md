# PumpDesk Operator Mobile App — Hand-off Report

## 1. Project Overview & Milestones Completed

The native Expo app **`pumpdesk-operator`** has been created in `/Users/mzaheer/Downloads/working-projects/pumpdesk-operator` in accordance with `docs/mobile-app-plan.md`. As confirmed with the user, styling was built using standard React Native `StyleSheet` and a centralized design token system (`src/theme/`), eliminating bundler quirks while delivering 100% type safety and instant light/dark mode adaptation.

| Milestone | Status | Description |
|---|---|---|
| **M1** | ✅ Complete | Project setup, design tokens (`colors.ts`, `typography.ts`, `spacing.ts`), theme provider, Figtree fonts, dark mode switch, and full shared components library in `src/components/ui/`. Interactive component testbed available at `/dev/components`. |
| **M2** | ✅ Complete | Complete data contract implementation: `mockApi`, persistent AsyncStorage store, `outbox` mutation queue, seed data (Rob Black, Midcoast Concrete Pumping, 3 jobs today + 2 upcoming), unit tests for `steps.ts`, `dates.ts`, `ticket-schema.ts`, `outbox.ts`, and `phone.ts`. |
| **M3** | ✅ Complete | Auth screens S1 to S4: S1 Mobile Number ("Welcome back"), S2 OTP ("Enter your code", 6 digits, autofill, resend timer), S3 "You're ready, Rob" (Company card), S4 "Share your location on the job" (permission flow). |
| **M4** | ✅ Complete | S5 Jobs Screen: "Hi, Rob", SegmentedControl ("Today" / "Upcoming"), date display, categorized cards (Completed, Next with primary action, Later), pull-to-refresh, empty states, and offline status bar. |
| **M5** | ✅ Complete | S6 Job Screen: Full step machine (`arrived_shop` -> `departed_shop` -> `arrived_site` -> `departed_site`), dynamic MetaPair, interactive step rows with time editing modal, 5-second undo toast, maps navigation links, and Next Stop card. |
| **M6** | ✅ Complete | S7 Work Ticket & S8 Customer Signature: Sectioned form (Times, Yards pumped, 3"/4" Hose, Extras checkboxes, Comments), canvas signature pad with "Sign here", auto-save debounced draft, Zod validation, and submitted ticket lock. |
| **M7** | ✅ Complete | S9 Customer & Details, S10 Profile, Contact Dispatch bottom sheet, appearance toggle (System, Light, Dark), navigation app preference, reset demo data, and offline warning banner. |

---

## 2. Quality Gates Output

All four required verification commands passed cleanly with **0 errors and 0 warnings**:

### 1. `npx tsc --noEmit`
```
Exit Code: 0 (No type errors)
```

### 2. `npx expo lint`
```
Exit Code: 0 (0 errors, 0 warnings)
```

### 3. `npx jest`
```
PASS tests/steps.test.ts
PASS tests/theme.test.ts
PASS tests/phone.test.ts
PASS tests/outbox.test.ts
PASS tests/ticket-schema.test.ts
PASS tests/dates.test.ts
PASS tests/mock-api.test.ts

Test Suites: 7 passed, 7 total
Tests:       29 passed, 29 total
Snapshots:   0 total
Time:        3.653 s
```

### 4. `npx --yes expo-doctor`
```
20/20 checks passed. No issues detected!
```

---

## 3. Screens Built

1. **S1. Sign In (`app/(auth)/sign-in.tsx`):**  
   Logo tile (navy with teal dot), "PumpDesk / FOR OPERATORS", "Welcome back", formatted phone input, "Send code" button, inline error messages, and "Need help signing in?" link.
2. **S2. Enter Your Code (`app/(auth)/verify.tsx`):**  
   6-digit OTP input boxes with auto-advance and teal active borders, masked phone number `(207) •••-0168`, "Resend code in 0:30" countdown, wrong code error handling ("That code didn't work. Try again.").
3. **S3. You're Ready (`app/(auth)/ready.tsx`):**  
   "You're ready, Rob", Midcoast Concrete Pumping company card with initials tile, "View my jobs" primary button, and "Not your company? Get help" sheet link.
4. **S4. Share Your Location (`app/(auth)/location.tsx`):**  
   Step 3 of 3 indicator, MapPin icon circle, 3 permission explanation rows, "Continue" asking for "While Using App" foreground permission, and "Not now" link.
5. **S5. Jobs Directory (`app/(app)/(jobs)/index.tsx`):**  
   "Hi, Rob", SegmentedControl ("Today" | "Upcoming"), calendar date banner, categorized cards, "Acknowledge job" button with toast notification, and pull-to-refresh.
6. **S6. Job Step Machine (`app/(app)/(jobs)/[jobId]/index.tsx`):**  
   Header `< Jobs`, dynamic state badge, site address, contextual MetaPair, StepRows with "Edit" time picker modal, step progression buttons, 5-second undo toast, Work Ticket card, and Next Stop card.
7. **S7. Work Ticket Form (`app/(app)/(jobs)/[jobId]/ticket.tsx`):**  
   Header `< Job` with title "Work ticket", Times section, Yards pumped input with `yd³` suffix, Hose inputs with `ft` suffix, Extras checkboxes, Comments multiline input, Customer signature preview, debounced auto-save, and Zod submit validation.
8. **S8. Customer Signature (`app/(app)/(jobs)/[jobId]/signature.tsx`):**  
   Prefilled customer name, canvas signature drawing pad (always white background with black ink), "Clear" button, in-app browser terms link, and base64 PNG export.
9. **S9. Customer & Details (`app/(app)/(jobs)/[jobId]/details.tsx`):**  
   Customer name, Site address with Navigate button, Site Contact with direct call and text buttons, Schedule times, Pump specs, Job notes, and side-by-side Contact Dispatch buttons.
10. **S10. Profile (`app/(app)/profile.tsx`):**  
    Avatar with initials "RB", full name and company name, Navigation app preference, Appearance switch (System / Light / Dark), Location toggle, Help & Contact Dispatch sheet, Reset demo data button, and Sign out confirmation alert.
11. **Dev Showcase (`app/dev/components.tsx`):**  
    Complete interactive testbed for every component in light and dark mode.

---

## 4. How to Run the App

Navigate to the operator app directory:

```bash
cd /Users/mzaheer/Downloads/working-projects/pumpdesk-operator
```

### Mock API Mode (Default)
Runs entirely local with seeded data in AsyncStorage:
```bash
npx expo start
```
Or for specific platforms:
```bash
npm run ios
npm run android
npm run web
```

### Environment Variables
- `EXPO_PUBLIC_API_MODE=mock` (default): Uses `mockApi` with local persistence.
- `EXPO_PUBLIC_API_MODE=supabase`: Uses `supabaseApi` (phase 2, done) against the backend from PR #4.
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`: copy `.env.example` to `.env.local` (git-ignored).
  For a phone, the URL must use this computer's Wi-Fi address (`http://<ip>:54321`), not `127.0.0.1`.

## 5. Real backend (phase 2)

`src/api/supabase-api.ts` implements `OperatorApi` with `@supabase/supabase-js` (client in `src/lib/supabase.ts`,
session in AsyncStorage). Pure helpers are split out and unit-tested: `supabase-mapping.ts` (JSON to app types),
`supabase-errors.ts` (backend error to `ApiError`), `day-window.ts` (today / upcoming in America/New_York).

| OperatorApi | Backend |
|---|---|
| `sendCode` | `auth.signInWithOtp({ phone })` (the sign-up hook rejects unknown numbers: `phone_not_found`) |
| `verifyCode` | `auth.verifyOtp({ type: 'sms' })`, then RPC `link_operator_login` (signs out again if linking fails) |
| `signOut` | `auth.signOut()` |
| `getMe` | RPC `operator_me` (fails fast with `forbidden` when there is no session) |
| `listToday` / `listUpcoming` | RPC `operator_jobs(p_from, p_to)`; today = [00:00, next 00:00) New York time; upcoming = tomorrow through N days |
| `getJob` / `markSeen` | `operator_job` / `mark_job_seen` |
| `acknowledge` / `recordStep` / `undoStep` / `editStepTime` | `acknowledge_assignment` / `record_job_step` / `undo_job_step` / `edit_job_step_time` |
| `getTicketExtras` / `getTicket` | `ticket_extras` / `get_work_ticket` (+ download of the signature PNG from the `signatures` bucket into `signaturePng`) |
| `saveTicket` | upload PNG to `signatures/<companyId>/<jobId>.png` (upsert), then `save_work_ticket` with `signaturePath` |
| `submitTicket` | `submit_work_ticket` |

Error codes added to `ApiErrorCode`: `ambiguous_phone`, `job_cancelled`, `step_out_of_order`, `too_early`,
`ticket_locked`, `invalid_ticket`, `invalid_time`. `not_operator` / `not_assigned` map to `forbidden`.
The outbox now drops an item whose error can never succeed (cancelled job, locked ticket, bad ticket, ...)
instead of retrying it forever and blocking everything behind it.

Live check: `LIVE_SUPABASE=1 LIVE_SUPABASE_URL=... LIVE_SUPABASE_ANON_KEY=... npm run test:live` (see
`tests/live/supabase-live.test.ts`). It signs in Rob, walks a job through acknowledge, steps, undo, ticket with
signature and submit, and checks the DB with `psql`. It changes data; run `supabase db reset` afterwards for fresh
demo jobs. Open: hosted Supabase and Twilio (real SMS); local test code is 123456.
