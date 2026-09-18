# ABL Shipping V2

## Prompt 1 — the shell (send first, alone)

Build **AYBL**, a booking platform for a direct LCL (less-than-container-load) ocean freight service from China to the Caribbean. Customers book cubic metres of space on scheduled sailings the way they'd book airline seats. First lanes: **Yantian (CNYTN) → Bridgetown (BBBGI)** and **Shanghai (CNSHA) → Bridgetown (BBBGI)**. Always use port-to-port language ("Yantian → Bridgetown"), never "China → Barbados", in the product UI.

I've attached two HTML mockups — a public landing page and a customer booking flow. Match their look and structure closely.

### Stack & structure
- React + TypeScript + Tailwind + shadcn/ui, Supabase for auth, database and storage, React Router.
- Build the **complete application shell first** — every portal, route, layout and settings page — even if some pages are placeholders. I don't want to re-edit the shell later.
- This is a **multi-portal app with a back-office admin**:
  - **Public site** (no auth): `/`, `/sailings`, `/rates`, `/how-it-works`, `/quote`, `/login`, `/signup`.
  - **Customer portal** (`/app/*`): Sailings board, Quote & book, My bookings, Booking detail + tracking, Documents, Company, Team, Billing, Settings.
  - **Admin back-office** (`/admin/*`): Dashboard, Sailings (create/edit voyages, capacity, cut-offs), Capacity console, Pricing rules, Bookings & holds, Origin warehouse receiving, Manifests, Destination ops, Customers, Users & roles, Settings, Reports.
- Auth: Supabase email/password + magic link. Roles: `customer`, `ops`, `admin`. The first account matching an **owner allowlist** (an env var of email addresses) is auto-granted `admin`. Admin routes are protected server-side (RLS), not just hidden.
- Mobile-first. A supplier in Shenzhen and a shop owner in Bridgetown will both use this on a phone. Nothing may require a desktop.

### Design system (from the mockups)
- Light, clean, modern. White background `#FFFFFF`, surface `#F4F7FA`, borders `#E1E7EE`, ink `#0F1F33`, muted `#6B7A8F`. One primary blue `#0A47A9` (hover `#063480`, soft `#E8F0FC`). Semantic: green `#138A5C`, amber `#B7741A`, red `#C0392B`.
- Fonts: **Plus Jakarta Sans** for everything, **JetBrains Mono** for every number, code, date and price.
- "Departures board" dark surfaces (`#0F1F33`, text `#F3F6FA`, amber `#FFC247`, green `#4ADE80`) are used only for the live sailings board and the sticky live bar.
- Every price, date, space figure or rate on any page is rendered from data through one shared `<LiveValue>` component (mono font, unit as a small muted suffix, optional "updated hh:mm AST" stamp). **No numbers typed into copy anywhere.** If a value comes from the database it must look like it.
- 12px radius cards with hairline borders and a soft shadow, line icons (lucide), generous whitespace. No gradients, no dark hero.

### Data model (Supabase, Postgres) — create these tables with RLS
- `ports` (code, name, country, cfs_address, cfs_address_zh, transit_days_to_bgi, floor_rate_usd)
- `sailings` (voyage_no e.g. `AYBL-YTN-2618`, origin_port_id, destination_port_id, cargo_cutoff_at, etd, eta, capacity_cbm default 66, capacity_kg default 26000, status: scheduled|open|closed|sailed|arrived|released, notes)
- `price_rules` (one active ruleset: early_days 28, std_days 14, std_mult 1.12, late_mult 1.30, demand70_mult 1.08, demand85_mult 1.15, flex_mult 1.12, standing_discount 0.10, cfs_fee_per_cbm 25, terminal_fee_per_cbm 30, doc_fee 75, insurance_rate 0.012, insurance_min 35, photo_check_fee 45, pickup fees by zone, delivery fee base + per cbm, version, effective_from)
- `companies` (name, country, address, tax_id, phone, whatsapp), `profiles` (user_id, company_id, role, name)
- `bookings` (ref e.g. `AYBL-B-10602`, company_id, sailing_id, cbm, gross_kg, chargeable_cbm, cargo_type, fare: saver|flex, standing boolean, origin_option: cfs|pickup_gz|pickup_yiwu, delivery_option: collect|deliver, insurance_declared_value, photo_check boolean, price_breakdown jsonb, total_usd, status: held|confirmed|received|loaded|sailed|arrived|released|cancelled|expired, hold_expires_at, seal_no, created_by)
- `booking_events` (booking_id, status, note, photos[], created_at, created_by) — every status change writes one
- `documents` (booking_id, type: confirmation|supplier_label|house_bl|manifest|invoice, storage_path)
- `backfill_allocations` (sailing_id, cbm, product, owner) — space AYBL fills itself with low-value high-turnover goods
- Availability is **never stored**. `available_cbm = capacity_cbm − sum(confirmed + held-and-not-expired bookings) − backfill`. Expose it as a Postgres view `sailing_availability`.

### Pricing logic (implement as one pure function used by the quote page, booking, and admin preview)
- `chargeable_cbm = max(cbm, gross_kg / 1000)` rounded **up** to 0.5.
- Days to cut-off `d`: base = floor_rate × (d ≥ 28 ? 1 : d ≥ 14 ? std_mult : late_mult).
- Fill = committed / capacity: × demand85_mult if ≥ 0.85, else × demand70_mult if ≥ 0.70.
- Fare: Flex × flex_mult. Standing booking: −standing_discount on freight only, and standing bookings never pay the late step.
- Add CFS fee × cbm, terminal fee × cbm, doc fee per booking, optional pickup, delivery, insurance (max(min, rate × declared)), photo check.
- Return a line-item breakdown; store it on the booking as `price_breakdown` so a later rule change never changes a confirmed price.

