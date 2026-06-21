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

React 18 + TypeScript SPA. No router — two tabs (Expenses / Summary) rendered by `App.tsx` via a `useState<'expenses'|'summary'>` toggle. PWA via `vite-plugin-pwa` (workbox, auto-update service worker).

### Sticky shell

`App.tsx` wraps `<AppHeader>` and `<nav className="tab-bar">` together in a `<div className="sticky-shell">`. The shell is `position: sticky; top: 0` — neither child is sticky individually. This means the header can grow to any height (it has two rows; the lower row wraps on mobile) without requiring hardcoded pixel offsets on the tab bar.

### State — two Zustand stores

**`store/tripStore.ts`** — persisted as `hk_store` in localStorage. Holds `current: Trip` (the active trip) and `trips: TripIndex[]` (the index of all saved trips). Additional trips are stored separately under `hk_trip_{id}` keys; `switchTrip(id)` reads from those keys directly. Any mutation that affects balances (amount, payer, splitWith, etc.) resets `settledTransfers` to `[]`.

**`store/currencyStore.ts`** — persisted as `hk_currency` (display currency only). Live rates are cached separately in `hk_rates`. Rates are fetched from `api.exchangerate-api.com/v4/latest/THB` with a 1-hour TTL; falls back to hardcoded `OFFLINE_RATES` from `constants/index.ts`.

**`store/toastStore.ts`** — ephemeral, not persisted. `show(msg)` auto-dismisses after 2.8 s.

### Data flow

All monetary values are stored in the expense's native currency (`Expense.amount` as string, `Expense.currency`, `Expense.currencyRate`). Settlement math always converts to THB first: `amtTHB = parseFloat(amount) / currencyRate`. `formatTHB()` in `currencyService.ts` then converts THB → display currency for rendering.

### Key invariant — settlement math

`computeBalances` and `computeSettlements` in `services/settlementService.ts` are the single source of truth for who owes whom. `SummaryScreen` and `exportService.ts` (PDF/PNG) **must** both call these functions — never re-derive the math inline. If settlement logic changes, update `settlementService.ts` only.

### Theme

`App.tsx` reads `hk_theme` from localStorage on mount and applies `data-theme="light|dark"` to `document.documentElement` (the `<html>` element) via `useEffect`. CSS custom properties are scoped to `[data-theme='dark']` on the root, so the cascade reaches `body` and all descendants correctly. Do not put `data-theme` on any child element.

### Header layout

`AppHeader.tsx` renders a two-row header inside `.header-inner`:
- **Row 1 (`.header-top`)**: logo block on the left; currency selector, theme toggle, My Trips button on the right.
- **Row 2 (`.header-trip-meta`)**: trip name input (flex: 1) + date range picker. On mobile (≤560px) the date row wraps to its own line via `flex-wrap: wrap`.

The share button lives only in the floating FAB (`App.tsx`), not in the header.

### Share encoding

`shareService.ts` gzip-compresses a compact JSON payload (single-letter keys) and base64url-encodes it into a `?d=` URL parameter. Decoded on load in `App.tsx`'s `useEffect`. The `shortenUrl` function calls `is.gd` (supports CORS; verified live).

### CSS

Single global stylesheet at `src/index.css`. No CSS modules. Class names differ from the original `HarnKao.html` reference in several places — the canonical names are whatever the JSX uses.

Avatar colors `.av0`–`.av7` are assigned by `people.indexOf(name) % 8`. Avatars display `name.trim().slice(0,2).toUpperCase()` (2 chars).

### Export

`services/exportService.ts` exports `exportPDF(trip)` (opens a self-contained HTML blob in a new tab, triggers `window.print()` after fonts load) and `exportPNG(trip, el)` (lazy-loads html2canvas from CDN, captures the summary DOM node). Both are wired into `SummaryScreen.tsx`.

## localStorage keys

| Key | Contents |
|---|---|
| `hk_store` | Zustand trip store (current trip + trips index) |
| `hk_trip_{id}` | Individual full Trip objects (read by `switchTrip`) |
| `hk_currency` | Persisted display currency selection |
| `hk_rates` | Cached exchange rates `{ ts: number, rates: {...} }` |
| `hk_theme` | `'light'` or `'dark'` |

## Remaining work

All web features are complete. The only remaining item is Capacitor / iOS App Store submission — see `TODO.md` for the command sequence. Run after the web app is stable and tested on device.
