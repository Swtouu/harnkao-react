# HarnKao — หารข้าว

Trip expense splitter for groups. Track who paid what, split costs equally or with custom amounts per person, and calculate the minimum transfers needed to settle up.

No account required. All data stays in your browser.

## Features

- Add people and expenses to a trip
- Split each expense equally or with custom amounts per person
- Multi-currency support with live exchange rates (falls back to offline estimates)
- Settlement calculator — minimizes the number of transfers to settle all debts
- Mark individual transfers as paid
- Share a trip via a single compressed URL (no server)
- Export summary as PDF or PNG
- Dark mode
- Works offline (PWA)
- Multiple trips with local storage persistence

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
