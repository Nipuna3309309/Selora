# The Power Automate flow (build it by hand)

One flow: **Selora – Process Order**. It is the only thing that changes stock, prices, totals, statuses and
cost records. Until it is turned on, orders placed in the app stay **Pending**.
**Status:** built in the Nipun demo solution and turned on. Since 2026-10-18 the app calls it (Power Apps trigger) right after
it saves each order, so orders are confirmed in seconds instead of on the next one-minute poll. A multi-item cart checkout is stored as one
Orders row per item (`RequestId` = `CHK-<id>:1`, `:2`, ...); the flow processes each row on its own, so one sold-out item
is Rejected while the others are Confirmed.

Create the flow **inside the Nipun demo solution** (`Nipundemo`) and use only its connection references:
SharePoint = `sriq_sharedsharepointonline_0e890`. The connection behind it is owned by an account in `Selora Admins`.
Office 365 Outlook = a new connection reference you add to Nipun demo (see "Email configuration").
Below, `T` means the order row read fresh in `Get_order` (`body('Get_order')`), and "Cloth" the clothing row re-read in step 5.

## 1. Trigger
**Power Apps – When Power Apps calls a flow (V2)** with one Number input, `OrderId` (key `number`).
Trigger settings (…) > **Concurrency control = On, Degree of parallelism = 1.** This serialises runs so two buyers cannot both pass
the stock check. (It cannot be turned off again once enabled.)
First action: SharePoint *Get item*, list `Orders`, ID `triggerBody()?['number']` -> `Get_order`. Every later step reads the order
from `Get_order`, never from the app, so calling the flow with an ID can't change prices, stock or who placed the order.

How the app calls it (`src/live/LiveShopService.ts`): after creating each Orders row it runs the flow with that row's ID.
If the call fails (app closed, network, flow queue full), the order stays Pending; every open copy of the app checks every
20 seconds and starts the flow again for orders still Pending/New after 20 seconds (customers for their own, admins for all).
The idempotency guard below makes a second call for the same order do nothing.

**Users need a Dataverse role to run the flow from the app**: give customers and admins the **App Opener** security role
(or Basic User) in the Development environment. Without it a customer's call fails, and the order waits until an admin
has the app open.

The flow is added to the app with `npx pa app add flow --flow-id e3d9b084-33f0-43ec-a166-a55717d0bfd8` (writes
`.power/schemas/logicflows/`, `src/generated/*/Selora_ProcessOrder*` and the `power.config.json` entry). Run it again after
changing the trigger's inputs.

## 2. Idempotency guard
Condition: `T Status Value` equals `Pending` **and** `T ProcessingStage Value` equals `New`. If not, *Terminate* (Succeeded).
Because `T` is read fresh inside the one-at-a-time run, a second call for an order that is already processed stops here.

## 3. Identity and admins
- *Compose* `CustomerEmail` = `toLower(triggerOutputs()?['body/Author/Email'])`. Always use Created By; never a request field.
- *Get items* `Users`, filter `Role eq 'Admin'` -> `GetAdmins`. Admin emails are `UserAccount/Email` of each row.

## 4. Blocked-processing guard
*Get items* `Orders`, filter
`(Status eq 'Processing' or Status eq 'NeedsReview') and ID ne @{triggerOutputs()?['body/ID']}`, Top 1 -> `OpenReviews`.
If `length(body('OpenReviews')?['value'])` > 0, run **Reject** with
`Order processing is paused while an earlier order is being reviewed. Please try again later.`

## 5. Re-read everything (ignore the request)
- Clothing ID: `triggerOutputs()?['body/Clothing/Id']`.
- *Get items* `Clothes`, filter `ID eq <Clothing ID>`, Top 1 -> `GetCloth`; *Compose* `Cloth` = `first(body('GetCloth')?['value'])`.
- *Get items* `ClothingCosts`, filter `RecordKey eq 'CURRENT-<Clothing ID>'`, Top 1 -> `GetCost`; *Compose* `Cost` = `first(...)`.

