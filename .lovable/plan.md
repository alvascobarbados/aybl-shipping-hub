# Landing page rebuild — sailing results + reservation drawer

Reply to the brief: schema additions, component list, differences, questions. Nothing under `/app/*`, `/admin/*`, pricing or `hold_space` changes.

## 1. Schema additions

**`ports.city`** — text. "Shenzhen" for Yantian, "Shanghai" for Shanghai, "Bridgetown" for BBBGI. Used in "Sails · Shenzhen".

**`sailings.shipment_no`** — text, unique, `BB-1001` style: destination country's two-letter code + four-digit sequence from 1001, per destination country. Generated on insert by a trigger backed by a per-country sequence table, never typed. `voyage_no` stays and remains admin-only.

**`sailing_availability`** — already exposes `capacity_cbm`, `booked_cbm`, `held_cbm`, `backfill_cbm`, `committed_cbm`, `available_cbm`. I map, not duplicate:
- taken (confirmed) = `booked_cbm`
- pending = `held_cbm` + `backfill_cbm`
- free = `available_cbm`

The view gets `shipment_no` added so the public list needs one query.

**Seed** — replaces the six demo sailings with the three from the brief: BB-1001 Yantian (cut-off 2 Oct 2026, ETD 7 Oct, ETA 8 Nov, 41 confirmed, 16.5 pending), BB-1002 Shanghai (16 Oct / 21 Oct / 22 Nov, 6 confirmed, 4 pending), BB-1003 Yantian (30 Oct / 4 Nov / 6 Dec, empty). All 66 cbm. Confirmed and pending volumes are seeded as real booking rows against the demo company so the view computes them rather than storing figures.

## 2. Components

| File | What it is |
| --- | --- |
| `search-card.tsx` | From / To / Goods ready by + Search. Runs on mount with defaults. |
| `results-header.tsx` | Lane line, "N sailings · Edit search", Soonest / Most space sort with live sub-values. |
| `sailing-row.tsx` | One flat row: identity + badges, deadline chip, journey line, container bar, stepper + Reserve. Owns its own cbm state. |
| `deadline-chip.tsx` | Clock + "In warehouse by 2 Oct · 14 days", amber / red / grey. |
| `journey-line.tsx` | Big dates, ship line, "32 days · direct". Shared by row and drawer. |
| `container-bar.tsx` | Taken / pending-stripe / yours fills, crawl + sweep animations, free figure. |
| `cbm-stepper.tsx` | Single bordered pill, 0.5 steps, min 0.5, max = free. |
| `reserve-drawer.tsx` | Left drawer on desktop, bottom sheet on phone; cart → held states. |
| `legend.tsx` | Taken · Pending · Yours · Free + "Dates estimated". |
| `lib/sailing-search.ts` | Filter + sort + badge logic, realtime subscription with quantity clamping. |

Landing `/` becomes hero + search + results only. Public nav drops Rates. `/rates` and pricing stay in the codebase, just off this page.

## 3. Things I'd do differently / flag

- **Brand.** The references say **AYBL**; the live site currently says **ABL Shipping** everywhere (nav, footer, titles, emails). I will leave the site as ABL Shipping unless you tell me otherwise — say the word and I'll switch the references' wording in.
- **Hold with no price.** `hold_space` takes fare, cargo type, origin and delivery options because it prices the booking as it holds. The drawer collects none of that. I'll call it with neutral defaults (saver, CFS drop-off, collect at Bridgetown, no insurance) and let the customer change all of it on `/app/bookings/:ref`, which is where price appears. No price is shown or implied on `/` or in the drawer.
- **Seed replacement.** The three reference sailings replace the current six, so the page matches the references exactly. If you'd rather keep the six and add these, say so.
- **Pending stripes.** Animated diagonal stripes plus the sweep run on every visible row. I'll pause both when the tab is hidden as well as under reduced motion, so a phone doesn't cook.
- **Logged-out return.** `?reserve=<id>&cbm=1.5` is carried through login and signup and the drawer reopens on return, replacing the current `next=/app/book/...` handling for this path. The old links keep working.

## Questions

1. AYBL or ABL Shipping on the public site?
2. Replace the six seeded sailings with the three reference ones, or keep both sets?
