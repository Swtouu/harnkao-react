# HarnKao — หารข้าว

Trip expense splitter for groups. Track who paid what, split costs equally or with custom amounts per person, and calculate the minimum transfers needed to settle up.

No account required. All data stays in your browser.

**Live app:** [harnkao.vercel.app](https://harnkao.vercel.app)

## Features

- **People & expenses** — add trip members, log expenses with description, amount, date, notes, and one of 14 categories (Food, Cafe, Dessert, Drinks, Groceries, Hotel, Transport, Flight, Activity, Entertainment, Shopping, Health, Gift, Other)
- **Scan a receipt** — tap "📷 Scan receipt", pick or photograph a bill, and the app reads the total, date, and merchant name off it with on-device OCR (English + Thai) and starts a new expense pre-filled with them. The image is processed entirely in your browser and never uploaded; double-check the detected fields since OCR isn't perfect
- **Flexible splitting** — split each expense equally among selected people, or enter custom amounts per person with a live balance check
- **Multi-currency** — 12 currencies with live exchange rates (1-hour cache, offline estimates as fallback); each expense pins its rate at entry time
- **Settlement calculator** — computes the minimum number of transfers to settle all debts; mark individual transfers as paid
- **PromptPay QR** — tap 📱 QR on any transfer to show a scannable Thai PromptPay QR with the exact amount pre-filled; works with any Thai banking app
- **Summary dashboard** — total spent, per-person balances, and spending breakdown by category
- **Share via URL** — the whole trip is gzip-compressed into a single link; no server stores your data. Optional link shortening via TinyURL. Opening an updated link for the same trip updates it in place (no duplicates)
- **Export** — print-ready PDF or PNG image of the trip summary
- **Multiple trips** — switch between trips, all persisted locally
- **Dark mode**, installable **PWA**, works offline

## How to use

1. **Add people** — on the Expenses tab, type each person's name and press Enter.
2. **Add expenses** — click "+ Add expense", fill in what it was, the amount and currency, who paid, and how to split it (Equal or Custom). Category, date, and notes are optional. Or tap "📷 Scan receipt" to start an expense with the amount pre-filled from a photo.
3. **Check the summary** — the Summary tab shows total spent, per-person balances, category breakdown, and exactly who should pay whom.
4. **Settle up** — as people pay each other back, tick off the transfers. Editing any amount resets the settled marks, since the math changed.
5. **Share** — hit "Share trip", copy the link (or shorten it), and send it to your friends. Opening the link loads the full trip into their browser.
6. **Export** — from the Summary tab, save the trip as a PDF or PNG to keep or post in the group chat.

## Privacy

- **No accounts, no sign-up, no tracking of your expense data.** Everything you enter lives in your browser's localStorage and never touches a database.
- **Share links are self-contained.** The trip data is compressed into the URL itself — nothing is uploaded when you create a link. Anyone you send the link to gets their own independent local copy. Note that anyone with the link can read the trip data, so share it like you'd share the information itself.
- **Opening a link updates your copy.** If you already have the trip a link refers to, opening it replaces your local version with the link's version (your "paid" ticks are kept). Only open trip links from people you're actually splitting with.
- **PromptPay numbers travel with the trip.** If you save PromptPay numbers, they're included in share links so friends can pay you — only share the link within the group.
- **Link shortening is optional.** If you use "Shorten link", the full URL (including trip data) is sent to TinyURL to create the short alias.
- **Exchange rates** are fetched from exchangerate-api.com — the request contains no trip data.
- The site uses Vercel Analytics for anonymous page-view counts only.
- **Your data, your device.** Clearing browser data deletes your trips — there is no cloud backup. Use the share link or PDF export as a backup if needed.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
# Type-check
node_modules/.bin/tsc --noEmit

# Production build
npm run build
```

## Deployment

Deployed on Vercel. Push to `main` to redeploy automatically.
