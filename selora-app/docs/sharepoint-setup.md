# SharePoint setup

Site: `https://netorgft6455485.sharepoint.com/sites/NipunaAutomateTesting`

The five lists were created by the project owner with the columns below (ID, Title, Created and Created By
are built in). The app reads them through `src/live/columns.ts`. **Not yet verified from the app side**: the
internal names must be confirmed against the generated Code Apps models. The `Notifications` columns after
`OrderItemId` were created without errors but their settings were not read back.

## Lists and columns

### Users
`UserAccount` (Person, one only) · `Role` (Choice: Customer, Admin; default Customer).
A user with no row is a Customer; the app and flow handle that, SharePoint cannot.

### Clothes
`Title` (name) · `SKU` (text, required, **unique**) · `Category` (Choice: T-Shirt, Shirt, Trousers, Dress, Shorts, Other) ·
`Size` (Choice: XS, S, M, L, XL, XXL, One Size) · `Colour` (text, required) · `PhotoUrl` (Hyperlink) ·
`SellingPrice` (Currency LKR, min 0) · `StockQuantity` (Number 0 dp, min 0) · `LowStockLevel` (Number 0 dp, default 5) ·
`IsActive` (Yes/No, default Yes).

### Clothing Photos (document library)
Created by the owner. Admins upload photos from the Clothes form; the app resizes each to a JPEG (max 1600px),
stores it here as `<SKU>-<timestamp>.jpg` and saves its full address in `Clothes.PhotoUrl`. The app finds the library
by its display name `Clothing Photos` (`PHOTO_LIBRARY` in `src/live/columns.ts`). Replacing or removing a photo
only changes the link; old files stay in the library and can be deleted by hand.

### ClothingCosts (admin only)
`RecordType` (Choice: CurrentCost, SaleCost) · `Clothing` (Lookup Clothes > Title) · `OrderItemId` (Number 0 dp) ·
`UnitCost` (Currency LKR, min 0) · `Quantity` (Number 0 dp) · `RecordKey` (text, required, **unique**).
Keys: `CURRENT-<ClothesID>` (editable by admins) and `SALE-<OrderID>` (one per sale, written by the flow, never edited).

### Orders
`Clothing` (Lookup Clothes > Title) · `Quantity` (Number 0 dp, min 1) · `SimulatedPayment` (Choice: Success, Failed) ·
`Status` (Choice: Pending, Processing, Confirmed, Rejected, NeedsReview; default Pending) · `UnitPrice`, `TotalAmount` (Currency) ·
`StockBefore`, `StockAfter` (Number 0 dp) · `ProcessingStage` (Choice: New, Prepared, StockUpdated, Completed; default New) ·
`ResultMessage` (plain multi-line) · `RequestId` (text, required, **unique**).

The customer (app) writes only: `Title`, `RequestId`, `Clothing`, `Quantity`, `SimulatedPayment`. The flow writes the rest.

### Notifications
`Recipient` (Person, one only) · `Message` (plain multi-line) · `NotificationType` (Choice: OrderConfirmed, OrderRejected,
LowStock, OutOfStock) · `OrderItemId` (Number 0 dp) · `IsRead` (Yes/No, default No) · `NotificationKey` (text, required, **unique**) ·
`EmailStatus` (Choice: Pending, Sent, Failed).

## Small changes still needed on the lists
1. **Notifications > NotificationType: add the choice `NeedsReview`.** The flow notifies admins when an order needs review.
2. **Title is required by default** on every list. Customers cannot fill it in through the app unprompted, so the app sets
   `Title = RequestId` on orders. Either keep that, or make Title optional on Orders. The flow should set Title on
   ClothingCosts (`= RecordKey`) and Notifications (`= NotificationKey`).
3. Confirm **Enforce unique values** is on for `SKU`, `RecordKey`, `RequestId`, `NotificationKey` (reported as done).

## Permissions (must be applied in SharePoint, outside the app)
The app's role checks are cosmetic. These settings enforce access. **Status: not applied yet** (the owner is waiting
for confirmation to change Users and ClothingCosts).

1. **Never add customers to the site Members group.**
2. Create SharePoint groups `Selora Admins` and `Selora Customers`. The flow connection owner belongs to Admins.
3. Custom permission levels: **Selora Add Own** (copy Read, add only *Add Items*) and **Selora Mark Read** (copy Read, add only *Edit Items*).
4. On each list: Stop inheriting permissions, remove inherited groups, then grant:

| List | Selora Admins | Selora Customers |
|---|---|---|
| Users | Full Control | **none** (recommended; read-only would expose other people's emails and roles) |
| Clothes | Edit | Read |
| Clothing Photos (library) | Edit | Read (needed to see photos) |
| ClothingCosts | Full Control | **none** |
| Orders | Full Control | Selora Add Own |
| Notifications | Full Control | none at list level (see below) |

5. **Orders** > Advanced settings > Item-level permissions: *Read access* = **Read items that were created by the user**;
   *Create and Edit access* = the most restrictive option offered. *Selora Add Own* has no Edit/Delete rights, so a submitted
   order cannot be changed or deleted by its customer.
6. **Notifications**: the flow breaks inheritance on each new item and grants the `Recipient` the *Selora Mark Read* level on that
   item only (flow step 12). *Known limit:* a recipient can edit fields of their own notification via the API.
7. A customer's failed read of Users means Customer, which is intended.

## Checks to run once permissions are applied (none run yet)
- Customer: reads Clothes; cannot create/edit a Clothes item; cannot open ClothingCosts or Users.
- Customer creates an order; sees only their own; cannot edit or delete it (list UI and `_api`).
- A second customer cannot see the first customer's orders or notifications; can mark only their own notifications read.
- Duplicate `RequestId`, `RecordKey`, `NotificationKey` or `SKU` is rejected.
