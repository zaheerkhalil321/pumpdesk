# PumpDesk — Production Architecture & Project Setup Specification (2026 Edition)

**Project:** PumpDesk (Next-Gen AI-First Concrete Pumping Dispatch SaaS)  
**Target Client:** Midcoast Concrete Pumping (Chief Dispatcher: Jessie Black)  
**Engineering Standard:** 2026 Enterprise-Grade Next.js 16 + Supabase Architecture  
**Author:** Engineering Team & Antigravity  

---

## 1. Executive Summary & Core Philosophy

PumpDesk is built to replace legacy enterprise software (CreteSuite) with a lightning-fast, modern, keyboard-friendly dispatch platform. 

### Core Architectural Invariants:
1. **Zero-Flicker & Fast Interactions:** Dispatchers book and drag orders in under 30 seconds. Every state mutation is optimistic with zero screen freezes.
2. **Server-First Security:** Next.js Server Actions are treated as public API endpoints guarded by `next-safe-action`, Zod schemas, and session tenant context.
3. **Database-Enforced Integrity:** Race conditions (such as double-booking a pump) are prevented at the PostgreSQL engine level via exclusion constraints.
4. **URL-Driven State:** Filter parameters, active schedule dates, and open slide-over drawers exist in the browser URL (`nuqs`), making states bookmarkable, refresh-safe, and shareable.
5. **Next.js 16 Compliance:** Strict adherence to Next.js 16 Async Request APIs (`await params`, `await cookies()`) and React 19 standards.

---

## 2. Complete Technology Stack & Package Roster

### 2.1 Core Framework & Language
| Tool | Version | Purpose |
| :--- | :--- | :--- |
| **Next.js** | `16.2.x` | App Router, React Server Components (RSC), Server Actions, Partial Prerendering (PPR). |
| **React** | `19.2.x` | Compiler-optimized AST memoization (`babel-plugin-react-compiler`), `useActionState`, `useOptimistic`. |
| **TypeScript** | `5.x` | Strict mode enabled, zero `any` allowance, end-to-end type safety from PostgreSQL to UI. |

### 2.2 Styling, Theme & Design System
| Package | Purpose |
| :--- | :--- |
| **`tailwindcss` (v4)** | CSS-first utility engine using native `@theme` directives without legacy JS config files. |
| **`shadcn/ui` + `@radix-ui`** | Headless, accessible primitives (Dialogs, Slide-over Drawers, Popovers, Dropdowns). |
| **`lucide-react`** | High-contrast industrial SVG iconography. |
| **`sonner`** | Premium toast notification stack for optimistic updates and system alerts. |

### 2.3 Data Layer, Validation & Mutation Engine
| Package | Purpose |
| :--- | :--- |
| **`@supabase/supabase-js`** | PostgreSQL client, Realtime WebSockets, Authentication, and Storage. |
| **`next-safe-action`** | Type-safe, authenticated Server Actions with dependency injection (Tenant `company_id`, User context). |
| **`zod`** | Universal validation schema shared between forms, server actions, and API boundaries. |
| **`react-hook-form`** + **`@hookform/resolvers`** | High-performance client form validation paired with Zod (mandated by `AGENTS.md`). |
| **`nuqs`** | Type-safe URL query parameters engine (manages schedule dates, asset filters, and drawer state). |
| **`date-fns` & `date-fns-tz`** | Explicit timezone formatting locked to `America/Chicago` (Central Time) to eliminate hydration mismatches. |

### 2.4 Testing & Quality Assurance
| Package | Purpose |
| :--- | :--- |
| **`@playwright/test`** | End-to-End (E2E) browser automation (Order booking drawer, schedule drag/drop, work ticket signatures). |
| **`vitest`** | Sub-second unit & business logic runner (Rig hourly minimums, travel time, and yardage overage math). |
| **`@testing-library/react`** | Component isolation testing for mission-critical dispatch components. |

### 2.5 Developer Tooling & Git Hygiene
| Package | Purpose |
| :--- | :--- |
| **`husky` + `lint-staged`** | Pre-commit git hooks that format, lint, and type-check changed files before committing. |
| **`@commitlint/cli`** | Enforces Conventional Commits (`feat(schedule):`, `fix(rates):`). |
| **`eslint` (v9)** | Next.js and React 19 core linting rules. |

---

## 3. Project Directory Structure (Vertical Feature Slices)

