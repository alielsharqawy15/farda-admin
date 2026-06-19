# Admin E2E Test Plan

The admin app does not currently include Playwright or Cypress dependencies. Add one runner before converting this plan into executable specs.

## Recommended Runner

- Playwright, because it supports browser storage/session setup and network assertions well.

## Scenarios

1. Login
- Visit `/login`.
- Submit email, password, and optional 2FA code.
- Assert redirect to dashboard.

2. Order Detail
- Open `/orders`.
- Click an order number.
- Assert customer, products, totals, payment history, and status history render.

3. Shipment Update
- Open an order detail page.
- Enter carrier and tracking number.
- Save shipment.
- Assert tracking history includes shipment update.

4. Refund Action
- Open `/returns`.
- Open a return detail page.
- Approve partial refund.
- Attempt duplicate refund and assert the UI shows backend rejection.

5. Audit Log
- Open `/audit-logs`.
- Filter by action and entity type.
- Open an audit detail page.
- Assert before/after panels render.

6. Jobs
- Open `/jobs`.
- Trigger payment maintenance.
- Assert queued/success message and last-run metadata update after polling.