## 6. Validation (any failure -> Reject, no stock change)
| Check | True means OK | Message |
|---|---|---|
| Quantity | `and(greaterOrEquals(triggerOutputs()?['body/Quantity'],1), lessOrEquals(triggerOutputs()?['body/Quantity'],10))` | Quantity must be a whole number from 1 to 10. |
| Payment | `or(equals(triggerOutputs()?['body/SimulatedPayment/Value'],'Success'),equals(triggerOutputs()?['body/SimulatedPayment/Value'],'Cash on delivery'))` | Payment was not successful. No stock was deducted. |

The `Cash on delivery` value must exist as a choice on `Orders.SimulatedPayment` (Success = Pay now).
| Item exists and active | `and(not(empty(body('GetCloth')?['value'])), equals(outputs('Cloth')?['IsActive'],true))` | This item is not available. |
| Current cost exists | `not(empty(body('GetCost')?['value']))` | This item is temporarily unavailable. |
| Stock | `greaterOrEquals(outputs('Cloth')?['StockQuantity'], triggerOutputs()?['body/Quantity'])` | `concat('Insufficient stock. Only ', string(outputs('Cloth')?['StockQuantity']), ' available.')` |

Nest the Cloth/Cost checks inside the "row exists" checks so `first()` of an empty array never errors.

### Reject (Scope `Reject`)
1. *Update item* Orders (ID `T ID`): `Status` = Rejected, `ResultMessage` = the message. (Stage stays New.)
2. *Create item* Notifications: Title and `NotificationKey` = `ORDER-@{T ID}-REJECTED`, `Recipient` = customer, `NotificationType` = OrderRejected,
   `OrderItemId` = `T ID`, `Message`. Then step 12.
3. *Terminate* (Succeeded): a rejection is a normal result.

## 7. Prepared (authoritative values, one write)
`StockBefore` = `outputs('Cloth')?['StockQuantity']`; `StockAfter` = `sub(StockBefore, T Quantity)`.
*Update item* Orders: `UnitPrice` = Cloth `SellingPrice`, `TotalAmount` = `mul(outputs('Cloth')?['SellingPrice'], T Quantity)`,
`StockBefore`, `StockAfter`, `Status` = Processing, `ProcessingStage` = Prepared.

## 8. Scope `Process` (everything that can fail)
1. **Stock**: *Update item* Clothes (`Cloth ID`): `StockQuantity` = **`StockAfter`** (the recorded value, never recomputed `Stock - Quantity`).
   Then *Update item* Orders: `ProcessingStage` = StockUpdated.
2. **Cost record**: *Create item* ClothingCosts: Title and `RecordKey` = `SALE-@{T ID}`, `RecordType` = SaleCost, `Clothing` = Cloth ID,
   `OrderItemId` = `T ID`, `UnitCost` = Cost `UnitCost`, `Quantity` = `T Quantity`. The unique `RecordKey` blocks duplicates.
3. **Confirm**: *Update item* Orders: `Status` = Confirmed, `ProcessingStage` = Completed, `ResultMessage` = `Order confirmed. Thank you!`

The stage list has no step between StockUpdated and Completed, so an interruption after the cost record but before Confirm
shows as `StockUpdated`. Recovery checks whether `SALE-<OrderID>` exists (`recovery.md`).
Set the retry policy of the Clothes update and the cost create to **None**.

## 9. Failure handling: Scope `NeedsReview`
Run after `Process` **has failed / has timed out** only:
- *Update item* Orders: `Status` = NeedsReview, `ResultMessage` = `Processing was interrupted and needs admin review. Payment is simulated; nothing was charged.`
- For each admin: create a `NeedsReview` notification (key `REVIEW-@{T ID}-@{admin email}`) and send an email.
- *Terminate* (Failed) so the run is visible in run history.
Do not retry or repair inside the flow: cross-list updates are not atomic. See `recovery.md`.