To avoid spaghetti code, PumpDesk uses **Feature-Sliced Architecture** where each operational domain owns its components, server actions, hooks, and schemas:

```
pumpdesk/
├── .github/
│   └── workflows/
│       └── ci.yml                      # 5-job parallel GitHub Actions CI pipeline
├── docs/
│   ├── pumpdesk-database.dbml          # Source of truth database schema
│   ├── DESIGN_SYSTEM_INSTRUCTIONS.md   # Visual design tokens & prompt standards
│   └── PROJECT_SETUP_SPECIFICATION.md  # This master setup document
├── supabase/
│   ├── migrations/                     # Versioned SQL migrations (Postgres DDL)
│   ├── seed.sql                        # Deterministic test data (pumps, operators, orders)
│   └── config.toml                     # Local Supabase Docker configuration
├── tests/
│   ├── e2e/                            # Playwright end-to-end tests
│   │   ├── schedule-booking.spec.ts
│   │   ├── orders-dossier.spec.ts
│   │   └── work-ticket-signoff.spec.ts
│   └── setup/
│       └── test-database-seed.ts
├── src/
│   ├── app/                            # Next.js App Router (Routing & Layouts only)
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (app)/                      # Authenticated dispatch shell
│   │   │   ├── layout.tsx              # Persistent 240px Sidebar + Top Operations HUD
│   │   │   ├── schedule/
│   │   │   │   ├── page.tsx            # Gantt Timeline Grid + Slide-over Drawers
│   │   │   │   └── loading.tsx         # Skeleton loader (Zero CLS)
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx            # Master Pour Orders Directory
│   │   │   │   └── [id]/page.tsx       # Order Dossier (Overview, Ticket, Billing)
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx            # Customers Directory
│   │   │   │   └── [id]/page.tsx       # Customer Dossier (Sites, Supers, Orders)
│   │   │   ├── contacts/
│   │   │   │   └── page.tsx            # Master Contacts & Supers Directory
│   │   │   ├── fleet/
│   │   │   │   ├── pumps/page.tsx      # Rigs (34M, 28M, 47M, Line pumps)
│   │   │   │   └── operators/page.tsx  # Driver & Crew roster
│   │   │   └── settings/page.tsx       # Company profile & rate structures
│   │   ├── globals.css                 # Tailwind v4 @theme & global CSS variables
│   │   └── layout.tsx                  # Root layout (Fonts, Providers)
│   ├── components/
│   │   ├── ui/                         # shadcn/ui primitives (button, dialog, input)
│   │   └── layout/
│   │       ├── app-sidebar.tsx         # Categorized 3-domain sidebar
│   │       └── top-hud.tsx             # Header with weather, volume, and active crew
│   ├── features/                       # VERTICAL FEATURE SLICES
│   │   ├── schedule/
│   │   │   ├── components/             # TimelineGrid, OrderBlock, QuickOrderDrawer
│   │   │   ├── actions/                # bookOrder.action.ts, dragOrder.action.ts
│   │   │   ├── hooks/                  # useScheduleFilters.ts (nuqs), useRealtimeSchedule.ts
│   │   │   └── schemas/                # schedule.schema.ts
│   │   ├── orders/
│   │   │   ├── components/             # OrdersTable, DigitalWorkTicket, PricingBreakdown
│   │   │   ├── actions/                # updateTicket.action.ts, approveOrder.action.ts
│   │   │   └── schemas/                # order.schema.ts
│   │   ├── customers/
│   │   │   ├── components/             # CustomerTable, CustomerDossier
│   │   │   └── actions/
│   │   └── fleet/
│   │       ├── components/             # PumpCard, OperatorStatusPicker
│   │       └── actions/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser Supabase client
│   │   │   ├── server.ts               # Async Server Supabase client (cookies)
│   │   │   └── admin.ts                # Service-role privileged client (internal only)
│   │   ├── safe-action.ts              # next-safe-action middleware with tenant injection
│   │   └── date-utils.ts               # Timezone-safe formatting utilities
│   └── types/
│       ├── database.types.ts           # Auto-generated from Supabase schema
│       └── domain.types.ts             # Domain models (Order, Pump, Ticket)
```

---

## 4. Database Architecture & Production Security

All operational tables belong to a tenant (`company_id`). RLS policies are optimized to prevent sequential table scans.

