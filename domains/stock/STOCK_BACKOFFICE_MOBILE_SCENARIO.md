# Stock feature: Backoffice ↔ Mobile app – roles and scenario

This document explains how the **Stock** feature works across the **storeyes-backoffice** (web) and **storeyes-blue** (mobile app), the structure of the screens, and how to notify the other user when the stock update is not yet done.

---

## 1. Important principle: the user always sees the real total

- **Total Stock Value** in the app **always** shows the **real** stock value – i.e. the one defined by the owner’s **manual count** (human).
- **Inventory** is for **comparing** system (automatic calculation) vs real (owner’s count). The owner sees **only the products that were modified** (e.g. by another user) so they can review the comparison. The **écart** (variance) gives statistics and insights to improve the business.

---

## 2. Mobile app: screen structure (redesign)

### 2.1 Main Stock screen (no tab selector)

When the owner opens Stock, they see:

1. **Main card: Real stock value**  
   - Shows the total real stock value (from the owner’s count).  
   - Tapping it opens the **Value detail** screen.

2. **Secondary card: To Buy**  
   - Indicates how many products need restocking (or “No products need restocking”).  
   - Tapping it opens the **To Buy detail** screen.

3. **Secondary card: Inventory**  
   - Indicates how many products have modifications to review (or “No modifications”).  
   - Tapping it opens the **Inventory detail** screen.

There is **no tab selector**; navigation is by tapping one of these three cards.

### 2.2 Value detail screen (Total stock value)

- Opened when the owner taps the **Real stock value** card.
- **Structure**: Categories as expandable sections. Under each category: list of products.
- **Content per product**: name, quantity (real), value (MAD), price per unit.
- Designed to scale to **many products per category** (clear hierarchy: category → list of products).

### 2.3 To Buy detail screen

- Opened when the owner taps the **To Buy** card.
- **Structure**: Products grouped **by category**. Each product shows:
  - **Actual** quantity (real count) vs **Threshold**.
- **No suggestion** of “how much to buy”; only actual vs threshold so the owner knows what needs restocking.

### 2.4 Inventory detail screen

- Opened when the owner taps the **Inventory** card.
- **Structure**: Only **modified** products (e.g. changed by another user), grouped **by category**.
- For each modified product: **System** quantity vs **Real** (manual) quantity and **difference (Δ)**.
- Owner can adjust real quantity and see the comparison (system vs real total and écart).
- **Share link**: One button to share the backoffice URL with the person who will fill the stock (see § 4).
- When there are **differences** (after the other user submitted their count), the screen shows the **date** of those differences (e.g. “5 differences · since 18 Feb 2025”) and an **“Accept and validate”** button. The owner can accept to make the real counts the new system baseline (system and real match; total stock value reflects the validated stock). The cycle can repeat: owner shares link → other user fills stock → owner sees differences and date → owner accepts and validates.

---

## 3. Purpose of each part

### Backoffice (storeyes-backoffice)

| Responsibility | Description |
|----------------|-------------|
| **Stock products** | Define products (name, category, unit, unit price, minimal threshold). |
| **Recipes** | Link sales products (cash register) to stock products and quantities. |
| **Sales / cash register** | Record what was sold. |
| **System stock calculation** | From a baseline (e.g. last real inventory), subtract consumption from sales using recipes. Result: **system quantity** per product. |
| **Persistence** | Store the owner’s real (manual) inventory from the app as the new baseline. |
| **Dedicated space for “other user”** | A dedicated area (e.g. **Inventory** or **Stock update** / **Your tasks**) where the person in charge (store manager, employee) can open the backoffice and complete the stock update. This space is the target of the **share link** and **notify** actions from the mobile app. |

### Mobile app (storeyes-blue)

| Responsibility | Description |
|----------------|-------------|
| **Main screen** | One main card (Real stock value) and two cards (To Buy, Inventory). No tabs; tap to open the corresponding detail screen. |
| **Value detail** | Categories and products (real quantities and values) in a clear, scalable structure. |
| **To Buy detail** | Products to restock by category (actual vs threshold only, no “buy X” suggestion). |
| **Inventory detail** | Only **modified** products by category (system vs real comparison). One **Share link** button to send the backoffice URL to the person who will fill the stock. When differences exist, shows their date and **Accept and validate** to set real stock as the new system baseline. |
| **Sync with backoffice** | Send the owner’s real (manual) inventory so the backoffice can persist it and use it as the baseline. |

