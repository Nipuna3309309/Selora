# Manual recovery for an order in NeedsReview

Updates across SharePoint lists are not atomic, so an interrupted run can leave Clothes, ClothingCosts and Orders disagreeing.
The flow does not guess. It sets the order `Status = NeedsReview`, and **all new orders are rejected until every
`NeedsReview` / `Processing` order is resolved.** Never replay the flow on that order.

Treat any order stuck in `Processing` for more than a few minutes the same way (the run may have died before it could mark NeedsReview).

## Procedure (admin)
1. Open the order in `Orders`. Note `ID`, `Quantity`, `StockBefore`, `StockAfter`, `ProcessingStage`.
2. Check the run history of *Selora – Process Order* to see what failed.
3. In `Clothes`, read the item's current `StockQuantity`:
   - equals `StockBefore`: stock was **not** deducted.
   - equals `StockAfter`: stock **was** deducted.
   - anything else: someone changed stock meanwhile. Work out the correct figure by hand first.
4. In `ClothingCosts`, look for `RecordKey = SALE-<OrderID>`. Present means the cost record exists.
   (`ProcessingStage = StockUpdated` may or may not have it.)
5. Choose one outcome:
   - **Complete the sale**: make sure stock = `StockAfter`; if the `SALE-<OrderID>` row is missing, create it (`RecordType = SaleCost`,
     `Clothing`, `OrderItemId`, `Quantity`, and `UnitCost` from the item's `CURRENT-<ClothesID>` row); then set the order to
     `Status = Confirmed`, `ProcessingStage = Completed` and a clear `ResultMessage`.
   - **Cancel the sale**: if stock was deducted, set `StockQuantity` back to `StockBefore`; delete the `SALE-<OrderID>` row if it exists;
     set `Status = Rejected` and a clear `ResultMessage`.
6. Check the app's Sales tab: revenue, units and cost of goods sold must match the confirmed orders.
7. Make sure no other order is still `Processing` / `NeedsReview`. Processing resumes with the next new order.

## Rules
- Do not edit stock by hand while orders are Pending/Processing. The Admin screen locks the stock field then, but SharePoint cannot stop
  edits made directly in the list.
- Do not edit or delete `SALE-` rows except as part of the steps above. They are the profit history.
- Email failures need no recovery: the order is already confirmed. `EmailStatus = Failed` on the notification marks them; resend by hand if needed.
