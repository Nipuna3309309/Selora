# SharePoint setup

Site: `https://netorgft6455485.sharepoint.com/sites/NipunaAutomateTesting`

> **Status: not verified against the tenant.** The column names below are the ones the app code
> (`src/live/columns.ts`) currently expects. They were proposed by the app author because no column
> list was supplied. If the lists you created use different names, change `columns.ts`, not the lists.
> Use **internal** names: create each column with no spaces in its name, then rename the display name if
> you like (the internal name stays).

## Lists and columns

### Users (admin-managed roles)
| Column | Type | Notes |
|---|---|---|
| Title | Single line | The user's sign-in email, lower case. Index + **Enforce unique values** |
| DisplayName | Single line | |
| Role | Choice: Customer, Admin | Missing row = Customer |

### Clothes
| Column | Type | Notes |
|---|---|---|
| Title | Single line | Name |
| Category | Single line | |
| Description | Multiple lines (plain) | |
| ImageUrl | Single line | |
| Size, Colour | Single line | |
| Price | Number, 2 decimals | LKR |
| Stock | Number, 0 decimals, min 0 | |
| LowStockThreshold | Number, 0 decimals, min 0 | |
| IsActive | Yes/No, default Yes | |
| StockAlertState | Choice: None, Low, Zero (default None) | Written by the flow and by the Admin screen |

### ClothingCosts (admin only)
| Column | Type | Notes |
|---|---|---|
| Title | Single line | **Unique key**: `CURRENT-<ClothesID>` or `SALE-<OrderID>`. Index + enforce unique |
| ClothingId | Number, 0 decimals | Clothes item ID |
| CostType | Choice: Current, SaleSnapshot | |
| UnitCost | Number, 2 decimals | |
| OrderId | Number, 0 decimals | Empty for Current rows |
| Quantity | Number, 0 decimals | Empty for Current rows |

### Orders
| Column | Type | Written by |
|---|---|---|
| Title | Single line | Customer (app): the stable **RequestId**. Index + enforce unique |
| ClothingId | Number, 0 decimals | Customer |
| Quantity | Number, 0 decimals | Customer |
| SimulatedPayment | Choice: Success, Failure | Customer |
| ClothingName | Single line | Flow |
| UnitPrice, Total | Number, 2 decimals | Flow |
| StockBefore, StockAfter | Number, 0 decimals | Flow |
| OrderStatus | Choice: Submitted, Confirmed, Rejected (default Submitted) | Flow |
| ProcessingStatus | Choice: Pending, Processing, Completed, Failed, NeedsReview (default Pending) | Flow |
| ProcessingStage | Choice: Received, Prepared, StockUpdated, SnapshotCreated, Confirmed (default Received) | Flow |
| ResultMessage | Multiple lines (plain) | Flow |

Created By / Created (built in) are the customer identity and date. Defaults on the status columns
matter: the app only sends the four customer fields.

### Notifications
| Column | Type | Notes |
|---|---|---|
| Title | Single line | **Unique key**, e.g. `ORDER-<id>-CONFIRMED`, `STOCK-<clothesId>-Low-<orderId>-<adminEmail>`. Index + enforce unique |
| RecipientEmail | Single line | Lower case |
| NotificationType | Choice: OrderConfirmed, OrderRejected, LowStock, OutOfStock, NeedsReview | |
| Message | Multiple lines (plain) | |
| OrderId | Number, 0 decimals | |
| IsRead | Yes/No, default No | |

Enforce-unique requires the column to be **indexed first**, and must be set before data exists.

## Permissions (must be done in SharePoint, outside the app)

The app's role checks are only cosmetic. These settings are what enforce access.

1. **Do not add customers to the site Members group** (Members can edit everything).
2. Create two SharePoint groups: `Selora Admins` and `Selora Customers`. Put real admins in
   Admins. Customers get **no** site-level permission other than the group below.
   Add the *flow connection owner* (the account that owns the flow) to Admins.
3. Create two custom permission levels (Site settings > Site permissions > Permission levels):
   - **Selora Add Own**: copy *Read*, then add only **Add Items**. (No Edit/Delete.)
   - **Selora Mark Read**: copy *Read*, then add only **Edit Items**.
4. For each list, **Stop inheriting permissions**, remove inherited groups, then:

| List | Selora Admins | Selora Customers |
|---|---|---|
| Users | Full Control | *none* |
| Clothes | Edit (or Full Control) | Read |
| ClothingCosts | Full Control | *none* |
| Orders | Full Control | **Selora Add Own** |
| Notifications | Full Control | *none* (see below) |

5. **Orders**: List settings > Advanced settings > Item-level Permissions:
   *Read access* = **Read items that were created by the user**.
   *Create and Edit access* = the most restrictive option offered. The *Selora Add Own* level already
   lacks Edit Items and Delete Items, so customers cannot change or delete an order after submitting it.
6. **Notifications**: customers have no list-level permission. The flow stops inheritance on each new
   item and grants the recipient the **Selora Mark Read** level on that one item
   (see `power-automate-flow.md`, step 14). A recipient can therefore read and edit only their own
   notifications. *Known limit:* because they have Edit Items on their own item, they could alter its
   Message text through the API. This only affects their own notification.
7. **Users** being readable by admins only means a customer's role lookup fails. The app treats a failed
   or empty lookup as Customer, which is the intended default.

## Checks to run once the tenant is ready (none have been run yet)
- As a customer: read Clothes OK; cannot create/edit a Clothes item; cannot open ClothingCosts or Users.
- Customer creates an order; sees only their own; cannot edit or delete it (try the list UI and `_api`).
- Second customer cannot see the first customer's orders or notifications.
- Customer can mark their own notification read but cannot open someone else's.
- Duplicate `Title` on Orders / ClothingCosts / Notifications is rejected.
