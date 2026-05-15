# TODO: Dynamic Admin Dashboard (incl. Trainer-side)

## Step 1 — Dashboard infrastructure
- [x] Add custom Django admin dashboard view/URL (in progress in next step).
- [x] Create admin dashboard template with KPI cards + quick links.


## Step 2 — KPI data aggregation
- [ ] Implement KPI queries (users/subscriptions/payments/tickets/content).
- [ ] Ensure queries are optimized (select_related/prefetch/aggregations).

## Step 3 — Trainer-side admin dashboard
- [ ] Add trainer role detection (based on CustomUser.role).
- [ ] Restrict/shape dashboard data and links for trainers.

## Step 4 — Admin UX improvements
- [ ] Improve key ModelAdmin pages (list_display/list_filter/search/ordering).
- [ ] Add autocomplete_fields for FK heavy relations.

## Step 5 — Verification
- [ ] Run server and open `/admin/`.
- [ ] Confirm dashboard loads and shows correct cards.
- [ ] Confirm trainer account sees trainer-side dashboard.

