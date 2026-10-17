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

## Run
All data comes from the SharePoint lists on `NipunaAutomateTesting`, through the Nipun demo solution's SharePoint
connection reference. There is no demo mode or sample data.
```
npm install
npm run dev      # prints a "Local Play" URL; open it to run the app inside the Power Apps host
npm run lint
npm run build    # outputs ./dist (matches power.config.json buildPath)
```
The app must run inside the Power Apps host (Local Play URL or the published app): outside it there is no
signed-in user and it shows "Selora can't connect".

1. The user comes from the Power Apps SDK (`getContext()`); the role is read from `Users` (missing = Customer).
2. All SharePoint access goes through `src/live/gateway.ts`, built on the generated services in `src/generated`.
   Failures are shown on screen, never hidden.
3. Orders stay **Pending** until the Power Automate flow (`docs/power-automate-flow.md`) processes them.

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
Verified locally: `tsc`, ESLint, production build.

**Not verified:** Microsoft sign-in, reading/writing the SharePoint lists, SharePoint permissions, the Power Automate
flow (not built yet), emails, desktop/mobile layout, deployment.

## Pending live steps
See the checklist in `docs/connected-setup.md`.