---

## 4. Notifying the other user when the stock update is not yet done

When the owner sees that the stock value update has **not yet been done** by the other user (e.g. store manager or employee), the app offers two ways to **push** that user to complete the update in the backoffice.

### 4.1 Share link

- **What it does**: The owner can **share a link** (e.g. by message, email, or any app) that points directly to the backoffice.
- **Target**: A dedicated page in the backoffice, e.g.:
  - `https://your-backoffice.example.com/inventory`  
  - or `https://your-backoffice.example.com/stock-update`  
  - or a “Your tasks – Stock count” area for the person in charge.
- **Flow**: Owner taps **“Share link”** in the Inventory detail screen → system opens the native share sheet with the backoffice URL → owner sends it to the other user → that user opens the link and lands in the backoffice space where they can complete the stock update.

### 4.2 Notify user (ping)

- **What it does**: The owner can **notify** the person in charge (e.g. send an email or an in-app notification) so they are reminded to open the backoffice and complete the update.
- **Implementation options** (to be wired in production):
  - **Email**: Backoffice or mobile calls an API that sends an email to the responsible user with the same backoffice link (e.g. “Please complete the stock update: [link]”).
  - **In-app notification**: If the other user has access to an app (mobile or web) linked to the backoffice, send a push or in-app notification with a deep link to the backoffice inventory / stock-update page.
  - **Backoffice “Pending tasks”**: Backoffice shows a “Pending stock update” or “Your tasks” section for that user; the notify action creates or highlights that task and, if applicable, sends an email/push with the link.
- **Flow**: Owner taps **“Notify user”** → (in production) API is called to send the notification and link → the other user receives it and opens the backoffice to complete the update.

### 4.3 Summary

| Action       | Purpose                                                                 | Target |
|-------------|-------------------------------------------------------------------------|--------|
| **Share link** | Owner sends the backoffice URL to the other user (e.g. by message/email). | Dedicated backoffice page (inventory / stock-update / tasks). |
| **Notify user** | Owner triggers a reminder (email or notification) to the person in charge. | Same backoffice space; user is “pinged” to open it and complete the update. |

The backoffice should expose a **stable URL** for the inventory or “stock update” (or “Your tasks”) space so that both Share link and Notify user can point the other user to the same place.

---

## 5. Data flow (high level)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKOFFICE (Web)                                  │
│  • Stock products, recipes, sales                                        │
│  • System stock = f(baseline, sales, recipes)                             │
│  • Store real inventory (from mobile) as new baseline                    │
│  • Dedicated space for “other user” (inventory / stock update / tasks)   │
└─────────────────────────────────────────────────────────────────────────┘
                    │                                    ▲
                    │ GET products, system quantities    │ POST real (manual)
                    │ and unit prices                    │    inventory
                    ▼                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                         MOBILE APP                                       │
│  • Main: 1 card (Real value) + 2 cards (To Buy, Inventory)               │
│  • Value detail: categories → products (real)                            │
│  • To Buy detail: by category, actual vs threshold only                  │
│  • Inventory detail: modified products by category + Share link + Accept and validate  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Current implementation (fake data)

- **Main Stock screen**: One main card (Real stock value) and two cards (To Buy, Inventory). No tab selector. Tapping a card navigates to `/stock/value`, `/stock/tobuy`, or `/stock/inventory`.
- **Value detail**: Categories with expandable product lists (real quantities and values).
- **To Buy detail**: Products to restock grouped by category; actual vs threshold only (no “buy X” suggestion).
- **Inventory detail**: Only **modified** entries (difference ≠ 0) by category; system vs real comparison; one **Share link** button (native share sheet with a placeholder backoffice URL); when differences exist, shows their **date** and an **Accept and validate** button that sets real counts as the new system baseline and clears the differences date.
- When you connect the real API: load products and system quantities from the backoffice; send the owner’s real inventory; use the real backoffice URL for Share link; set the differences date when the other user submits from the backoffice; send the owner's real inventory when they accept and validate.
