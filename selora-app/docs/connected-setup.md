# Connected setup, testing and deployment

Site: `https://netorgft6455485.sharepoint.com/sites/NipunaAutomateTesting`
Environment ID (from `power.config.json`): `d103abf7-e138-ed3d-8de2-57f89b56ff97`

## 0. Align the code with the lists
The code already uses the real list/column names (`src/live/columns.ts`). Before wiring the gateway, confirm each internal name against the generated
models, and add the `NeedsReview` choice to `Notifications.NotificationType` (see `sharepoint-setup.md`).
## 1. Permissions and flow
Apply `sharepoint-setup.md` (groups, permission levels, unique permissions), then build the flow from
`power-automate-flow.md` and turn it on.

## 2. Add data sources to the Code App
Use only the **Nipun demo** solution (`Nipundemo`, ID `53d6deb3-feaf-f111-aaad-70a8a5044583`) and its SharePoint
connection reference `sriq_sharedsharepointonline_0e890`. Never bind a personal connection ID (`-c`).
```
npm run build
pac auth create --environment d103abf7-e138-ed3d-8de2-57f89b56ff97
pac code add-data-source -a shared_sharepointonline -cr sriq_sharedsharepointonline_0e890 -s 53d6deb3-feaf-f111-aaad-70a8a5044583 -d "https://netorgft6455485.sharepoint.com/sites/NipunaAutomateTesting" -t Clothes
# repeat for Users, ClothingCosts, Orders, Notifications
```
The SharePoint file actions (photo upload and download) are added the same way, as actions (already done):
```
npx pa app add data-source --non-interactive --connector shared_sharepointonline --connection-ref sriq_sharedsharepointonline_0e890 --solution-id 53d6deb3-feaf-f111-aaad-70a8a5044583 --as action
```
This generates models/services under `src/generated` (already done for all five lists and the actions). Do not
hand-write or edit them. `src/live/gateway.ts` is built on top of them.

## 3. Test in the tenant (checklist, none done yet)
- Sign in as an admin and as two different customers (customers must **not** be site Members).
- Run every check in `sharepoint-setup.md`.
- Successful order, failed payment, insufficient stock, double-click, two customers buying the last item,
  confirmation email, low/zero stock alert once only, cost change leaves old profit unchanged,
  forced failure -> `NeedsReview` -> recovery procedure.
- Layout on desktop and a phone.

## 4. Deploy
Power Apps solution: **Nipun demo** (`Nipundemo`, ID `53d6deb3-feaf-f111-aaad-70a8a5044583`). The app and the
flow go in this solution only. A plain `pac code push` would put the app in the Default solution, so always pass
the solution (option confirmed in `pac code push --help`; the push itself has not been tried).

```
npm run build
pac code push --solutionName Nipundemo
```
Share the app with the customer group in the Power Apps admin portal and confirm each user has a Power Apps
licence/access and the SharePoint permissions above.