## 10. Scope `Notify` (run after `Process` **is successful** only; cannot change the order)
1. *Create item* Notifications: key `ORDER-@{T ID}-CONFIRMED`, `Recipient` = customer, OrderConfirmed, `OrderItemId` = `T ID`,
   `Message` `concat('Order ', T ID, ' confirmed: ', T Quantity, ' x ', Cloth Title)`, `EmailStatus` = Pending. Then step 12.
2. *Send an email (V2)* to `CustomerEmail`, subject `Selora order @{T ID} confirmed`. Retry policy Fixed, 2 retries.
3. *Update item* that notification: `EmailStatus` = Sent. A parallel branch with run-after **has failed** sets `EmailStatus` = Failed.
   An email failure therefore never touches the order, which is already Confirmed.

## 11. Stock alerts (stateless, inside `Notify`)
No alert-state column is needed. An alert fires only when this sale **crosses** a boundary:
- Zero: `StockBefore > 0` and `StockAfter = 0` -> `OutOfStock`.
- Low: `StockBefore > LowStockLevel` and `StockAfter > 0` and `StockAfter <= LowStockLevel` -> `LowStock`.
A sale from above the threshold straight to 0 sends only the zero alert. Later sales while stock stays low cross nothing, so no repeats; stock must
rise back above the threshold (admin restock) before it can alert again.
Expression: `if(and(greater(StockBefore,0),lessOrEquals(StockAfter,0)),'Zero',if(and(greater(StockBefore,LowStockLevel),greater(StockAfter,0),lessOrEquals(StockAfter,LowStockLevel)),'Low','None'))`.
For each admin create the notification (key `STOCK-@{Cloth ID}-@{crossing}-@{T ID}-@{admin email}`) and email, setting `EmailStatus` as in step 10.

## 12. Per-recipient access to a notification (customer notifications only)
1. *Send an HTTP request to SharePoint* `POST _api/web/ensureuser` body `{"logonName":"i:0#.f|membership|@{CustomerEmail}"}` -> note `Id`
   (or set `Recipient` from the claims value directly when creating the item).
2. `POST _api/web/lists/getbytitle('Notifications')/items(@{ID})/breakroleinheritance(copyRoleAssignments=false, clearSubscopes=true)`
3. `POST _api/web/lists/getbytitle('Notifications')/items(@{ID})/roleassignments/addroleassignment(principalid=@{userId}, roledefid=@{markReadRoleId})`
   (look up the `Selora Mark Read` definition at `_api/web/roledefinitions`).
4. Re-add `Selora Admins` the same way, because breaking inheritance removes them.

## Email configuration
Before building the flow, add the Outlook connection reference **inside Nipun demo** (not in the Default solution):
1. make.powerapps.com > Development environment > Solutions > **Nipun demo** > New > More > Connection reference.
2. Display name `Selora Outlook`, connector **Office 365 Outlook**, connection owned by an account in `Selora Admins`. Save.
3. Note its logical name (`sriq_...`) and record it in the "Connections" line at the top of this file.

In the flow, every "Send an email (V2)" action uses that connection reference, sent as the connection owner (or a shared
mailbox if available). Emails contain only order numbers and item names.

## Restock Request flow
Flow **Selora – Restock Request** (ID `780f33aa-a6ca-f111-a05c-002248ee059c`) in the Nipun demo solution. Connection
references: SharePoint `sriq_sharedsharepointonline_0e890`, Office 365 Outlook `sriq_sharedoffice365_54600`.

- **Start:** admins press **Request restock** (Clothes table, for low or sold-out items, and on the dashboard's restock
  decisions). The app adds a Notifications row: `NotificationType = RestockRequest`, `OrderItemId` = the clothing ID,
  `Message` = optional note (the dashboard adds the suggested quantity), `EmailStatus = Pending`,
  `NotificationKey = RESTOCK-<clothingId>-<timestamp>`.
