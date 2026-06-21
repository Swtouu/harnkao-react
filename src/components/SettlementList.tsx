import { useTripStore } from '../store/tripStore'
import { useCurrencyStore } from '../store/currencyStore'
import { formatTHB } from '../services/currencyService'
import type { Settlement } from '../models'

interface Props {
  settlements: Settlement[]
}

export default function SettlementList({ settlements }: Props) {
  const current = useTripStore(s => s.current)
  const toggleSettled = useTripStore(s => s.toggleSettled)
  const { displayCurrency, rates } = useCurrencyStore()

  if (!settlements.length) {
    return <div className="empty-state">All settled up! 🎉</div>
  }

  return (
    <ul className="settlement-list">
      {settlements.map(s => {
        const key = `${s.from}→${s.to}`
        const settled = current.settledTransfers.includes(key)
        const fmt = formatTHB(s.amount, displayCurrency, rates)
        return (
          <li key={key} className={`settlement-row ${settled ? 'settled' : ''}`}>
            <span className="from">{s.from}</span>
            <span className="arrow">→</span>
            <span className="to">{s.to}</span>
            <span className="amount">{fmt.primary}</span>
            <button
              className={`btn btn-xs ${settled ? 'btn-settled' : 'btn-soft'}`}
              onClick={() => toggleSettled(s.from, s.to)}
            >
              {settled ? '✓ Paid' : 'Mark paid'}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
