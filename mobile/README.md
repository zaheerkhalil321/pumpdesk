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

`EXPO_PUBLIC_API_MODE=mock` (default) uses on-phone demo data. `supabase` uses the real backend.

### Run against local Supabase

1. In the web repo (branch `feature/operator-backend`): `supabase start`, then `supabase status` for the API URL and anon key.
2. Copy `.env.example` to `.env.local` and set:
   - `EXPO_PUBLIC_API_MODE=supabase`
   - `EXPO_PUBLIC_SUPABASE_URL=http://<this computer's Wi-Fi IP>:54321` (`ipconfig getifaddr en0`; not 127.0.0.1, the phone could not reach it)
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>`
3. `npx expo start --clear` (env values are read at start), phone on the same Wi-Fi, scan the QR code.
4. Sign in as Rob Black: `(207) 555-0168`, code `123456` (local test code, no SMS). Run `supabase db reset` in the
   web repo to get fresh demo jobs.

Live check against the local database (changes data): `LIVE_SUPABASE=1 LIVE_SUPABASE_URL=http://127.0.0.1:54321
LIVE_SUPABASE_ANON_KEY=<key> npm run test:live`. Needs `psql` on the path.

## Checks

```bash
npm run lint
npm run typecheck
npm test
```