### Non-negotiable behaviours
- Holding space is **transactional**: a Postgres function `hold_space(sailing_id, cbm)` checks availability and inserts the hold in one transaction so two customers can never oversell a sailing. If only part fits, hold what fits and put the remainder on a waitlist for the next sailing on the same lane.
- Holds expire after 48h (cron/edge function) and the space reappears immediately.
- Sailings are `open` only between creation and cargo cut-off; the board shows "Filling" when ≤ 10 cbm remain and "Waitlist" at 0.
- Every status change writes a `booking_events` row that the customer sees as a tracking milestone: Booked → Paid → Received at origin warehouse → Loaded & sealed → Sailed → Arrived Bridgetown → Ready to collect.
- PDF export (server-side) for: booking confirmation, supplier delivery label (English + Chinese, with the booking ref, carton marks and the correct origin CFS address), and the per-sailing manifest.
- Realtime: subscribe to `sailing_availability` so boards and quotes update live when another booking is confirmed; flash the changed value.

### Pages to build now (use the mockups)
1. **Public landing** `/` — exactly the attached landing mockup: sticky nav; a sticky **vertical live bar** under it that cycles one sailing at a time (lane, cut-off, sails, ETA, space, rate) every 3.5s with a Bridgetown clock; hero headline "Ship from China without filling a container. Or waiting in Panama." beside a dark **departures board** of upcoming sailings; a no-account **30-second quote** (port toggle, cbm slider, our all-in price vs Panama/Miami LCL); route diagram; three proof cards; how it works; schedule table; live rates table; who it's for; final CTA with cut-off countdown. Skip the 3D container section for now — leave a placeholder section `id="container"`.
2. **Customer: Sailings board** `/app/sailings` — port filter chips (All / Yantian → Bridgetown / Shanghai → Bridgetown); one card per sailing: voyage, lane + UN/LOCODEs, sails, arrives, cut-off with days left, transit, fill bar (booked / held / available), from-rate, all-in for 1 cbm, status pill, "Get quote" / "Join waitlist".
3. **Customer: Quote & book** `/app/book/:sailingId` — volume, weight, cargo type, supplier location, delivery option, Saver vs Flex fare cards with live per-cbm, add-ons (insurance, standing booking, photo check); sticky summary with line items, total, per-cbm all-in, oversell guard message, "Hold space & continue"; comparison line vs legacy LCL.
4. **Customer: Booking detail** `/app/bookings/:ref` — tracking milestones, booking facts, "Next step: get cargo to {origin port}" panel with CFS address and carton marking, documents list with downloads.
5. **Customer: My bookings** `/app/bookings` — table with ref, sailing, lane, volume, fare, status, ETA, paid / Pay now.
6. **Admin: Sailings** and **Capacity console** — create/edit sailings; per-sailing meter of booked / held / backfill / free in cbm **and kg**; list of holds with expiry; buttons to confirm, release, roll to next sailing.
7. **Admin: Pricing rules** — editable form for the active ruleset with a live "preview price for X cbm on sailing Y".
8. All remaining portal/admin pages as clean placeholders with the correct nav, title and an empty-state.

Seed realistic demo data: the two ports, six sailings alternating Yantian/Shanghai weekly from 16 Sept 2026, one demo customer company "Island Tools & Hardware Ltd" with two past bookings, and one admin user. All seeded prices must flow through the pricing function, never be hard-coded.

Start by confirming the route map and data model back to me, then build the shell and the public landing page.

---

## Prompt 2 — after the shell is right

Now finish the customer booking flow end-to-end against Supabase: quote → `hold_space` → confirmation page → booking detail with tracking. Wire Stripe Checkout (test mode) to the "Pay now" action so a paid hold becomes `confirmed`. Add the 48-hour hold expiry edge function and the waitlist behaviour. Generate the booking confirmation and supplier label PDFs and store them in Supabase Storage under the booking.

## Prompt 3 — admin operations

Build the admin **Origin warehouse receiving** screen: a mobile-first checklist per sailing where staff mark each booking as received, enter carton count, upload photos (camera on phone), flag discrepancies; this writes the `received` event and emails the customer. Then the **Manifest** page: one click generates the per-sailing manifest PDF and house B/L drafts from confirmed bookings. Then **Destination ops**: arrived → released with a collection code, and a delivery run list.

## Prompt 4 — live feel

Add Supabase Realtime to the public landing, the sailings board and the quote page so space and rates update in place with a brief highlight when a booking is confirmed elsewhere. Add "last change hh:mm AST" stamps that come from the most recent `booking_events` row, not the page load time. Add the cut-off countdown to the final CTA and the departures board clock in America/Barbados time.

## Prompt 5 — optional: the 3D container

Replace the `#container` placeholder on the landing page with a scroll-pinned section using `@react-three/fiber` and `@react-three/drei`: a white 40' high-cube container with the AYBL mark on both sides, side view → camera orbits to the door end → doors open → 20 shrink-wrapped pallets slide in from the far end forward with a live "N of 66 cbm loaded" counter → doors close → blue seal → camera pulls back. Scroll position drives the timeline (scrub both ways). Four cross-fading captions: "One container, many shippers", "Doors open once, at Yantian or Shanghai", "Pallet by pallet. Half a cubic metre at a time.", "Closed at origin. Opened only in Bridgetown." Respect prefers-reduced-motion by showing the final sealed frame.

---

### Things I'll decide later (don't build yet)
Multi-destination islands, agent/broker portal, backfiller product catalogue, customs-broker view, WhatsApp notifications.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://aybl-shipping-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b3a0c877-03fd-49fa-bb85-b4accae00dde).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
