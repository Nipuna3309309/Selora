# Selora

A small clothing-shop **test app**: Power Apps Code App (React + TypeScript + Vite), SharePoint lists,
one Power Automate flow. One shop, LKR, Asia/Colombo business dates, English only.
**Payments are simulated. Nothing real is ever charged.**

Scope: one clothing item per order (quantity 1-10). No cart, delivery, suppliers, expenses, returns or
cancellations.

## Screens
Shop (search, category filter, quantity, Buy, labelled test checkout) · My Orders (own orders, auto-refreshing
until a final result) · Notifications (unread dot, mark as read) · Admin (clothes, buying costs, all orders,
sales: revenue, units, **gross profit** = revenue minus cost snapshots; not net profit).

## Run locally (demo mode, default)
```
npm install
npm run dev      # http://localhost:3000 (matches power.config.json localAppUrl)
npm test         # flow/permission/reliability tests against the demo adapter
npm run lint
npm run build    # outputs ./dist (matches power.config.json buildPath)
```
Demo mode shows a yellow **DEMO MODE** bar with a test-user switcher (two customers, one admin) and a reset
button. Data lives in the browser's localStorage. `src/demo/flowSimulator.ts` simulates the Power Automate
flow, including its stages, serialisation and `NeedsReview` behaviour, with a 1.5 s delay so pending states are visible.

## Connected mode
Set `VITE_DATA_MODE=live` (see `.env.example`). Then:
1. The user comes from the Power Apps SDK (`getContext()`); the role is read from `Users` (missing = Customer).
2. All SharePoint access goes through `src/live/gateway.ts`. It is deliberately **not implemented**: it must be
   built on the generated Code Apps SharePoint services, which can only be produced once the data sources are added
   (`pac code add-data-source`, see `docs/connected-setup.md`). Until then live mode shows a "can't connect" screen.
   It never falls back to demo data, and the demo role switcher does not exist in live mode.

## Docs
- `docs/sharepoint-setup.md` lists, columns, permissions
- `docs/power-automate-flow.md` build the single flow step by step
- `docs/recovery.md` manual recovery for `NeedsReview`
- `docs/connected-setup.md` connect, test and deploy

## Security model
Access is enforced by SharePoint permissions and the flow, never by React screens (those are convenience only).
The flow ignores client-supplied price/total/status, takes identity from SharePoint *Created By*, re-reads price
and stock, and serialises runs (concurrency 1). Unique keys (`RequestId`, `SALE-<OrderID>`, notification keys)
prevent duplicate orders, snapshots and notifications.

## What has and has not been verified
Verified locally: `tsc`, ESLint, production build, 15 automated tests (success, failed payment, insufficient stock,
duplicate submit, last-item race, tampered price, role restrictions, low/zero alert suppression and re-arming,
historical cost snapshots, interruption at each stage, email failure).

**Not verified:** Microsoft sign-in, SharePoint permissions, the Power Automate flow (not built yet), emails, the
generated-service gateway, desktop/mobile browser layout checks (the browser extension was unavailable), deployment.

## Pending live steps
See the checklist in `docs/connected-setup.md`.
