# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev server (port 5173 default)
npm run dev

# Type-check only (no emit) — the only verification step; there are no tests
node_modules/.bin/tsc --noEmit

# Production build (tsc + vite)
npm run build

# Preview production build
npm run preview
```

## Architecture

React 18 + TypeScript SPA. No router — two tabs (Expenses / Summary) rendered by `App.tsx` via a `useState<'expenses'|'summary'>` toggle. PWA via `vite-plugin-pwa` (workbox, auto-update service worker). Deployed on Vercel (`vercel.json` provides the SPA rewrite rule).

### Sticky shell

`App.tsx` wraps `<AppHeader>` and `<nav className="tab-bar">` in `<div className="sticky-shell">`. The shell is `position: sticky; top: 0` — neither child is sticky individually. This lets the header grow to any height (two rows; lower row wraps on mobile) without hardcoded pixel offsets on the tab bar.

### State — Zustand stores

**`store/tripStore.ts`** — persisted as `hk_store` in localStorage. Holds `current: Trip` (active trip) and `trips: TripIndex[]` (index of all saved trips). A `subscribe` call at the bottom of the file fires on every `current` change: it writes the trip to `hk_trip_{id}` **and** upserts the index entry (name + `updatedAt`) — this is the only place the index is maintained; actions never touch `trips` directly except `deleteTrip`. `switchTrip(id)` reads from the `hk_trip_{id}` keys to restore a previous trip. `deleteTrip` of the active trip switches `current` to the most recent remaining trip (or a fresh empty one). Any mutation that affects balances (amount, currency, currencyRate, payer, splitWith, customAmounts) resets `settledTransfers` to `[]`. Key actions: `duplicateExpense(id)` clones an expense and inserts it after the original; `clearAllData()` removes all `hk_trip_*` keys and resets state to one empty trip.

**`store/currencyStore.ts`** — persisted as `hk_currency` (display currency only). Live rates cached in `hk_rates`. Fetched from `api.exchangerate-api.com/v4/latest/THB` with a 1-hour TTL; falls back to `OFFLINE_RATES` from `constants/index.ts`.

**`store/toastStore.ts`** — ephemeral, not persisted. `show(msg)` auto-dismisses after 2.8 s.

### Data models

`Expense` fields: `id`, `desc`, `notes` (free-text, optional), `date`, `amount`, `currency`, `currencyRate`, `payer`, `splitMode`, `splitWith`, `customAmounts`, `category`. `notes` is included in the share URL payload (key `n`, omitted when empty) and rendered in PDF export.

The `Category` union in `models/index.ts` is derived from `CATEGORIES` in `constants/index.ts` — to add a category, update `CATEGORIES` and `CAT_EMOJI` only. Never remove a category — existing saved trips reference them by name.

`ExpenseCard` shows a `⧉` duplicate button (inserts clone after original) and a `.field-notes` input between the date picker and "Paid by" row.

`TripsModal` has a "Reset all data" danger button at the bottom (calls `clearAllData`).

### Data flow

All monetary values are stored in the expense's native currency (`Expense.amount` as string, `Expense.currency`, `Expense.currencyRate`). `currencyRate` is "foreign units per 1 THB", pinned at the moment the user picks the currency in `ExpenseCard` (from the currency store's rates; `null` if unavailable, which triggers the rate-unavailable warning and excludes the expense from settlement). Settlement math always converts to THB first: `amtTHB = parseFloat(amount) / currencyRate`. `formatTHB()` in `currencyService.ts` converts THB → display currency for rendering.

### Key invariant — settlement math

`computeBalances` and `computeSettlements` in `services/settlementService.ts` are the single source of truth for who owes whom. `SummaryScreen` and `exportService.ts` (PDF/PNG) **must** both call these functions — never re-derive the math inline.

### Theme

`App.tsx` applies `data-theme="light|dark"` to `document.documentElement` via `useEffect`. CSS custom properties are scoped to `[data-theme='dark']` on the root element. Do not put `data-theme` on any child element.

### Header layout

`AppHeader.tsx` renders a two-row header inside `.header-inner`:
- **Row 1 (`.header-top`)**: logo on the left; currency selector, theme toggle, My Trips button on the right.
- **Row 2 (`.header-trip-meta`)**: trip name input (`flex: 1`) + date range. On mobile (≤560px) the date row wraps to its own line via `flex-wrap: wrap`.

The share button lives only in the floating FAB in `App.tsx`, not in the header.

### DatePicker component

`components/DatePicker.tsx` replaces all `<input type="date">` elements. It has three drill-down views:
- **Days** → click the month/year label to go to **Months** → click the year label to go to **Years**
- Arrows navigate within the current view (prev/next month, year, or 12-year block)
- Selecting a year goes to Months; selecting a month goes to Days; selecting a day closes the picker

Props: `value` (YYYY-MM-DD or `''`), `onChange`, `placeholder`, `className` (applied to the trigger button — pass `'trip-date-input'` or `'field-date'` to inherit existing visual styles), `alignRight` (opens popover aligned to right edge, used for the trip end-date to avoid going off-screen), `min` / `max` (YYYY-MM-DD strings — days outside the range are disabled; month/year navigation is unrestricted).

Used in `AppHeader.tsx` (trip start/end dates) and `ExpenseCard.tsx` (expense date). `ExpenseCard` passes the trip's `tripDateStart`/`tripDateEnd` as `min`/`max` and renders a `.date-range-warn` message for expenses already outside the range.

### Share encoding

`shareService.ts` gzip-compresses a compact JSON payload (single-letter keys) and base64url-encodes it into a `?d=` URL parameter. Decoded on load in `App.tsx`'s `useEffect`. The payload includes the trip id (key `i`), so opening the same link twice — or an updated re-share — overwrites the existing trip instead of creating a duplicate. It also carries `settledTransfers` (key `st`, omitted when empty); `loadSharedTrip` unions those with the local copy's marks so reopening a link never loses "paid" ticks. Links minted before these keys existed fall back to a fresh id (one duplicate per open).

`ShareModal` offers two share paths:
1. **Copy link** — copies the full `?d=` URL to clipboard; shows a native Share… button when `navigator.share` is available.
2. **Shorten link** — POSTs the full URL to the Vercel Edge Function at `api/shorten.ts`, which proxies to `https://tinyurl.com/api-create.php` to avoid browser CORS. On success, the short URL is displayed inline with Copy and Share… buttons.

