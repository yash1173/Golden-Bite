# Verification record

## Automated checks

- `npm run typecheck` passed.
- `npm run build` passed with all routes compiled for production.
- `npm run test:db` passed **34 checks** against an in-memory PostgreSQL engine (PGlite). Supabase Auth roles and user IDs are simulated for these tests.

Database checks cover:

- Anonymous read access to the menu and token-only screen; private orders remain inaccessible.
- Customer isolation for orders and order items.
- Staff-only status changes and protected staff membership.
- Rejection of direct client writes and forged menu prices/totals.
- One order per retry request ID.
- Rejection of invalid quantities, duplicate items, empty bags, unavailable products and unsupported delivery postcodes.
- No orphan orders/tokens after rejected checkout.
- Delivery-fee and free-delivery-threshold calculations.
- Pickup preparation/ready/collected transitions and delivery preparation/dispatch/delivered transitions.
- Rejection of skipped and backward transitions.
- Public token synchronization, removal on cancellation, exclusion of delivery orders, and hiding tokens older than 24 hours.
- Per-customer order rate limiting.

The tests use a single in-memory database connection. They do not simulate multi-connection load; transaction locks, a PostgreSQL sequence and unique constraints provide the concurrency safeguards in the migration.

## Browser checks performed

The actual running website was checked with desktop and phone-width browser viewports.

- Menu loaded all nine products and all local images without broken-image errors.
- Burger filter showed three items; applying vegetarian filtering showed one burger.
- Added two products to the bag; the pickup subtotal and total were ₹328.
- Pickup checkout created token G001 and cleared the bag.
- Staff preparation and ready actions updated both the customer tracker and the public screen across tabs.
- Marking G001 collected moved it into the Collected column.
- Delivery checkout rejected postcode 999999, accepted 560038, and added the ₹49 delivery fee to a ₹179 product.
- Delivery token G002 did not appear on the pickup screen.
- Staff dispatched G002, then marked it delivered; the customer tracker showed completion.
- A phone-width checkout created pickup token G003; staff marked it ready and it appeared on the public screen.
- At a 390px viewport, the menu and checkout had equal document content and scroll widths (375px after the browser’s vertical scrollbar), with no horizontal overflow.
- A separate local instance with `ORDER_BOARD_ONLY=true` returned HTTP 200 at `/`, served the pickup board and omitted the customer navigation. That verification copy shared dependencies through a local junction and adjusted its temporary build root accordingly; the delivered project uses its own normal installation root.

Saved previews beside the source folder:

- `golden-bite-desktop.jpg`
- `golden-bite-mobile-checkout.jpg`
- `golden-bite-order-screen.jpg`

## Checks required after connecting your Supabase project

No Supabase credentials or Vercel account were supplied. The following hosted integration checks are still required:

1. Apply the migration and sample menu in a new Supabase project.
2. Confirm guest Auth is enabled and an actual guest checkout succeeds.
3. Confirm email linking, email delivery, redirect URLs, password setup and subsequent sign-in work with the project’s Auth settings.
4. Confirm a customer cannot access the staff dashboard, and an explicitly authorized staff account can.
5. Place an order from one device, update it on another, and watch Realtime updates on a third device and the public screen. The app polls every 10 seconds as a fallback.
6. Deploy both Vercel projects if using separate customer/display domains, and confirm they share the same database.

No real order, courier dispatch or payment was made during verification. All browser orders were explicitly local demo orders. The generated hero and sample menu photos should be replaced or approved against the restaurant’s real offerings before launch.
