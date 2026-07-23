import { useMemo } from 'react'
import { useTripStore } from '../store/tripStore'
import { useCurrencyStore } from '../store/currencyStore'
import { computePairwiseLedger } from '../services/settlementService'
import { formatTHB } from '../services/currencyService'
import type { Settlement } from '../models'

function LedgerTable({ rows, emptyLabel }: { rows: Settlement[]; emptyLabel: string }) {
  const { displayCurrency, rates } = useCurrencyStore()

  if (!rows.length) {
    return <div className="empty-state">{emptyLabel}</div>
  }

  return (
    <ul className="ledger-list">
      {rows.map(r => {
        const fmt = formatTHB(r.amount, displayCurrency, rates)
        return (
          <li key={`${r.from}→${r.to}`} className="ledger-row">
            <span className="from">{r.from}</span>
            <span className="arrow">→</span>
            <span className="to">{r.to}</span>
            <span className="amount">{fmt.primary}</span>
          </li>
        )
      })}
    </ul>
  )
}

export default function LedgerScreen() {
  const current = useTripStore(s => s.current)

  const { raw, net } = useMemo(
    () => computePairwiseLedger(current.people, current.expenses),
    [current.people, current.expenses]
  )

  return (
    <div className="ledger-screen">
      <div className="card">
        <div className="hint">
          Reference only — shows the underlying per-pair debt, not a payment plan.
          For the minimum transfers to actually pay, use the Summary tab.
        </div>

        <div className="section-eyebrow" style={{ marginTop: '0.9rem' }}>Pairwise totals</div>
        <div className="hint">Every direct debt from one person to another, expense by expense.</div>
        <LedgerTable rows={raw} emptyLabel="No expenses yet." />

        <div className="section-eyebrow" style={{ marginTop: '1.1rem' }}>Net pairwise</div>
        <div className="hint">Each pair collapsed to one direction (what A and B owe each other, netted).</div>
        <LedgerTable rows={net} emptyLabel="Nobody owes anybody." />
      </div>
    </div>
  )
}