`api/shorten.ts` is a Vercel Edge Function (`export const config = { runtime: 'edge' }`). Before proxying to TinyURL it validates: protocol must be `https:`, hostname must be exactly `harnkao.vercel.app`, and a `?d=` query param must be present. It also validates that TinyURL's response body starts with `http` before returning it (TinyURL returns HTTP 200 with body `"Error"` on rejection).

`vercel.json` uses a negative-lookahead rewrite `/((?!api/).*)` → `/index.html` so SPA routing does not intercept `/api/*` paths.

### Analytics

`@vercel/analytics/react` — `<Analytics />` is mounted in `main.tsx` alongside `<App />`. No-op locally; activates automatically on Vercel.

### CSS

Single global stylesheet at `src/index.css`. No CSS modules. Avatar colors `.av0`–`.av7` assigned by `people.indexOf(name) % 8`. Avatars display `name.trim().slice(0,2).toUpperCase()`.

### Export

`services/exportService.ts` exports `exportPDF(trip)` (self-contained HTML blob → new tab → `window.print()`) and `exportPNG(trip, el)` (lazy-loads html2canvas from CDN). Both called from `SummaryScreen.tsx`. The PDF expense table renders `desc`, `category`, and `notes` (italic, below category when present).

## localStorage keys

| Key | Contents |
|---|---|
| `hk_store` | Zustand trip store (current trip + trips index) |
| `hk_trip_{id}` | Individual full Trip objects (read by `switchTrip`) |
| `hk_currency` | Persisted display currency selection |
| `hk_rates` | Cached exchange rates `{ ts: number, rates: {...} }` |
| `hk_theme` | `'light'` or `'dark'` |

## Changelog

New changelog documents go in `docs/` following the naming convention: `{yyyyMMdd}_{slug}.md`.

## Remaining work

All web features are complete.
