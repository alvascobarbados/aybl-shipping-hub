# Public site rework — one job: reserve space

Nothing under `/app/*`, `/admin/*`, pricing, holds, availability or seeded data changes, apart from the three exceptions you listed.

## 1. Public route map

| Route | What it is |
| --- | --- |
| `/` | Reserve space — headline, one line, booking panel, three plain lines, footer |
| `/sailings` | All open sailings, lane chips, Reserve space per sailing |
| `/rates` | How pricing works, live rate table, legacy-LCL comparison (moved here) |
| `/how-it-works` | Steps, schedule table, cut-off explanation (absorbed from landing) |
| `/about` | New — the long read |
| `/contact` | New — Barbados and China cards plus the form |
| `/login`, `/signup` | Keep, now carrying `next`, `cbm`, `kg` |
| `/quote` | Retired, redirects to `/` |

Nav (desktop): Sailings · Rates · How it works · About · Contact · Log in · **Reserve space**.
Mobile: same items in the sheet, Reserve space pinned at the bottom.

## 2. What moves off the landing page

| Section today | Goes to |
| --- | --- |
| Sticky live bar | Removed from public pages (component kept in the project) |
| Departures board | Becomes the selectable sailing picker inside the booking panel |
| 30-second quote (slider + line items) | Replaced by the booking panel |
| "vs Panama / Miami LCL" comparison | `/rates` |
| Route diagram | `/about` (with a link to How it works) |
| Three proof cards | `/about`, as "our promise" |
| Four steps | `/how-it-works` |
| Schedule table | `/how-it-works` |
| Live rates table | `/rates` (merged with the existing rate card) |
| Who it's for | `/about` |
| Final CTA with countdown | Removed; the panel is the call to action |
| `#container` placeholder | `/about` |

## 3. Two new tables

**`site_settings`** — contact details as data, one row per side.

- `id` uuid pk
- `side` text unique, `barbados` | `china`
- `label`, `audience_note`
- `company_name`, `contact_name`
- `address`, `address_zh`
- `phone`, `whatsapp`, `wechat`, `email`
- `hours`, `hours_zh`, `timezone`
- `updated_at`

RLS: anyone may `select`; only `admin` may `update`/`insert`. Seeded with obvious placeholders. CFS addresses still come from `ports`, not duplicated here.

**`contact_requests`** — form submissions.

- `id` uuid pk, `created_at`
- `name`, `company`, `email`, `phone`
- `role` text: `customer` | `supplier_delivering` | `supplier_reserving` | `other`
- `message`
- On-behalf fields, used when `role = supplier_reserving`: `customer_name`, `customer_email`, `cbm` numeric, `sailing_id` fk to `sailings`
- `side` text: which desk it was routed to
- `status` text default `new`
- `handled_by`, `handled_at`

RLS: anyone may `insert`; only `ops` and `admin` may `select`/`update`. Grants on both tables in the same migration.

## 4. The reserve flow

Signed in → `/app/book/:sailingId?cbm=…&kg=…`.
Signed out → `/signup?next=/app/book/:sailingId&cbm=…&kg=…`; `/login` carries the same. The booking page reads `cbm` and `kg` so the choice survives login.

## 5. Things I would do differently

- **Waitlist:** there is no waitlist table today. For "Join waitlist" I would write a `contact_requests` row with the chosen sailing and volume, so ops sees it in one place, rather than adding a third table. Say the word if you want a real `waitlist` table instead.
- **Email routing:** the contact form writing to the table is straightforward; actually sending mail to the Barbados or China desk needs an email sender to be set up. I would ship the table and the admin view first, and add the email once you confirm which address sends.
- **Sticky mobile bar:** on a phone, the price plus Reserve button stick to the bottom as you asked — which means the sailing picker scrolls above it. That is the right trade, just flagging it.
- **`/quote` redirect:** I will keep the route file as a redirect so old links and the sitemap stay valid.

## Questions

1. Should "Join waitlist" use `contact_requests`, or do you want a dedicated waitlist table?
2. Admin › Settings contact editor — a simple two-card form is what I have in mind; anything more?
