# The Power Automate flow (build it by hand)

One flow: **Selora – Process Order**. It is the only thing that changes stock, prices, totals,
statuses and cost snapshots. The local demo (`src/demo/flowSimulator.ts`) implements exactly these
steps, and `src/demo/flow.test.ts` tests them. **The real flow has not been built or run yet.**

Connections: *SharePoint* and *Office 365 Outlook*, both owned by an account in `Selora Admins`.

## 1. Trigger
**SharePoint – When an item is created** (site above, list `Orders`).

Settings (…) > **Concurrency control: On, Degree of parallelism = 1.** This serializes runs so two
buyers cannot both pass the stock check. (It cannot be turned off again once enabled.)

Name the trigger step `Trigger`; below, `T` means its dynamic content.

## 2. Idempotency guard
*Condition* `T ProcessingStatus Value` **is equal to** `Pending`. If **No**, *Terminate* (Succeeded).
This stops a replayed trigger from processing an order twice.

## 3. Variables / lookups
- *Get items* `Users`, filter `Role eq 'Admin'` -> `GetAdmins`.
- *Select* from `GetAdmins` value, map `item()?['Title']` -> `AdminEmails`.
  Admin list as text: `join(body('AdminEmails'), ';')`.
- *Compose* `CustomerEmail` = `toLower(triggerOutputs()?['body/Author/Email'])`.
  **Never** use a customer-supplied value for identity.

## 4. Blocked-processing guard
*Get items* `Orders`, filter
`(ProcessingStatus eq 'Processing' or ProcessingStatus eq 'NeedsReview') and ID ne @{triggerOutputs()?['body/ID']}`,
Top Count 1 -> `OpenReviews`.
*Condition* `length(body('OpenReviews')?['value'])` is greater than `0` -> run **Reject** with message
`Order processing is paused while an earlier order is being reviewed. Please try again later.`

## 5. Re-read everything (ignore the request)
- *Get items* `Clothes`, filter `ID eq @{triggerOutputs()?['body/ClothingId']}`, Top 1 -> `GetCloth`.
- *Get items* `ClothingCosts`, filter `Title eq 'CURRENT-@{triggerOutputs()?['body/ClothingId']}'`, Top 1 -> `GetCost`.
- *Compose* `Cloth` = `first(body('GetCloth')?['value'])`, `Cost` = `first(body('GetCost')?['value'])`.

## 6. Validation (any failure -> Reject, no stock change)
Use a chain of Conditions, or one Condition per row, each leading to **Reject** with its message:

| Check | Expression (true = OK) | Message |
|---|---|---|
| Quantity | `and(greaterOrEquals(triggerOutputs()?['body/Quantity'],1), lessOrEquals(triggerOutputs()?['body/Quantity'],10))` | Quantity must be a whole number from 1 to 10. |
| Payment | `equals(triggerOutputs()?['body/SimulatedPayment/Value'],'Success')` | Simulated payment failed. No stock was deducted. |
| Item exists and active | `and(not(empty(body('GetCloth')?['value'])), equals(outputs('Cloth')?['IsActive'],true))` | This item is not available. |
| Current cost exists | `not(empty(body('GetCost')?['value']))` | This item is temporarily unavailable. |
| Stock | `greaterOrEquals(outputs('Cloth')?['Stock'], triggerOutputs()?['body/Quantity'])` | `concat('Insufficient stock. Only ', string(outputs('Cloth')?['Stock']), ' available.')` |

Evaluate the Cloth/Cost checks only after confirming the lookup returned a row (nest them) so
`first()` of an empty array does not error.

### Reject (reusable pattern, run it in a Scope named `Reject`)
1. *Update item* `Orders` ID `T ID`: `OrderStatus`=Rejected, `ProcessingStatus`=Failed, `ResultMessage`=message.
2. *Create item* `Notifications`: Title `ORDER-@{T ID}-REJECTED`, RecipientEmail `CustomerEmail`, type OrderRejected, Message.
3. Step 14 below (grant the customer access to that item).
4. *Terminate* (Succeeded): the rejection is a normal result.

## 7. Prepared (authoritative values, one write)
*Compose* `StockBefore` = `outputs('Cloth')?['Stock']`; `StockAfter` = `sub(outputs('Cloth')?['Stock'], T Quantity)`.
*Update item* `Orders` ID `T ID`:
`ClothingName`=`Cloth Title`, `UnitPrice`=`Cloth Price`, `Total`=`mul(outputs('Cloth')?['Price'], T Quantity)`,
`StockBefore`, `StockAfter`, `ProcessingStatus`=Processing, `ProcessingStage`=Prepared.

