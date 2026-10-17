# The Power Automate flow (build it by hand)

One flow: **Selora – Process Order**. It is the only thing that changes stock, prices, totals, statuses and
cost records. Until it is built and turned on, orders placed in the app stay **Pending**.
**The flow has not been built or run yet.**

Create the flow **inside the Nipun demo solution** (`Nipundemo`) and use only its connection references:
SharePoint = `sriq_sharedsharepointonline_0e890`. The connection behind it is owned by an account in `Selora Admins`.
Office 365 Outlook = a new connection reference you add to Nipun demo (see "Email configuration").
Below, `T` means the trigger's dynamic content and "Cloth" the clothing row re-read in step 5.

## 1. Trigger
**SharePoint – When an item is created** (site above, list `Orders`).
Trigger settings (…) > **Concurrency control = On, Degree of parallelism = 1.** This serialises runs so two buyers cannot both pass
the stock check. (It cannot be turned off again once enabled.)

## 2. Idempotency guard
Condition: `T Status Value` equals `Pending` **and** `T ProcessingStage Value` equals `New`. If not, *Terminate* (Succeeded).

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
| Payment | `equals(triggerOutputs()?['body/SimulatedPayment/Value'],'Success')` | Simulated payment failed. No stock was deducted. |
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
