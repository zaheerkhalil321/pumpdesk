# PumpDesk Operator (mobile)

Phone app for pump operators: see assigned jobs, tap through the day's steps (shop → site → back),
fill in the work ticket and take the customer's signature. Built with Expo (React Native) and
Expo Router.

It lives in this repo next to the web app but is its own project: its own `package.json`,
`node_modules`, lint, type check and tests. The web app's lint, type check, tests and build skip
this folder.

## Run

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go.

## Data

`EXPO_PUBLIC_API_MODE=mock` (default) uses on-phone demo data. `supabase` is not wired yet
(see `src/api/supabase-api.ts` and `docs/HANDOFF.md`).

## Checks

```bash
npm run lint
npm run typecheck
npm test
```