- **Trigger:** since 2026-10-18, **When Power Apps calls a flow (V2)** with one Number input, `NotificationId`. The app calls
  it right after it creates the row; `Get_request` reads the row, and `Is_pending_request` stops unless it is a
  `RestockRequest` whose `EmailStatus` is still `Pending`, so the email goes out once. Admin copies of the app start it again
  for rows still Pending after 30 seconds. Added to the app with
  `npx pa app add flow --flow-id 3167206b-f50e-2b3f-d1c5-27f409cebbdd`.
- **Flow:** acts only on that one row. It reads the Users list for rows
  with `Role = Supplier` and emails all of them (not the admins) with the item, SKU, size, colour, stock, low-stock
  level, note and who asked. It then sets `EmailStatus` to `Sent`, or `Failed` if the email fails, the item is not
  found, or no Supplier is set up.
- **App:** shows "Sent to suppliers", then "Asked suppliers <time>, email sent" for 24 hours, with **Ask again**.
  Open requests from the last 30 days also appear under **Deliveries due** on the Clothes page. **Received** adds the
  stock at the current cost, with the price from the profit rule, logs the purchase and sets `IsRead = true` on every open
  request for that item. **Not coming** only sets `IsRead`. The flow only runs when the app calls it for a Pending row,
  so these updates never send another email.
- **Before use:** add the `RestockRequest` choice to `Notifications.NotificationType`, add the `Supplier` choice to
  `Users.Role` and a Users row for each supplier, then turn the flow on.

## Supplier flows
Two flows in the Nipun demo solution give suppliers their area in the app without any list permissions. Both use
**When Power Apps calls a flow (V2)** and the SharePoint connection reference `sriq_sharedsharepointonline_0e890`, and identify
the caller from the `x-ms-user-email` header Power Apps adds (or its base64 `-encoded` form). Only a Users row with
`Role = Supplier` for that email gets an answer; anyone else gets `ok = false`. Both answer with **Respond to a PowerApp or flow**.

### Selora – Supplier Requests (flow ID for the app `fe1e9bed-aa6b-7ccf-2d63-312e69323300`)
No inputs. Returns text fields `ok`, `error`, and JSON arrays `requests` (open RestockRequest rows from the last 30 days: id,
clothingId, note, createdAt), `offers` (the caller's SupplierOffer rows) and `accepted` (all `BUY-OFFER-` keys). The app also
calls it once at start for anyone who isn't an Admin: a yes switches the app to the supplier area.

### Selora – Supplier Offer (flow ID for the app `703a8fd0-be89-4086-090f-55ec3ba2dfbd`)
Inputs `RequestId`, `Quantity`, `UnitCost` (numbers, required), `ArriveBy` (YYYY-MM-DD or empty) and `Note` (up to 100 characters).
Checks the caller is a Supplier, the request is an open RestockRequest, quantity 1–100,000 and price 0–1,000,000, then creates or
updates the `OFFER-<RequestId>-S<SupplierUsersID>` row in ClothingCosts. Returns `ok` and `error`.

Both were created through the Dataverse Web API into the solution and added to the app with `npx pa app add flow --flow-id <id>`.
**Before suppliers can use them:** add the `SupplierOffer` choice to ClothingCosts.RecordType, give suppliers Read on Clothes and
Clothing Photos, share the app with them and give them the App Opener role.


## Selora – Account (flow ID for the app `348505c0-36aa-7f7b-5142-310cf3ea1a65`)
Power Apps (V2) trigger, inputs `text` = mode (`check` or `signup`) and `text_1` = name. SharePoint connection reference only.
1. `Caller`: the signed-in person's email from the trigger headers.
2. `Get_user`: Users where `UserAccount/EMail eq <caller>`, top 1.
3. Row found: answer `{ ok: true, registered: true, role: <Role> }`.
4. No row and mode is `signup`: create `{ Title: <name, max 100 chars; the email if blank>, UserAccount: <caller>, Role: Customer }`
   and answer `{ ok: true, registered: true, role: Customer }`; if the create fails, `{ ok: false, error }`.
5. No row and mode is `check`: answer `{ ok: true, registered: false }`.
The app calls `check` on load (this also tells suppliers apart) and shows the sign up page when `registered` is false.