### 4.1 High-Performance RLS Policies
```sql
-- Optimal Subquery Caching (Zero per-row re-evaluation)
CREATE POLICY "tenant_isolation_orders" ON orders
FOR ALL 
USING (
  company_id = (SELECT auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid
);

-- Crucial B-Tree Indexes for Dispatch Lookups
CREATE INDEX idx_orders_company_timeline ON orders (company_id, pour_start_time, status);
CREATE INDEX idx_customers_company ON customers (company_id, company_name);
CREATE INDEX idx_pumps_company ON pumps (company_id, asset_number);
```

### 4.2 Database Engine Exclusion Constraint (Double-Booking Prevention)
```sql
-- Prevents overlapping orders on the same pump at the database engine level
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE orders 
ADD CONSTRAINT prevent_pump_double_booking 
EXCLUDE USING gist (
  pump_id WITH =,
  tstzrange(pour_start_time, pour_end_time) WITH &&
);
```

### 4.3 Multi-Tenant B2B SaaS Architecture
- **Tenant Isolation Anchor:** The `companies` table represents the root tenant boundary.
- **Session Sealing:** The authenticated user's JWT (`auth.jwt()`) carries `app_metadata.company_id`. RLS policies evaluate against this immutable claim, preventing any client-side tenant tampering.
- **Zero-Friction Tenant Scaling:** New concrete pumping companies onboard simply by inserting a new row in `companies` without spinning up new databases or code branches.

### 4.4 Soft-Deletes & Financial Audit Trail Protection
- **No Hard Deletes:** Deleting operational entities (Pumps, Customers, Contacts, Job Sites) never executes SQL `DELETE`.
- **Audit Preservation:** All operational tables utilize `is_active: boolean` (or `deleted_at: timestamptz`). Deactivated records are filtered from active dispatch drawers but preserved in historic work tickets and past invoices.


---

## 5. Proven Solutions for Edge Cases & Gotchas

### 5.1 Timezone Hydration Protection
- All timestamps stored in UTC (`TIMESTAMPTZ`) in PostgreSQL.
- Server-side and client-side rendering uses locked `America/Chicago` timezone via `formatInTimeZone()` from `date-fns-tz`.
- Interactive date headers wrapped with `<time suppressHydrationWarning>`.

### 5.2 Supabase Realtime Resilient Connection Hook
- Listen to `document.visibilityState`.
- When dispatcher refocuses the window after lunch or sleep mode, trigger an instant connection heartbeat and background data refresh.

### 5.3 Layered Z-Index Scale (Preventing Modal / Drawer Conflicts)
```css
/* src/styles/tokens.css */
:root {
  --z-timeline-canvas: 10;
  --z-sticky-header: 20;
  --z-drawer-backdrop: 40;
  --z-drawer-panel: 50;
  --z-popover-dropdown: 60;
  --z-toast-notification: 70;
}
```

---

## 6. GitHub Actions CI/CD Pipeline (`.github/workflows/ci.yml`)

Every Pull Request must pass 5 automated parallel checks before merging:

```yaml
name: Production CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-style:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit

  playwright-e2e:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1/2, 2/2]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test --shard=${{ matrix.shard }}
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-traces-${{ strategy.job-index }}
          path: test-results/
          retention-days: 7

  build-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

---

## 7. Step-by-Step Implementation Roadmap

1. **Step 1: Developer Tooling & Git Hygiene**
   - Install `husky`, `lint-staged`, and `@commitlint`.
   - Setup `vitest` configuration and test script.
2. **Step 2: Theme Engine & Layout Tokens**
   - Configure Tailwind v4 `@theme` in `src/app/globals.css`.
   - Define near-black `#0F172A` text, `#F8FAFC` canvas, and Safety Orange `#F97316` variables.
3. **Step 3: Supabase Local Docker & Migrations**
   - Initialize Supabase CLI migrations from `docs/pumpdesk-database.dbml`.
   - Populate `supabase/seed.sql` with Midcoast Pumping rigs and sample customers.
   - Run type generation: `npm run db:types`.
4. **Step 4: Schedule Timeline & Quick Order Drawer (Core V1 Engine)**
   - Implement `features/schedule/` using `nuqs` for URL synchronization.
   - Implement 15-second Quick Booking drawer with `next-safe-action`.
5. **Step 5: Orders, Customers, and Fleet Directories**
   - Implement directories with clean tables, pagination, and dedicated 2-column dossiers.
6. **Step 6: Playwright Test Automation & CI Verification**
   - Create E2E test covering the booking flow.
   - Verify green checkmark on GitHub Actions pipeline.
