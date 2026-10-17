# Manual recovery for an order in NeedsReview

Updates across SharePoint lists are not atomic, so an interrupted run can leave Clothes, ClothingCosts
and Orders disagreeing. The flow does not guess. It marks the order `NeedsReview` and **all new orders
are rejected until every NeedsReview/Processing order is resolved.** Never replay the flow on that order.

Also treat any order stuck in `Processing` for more than a few minutes the same way (the run may have
crashed before it could mark NeedsReview).

## Procedure (admin)
1. Open the order in `Orders`. Note `ID`, `Quantity`, `StockBefore`, `StockAfter`, `ProcessingStage`.
2. Check the run history of *Selora – Process Order* for that order to see what failed.
3. Open the clothing item in `Clothes` and read the current `Stock`.
   - `Stock = StockBefore`: stock was **not** deducted.
   - `Stock = StockAfter`: stock **was** deducted.
   - Anything else: someone edited stock meanwhile. Work out the correct figure by hand first.
4. In `ClothingCosts`, look for `SALE-<OrderID>`. Present = snapshot exists.
5. Choose one outcome:
   - **Complete the sale** (the customer should have it): make sure Stock = StockAfter; make sure
     `SALE-<OrderID>` exists (create it with the clothing's current cost record `UnitCost`, the order's
     quantity, `CostType` = SaleSnapshot if missing); then set the order to `OrderStatus` = Confirmed,
     `ProcessingStage` = Confirmed, `ProcessingStatus` = Completed, and a clear `ResultMessage`.
   - **Cancel the sale**: set Stock back to StockBefore if it was deducted; delete `SALE-<OrderID>`
     if it exists; set the order to `OrderStatus` = Rejected, `ProcessingStatus` = Failed, and a clear
     `ResultMessage`.
6. Check the `Sales` tab in the app: revenue, units and cost of goods sold must match the confirmed orders.
7. Make sure no other order is still `Processing`/`NeedsReview`. Processing resumes automatically
   for the next new order.

## Rules
- Do not edit stock manually while orders are Pending/Processing. The Admin screen locks the stock field
  in that situation; SharePoint itself cannot stop edits made directly in the list.
- Do not edit or delete `SALE-` rows except as part of the steps above. They are the profit history.
- Email failures need no recovery: the order is already confirmed. Resend by hand if needed.