## 8. Everything that can fail goes in Scope `Process`
Inside the scope, in order:
1. **Stock**: *Update item* `Clothes` ID `Cloth ID`, `Stock` = **`StockAfter`** (the recorded value, never `Stock - Quantity`
   recomputed). Then *Update item* Orders: `ProcessingStage`=StockUpdated.
2. **Cost snapshot**: *Create item* `ClothingCosts`: Title `SALE-@{T ID}`, ClothingId, CostType=SaleSnapshot,
   UnitCost = `Cost UnitCost`, OrderId = `T ID`, Quantity = `T Quantity`.
   The unique Title blocks duplicates. Then *Update item* Orders: `ProcessingStage`=SnapshotCreated.
3. **Confirm**: *Update item* Orders: `OrderStatus`=Confirmed, `ProcessingStatus`=Completed,
   `ProcessingStage`=Confirmed, `ResultMessage`=`Order confirmed. Thank you!`

## 9. Failure handling: Scope `NeedsReview`
Add a Scope after `Process` with **Configure run after = has failed, has timed out** only:
- *Update item* Orders: `ProcessingStatus`=NeedsReview, `ResultMessage`=
  `Processing was interrupted and needs admin review. Payment is simulated; nothing was charged.`
- For each admin (*Apply to each* over `GetAdmins`): create a `NeedsReview` notification
  (Title `REVIEW-@{T ID}-@{admin email}`) and send an email.
- *Terminate* (Failed) so the run is visible in run history.

Do **not** retry or "fix up" inside the flow. Stock moves are not atomic across lists; see `recovery.md`.
Turn the retry policy of the Clothes update and the cost create to **None** so a blind retry cannot
double-apply. (The Clothes update is absolute, but keep the rule simple.)

## 10. After confirmation (Scope `Notify`, run after `Process` **is successful** only)
Every action here has its own failure handling; nothing in this scope can change the order.
1. *Create item* Notifications: Title `ORDER-@{T ID}-CONFIRMED`, RecipientEmail `CustomerEmail`, type OrderConfirmed,
   Message `concat('Order ', T ID, ' confirmed: ', T Quantity, ' x ', Cloth Title)`. Then step 14.
2. *Send an email (V2)* to `CustomerEmail`, subject `Selora order @{T ID} confirmed`, short HTML body.
   Settings: retry policy Fixed, 2 retries. Email failure only fails this action; the order stays Completed.

## 11. Stock alerts (inside Scope `Notify`)
*Compose* `NewState` =
`if(lessOrEquals(StockAfter,0),'Zero',if(lessOrEquals(StockAfter, Cloth LowStockThreshold),'Low','None'))`
*Compose* rank of old and new (`None`=0, `Low`=1, `Zero`=2), e.g.
`if(equals(x,'Zero'),2,if(equals(x,'Low'),1,0))`.
*Condition* `NewRank > OldRank` where Old = `Cloth StockAlertState Value`:
- Yes: for each admin create notification (Title `STOCK-@{Cloth ID}-@{NewState}-@{T ID}-@{admin}`, type LowStock or
  OutOfStock) + email, **then** *Update item* Clothes `StockAlertState` = `NewState`.
- No: do nothing. Repeated sales while stock stays low are silent.
The Admin screen resets `StockAlertState` to None when an admin restocks above the threshold.

## 12. Step 14: per-recipient access to a notification
After creating a notification item (customers only; admins already have access):
1. *Send an HTTP request to SharePoint* `POST _api/web/ensureuser` body `{"logonName":"i:0#.f|membership|@{CustomerEmail}"}` -> note `Id`.
2. `POST _api/web/lists/getbytitle('Notifications')/items(@{ID})/breakroleinheritance(copyRoleAssignments=false, clearSubscopes=true)`
3. `POST _api/web/lists/getbytitle('Notifications')/items(@{ID})/roleassignments/addroleassignment(principalid=@{userId}, roledefid=@{markReadRoleId})`
   (look up the `Selora Mark Read` role definition id once at `_api/web/roledefinitions`).
4. Re-add `Selora Admins` the same way (`breakroleinheritance(false, ...)` removes it).

## Email configuration
Office 365 Outlook connection, "Send an email (V2)". Sender is the connection owner (or use *Send from
shared mailbox* if you have one). Emails are plain notifications; there are no secrets in them.
