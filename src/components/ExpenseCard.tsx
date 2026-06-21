import { useTripStore } from '../store/tripStore'
import { useCurrencyStore } from '../store/currencyStore'
import { CURRENCIES, CATEGORIES, CAT_EMOJI, SYM, NODEC, AVATAR_CLASSES } from '../constants'
import { formatTHB } from '../services/currencyService'
import DatePicker from './DatePicker'
import type { Expense } from '../models'

interface Props {
  expense: Expense
  index: number
}

function ExpenseFooter({ e, people }: { e: Expense; people: string[] }) {
  const { displayCurrency, rates } = useCurrencyStore()
  const amt  = parseFloat(e.amount)
  const rate = e.currency === 'THB' ? 1 : e.currencyRate

  if (!rate || rate <= 0 || !amt || amt <= 0) {
    return null
  }

  const amtTHB = amt / rate

  if (e.splitMode === 'equal') {
    const members = e.splitWith.filter(p => people.includes(p))
    if (members.length === 0) return null

    const perTHB = amtTHB / members.length
    const fmt = formatTHB(perTHB, displayCurrency, rates)

    return (
      <div className="expense-footer">
        <div className="footer-amounts">
          <span>
            {e.currency !== 'THB'
              ? `${SYM[e.currency] ?? e.currency}${amt.toFixed(NODEC.has(e.currency) ? 0 : 2)} ÷ ${members.length}`
              : `฿${amt.toFixed(2)} ÷ ${members.length}`
            }
          </span>
          <span className="per-person-pill">{fmt.primary} / person</span>
          {fmt.secondary && (
            <span className="per-person-converted">{fmt.secondary}</span>
          )}
        </div>
      </div>
    )
  }

  // Custom split: show running total vs expense amount
  const customTotal = people.reduce((sum, p) => {
    return sum + (parseFloat(e.customAmounts[p]) || 0)
  }, 0)
  const customTotalTHB = customTotal / rate
  const diff = customTotal - amt
  const isMatch = Math.abs(diff) < 0.005
  const sym = SYM[e.currency] ?? e.currency
  const dec = NODEC.has(e.currency) ? 0 : 2

  return (
    <div className="expense-footer">
      <div className="custom-total-bar">
        <span className={isMatch ? 'total-match' : 'total-mismatch'}>
          {isMatch ? '✓ Balanced' : `${sym}${customTotal.toFixed(dec)}`}
        </span>
        {!isMatch && (
          <span className="total-diff">
            {diff > 0 ? '+' : '−'}{sym}{Math.abs(diff).toFixed(dec)} {diff > 0 ? 'over' : 'under'}
          </span>
        )}
        {isMatch && displayCurrency !== 'THB' && rates[displayCurrency] && (
          <span className="per-person-converted">
            {formatTHB(customTotalTHB, displayCurrency, rates).secondary}
          </span>
        )}
      </div>
    </div>
  )
}

export default function ExpenseCard({ expense: e, index }: Props) {
  const current            = useTripStore(s => s.current)
  const updateExpense      = useTripStore(s => s.updateExpense)
  const removeExpense      = useTripStore(s => s.removeExpense)
  const toggleSplit        = useTripStore(s => s.toggleSplit)
  const setSplitMode       = useTripStore(s => s.setSplitMode)
  const updateCustomAmount = useTripStore(s => s.updateCustomAmount)

  return (
    <div className="expense-card">
      <div className="expense-header">
        <span className="expense-index">{index}</span>

        <div className="expense-fields">
          <input
            className="field-desc"
            type="text"
            placeholder="What was it?"
            value={e.desc}
            onChange={ev => updateExpense(e.id, 'desc', ev.target.value)}
          />

          <select
            className="field-category"
            value={e.category}
            onChange={ev => updateExpense(e.id, 'category', ev.target.value as Expense['category'])}
          >
            <option value="">— Category —</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{CAT_EMOJI[c]} {c}</option>
            ))}
          </select>

          <div className="amount-cur-wrap">
            <input
              className="field-amount"
              type="number"
              placeholder="Amount"
              value={e.amount}
              onChange={ev => updateExpense(e.id, 'amount', ev.target.value)}
            />
            <select
              className="field-currency"
              value={e.currency}
              onChange={ev => updateExpense(e.id, 'currency', ev.target.value)}
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <DatePicker
            value={e.date}
            onChange={v => updateExpense(e.id, 'date', v)}
            placeholder="Date"
            className="field-date"
          />

          <div className="payer-wrap">
            <span className="payer-lbl">Paid by</span>
            <select
              className="field-payer"
              value={e.payer}
              title="Who paid for this expense"
              onChange={ev => updateExpense(e.id, 'payer', ev.target.value)}
            >
              <option value="">— Select —</option>
              {current.people.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <button
          className="btn btn-danger btn-icon"
          onClick={() => removeExpense(e.id)}
          title="Delete expense"
          aria-label="Delete expense"
        >✕</button>
      </div>

      <div className="split-section">
        <div className="split-mode-row">
          <span className="split-label">Split</span>
          <button
            className={`split-mode-btn${e.splitMode === 'equal' ? ' active' : ''}`}
            onClick={() => setSplitMode(e.id, 'equal')}
          >= Equal</button>
          <button
            className={`split-mode-btn${e.splitMode === 'custom' ? ' active' : ''}`}
            onClick={() => setSplitMode(e.id, 'custom')}
          >$ Custom</button>
        </div>

        {current.people.length === 0 ? (
          <span className="hint">Add people first</span>
        ) : e.splitMode === 'equal' ? (
          <div className="split-people">
            {current.people.map((p, i) => (
              <button
                key={p}
                className={`split-toggle${e.splitWith.includes(p) ? ' active' : ''}`}
                onClick={() => toggleSplit(e.id, p)}
              >
                <span className={`avatar ${AVATAR_CLASSES[i % AVATAR_CLASSES.length]}`} style={{ width: 16, height: 16, fontSize: '0.55rem' }}>
                  {p.trim().slice(0, 2).toUpperCase()}
                </span>
                {p}
              </button>
            ))}
          </div>
        ) : (
          <div className="custom-amounts-grid">
            {current.people.map((p, i) => (
              <div key={p} className="custom-amount-row">
                <span className="person-cell">
                  <span className={`avatar ${AVATAR_CLASSES[i % AVATAR_CLASSES.length]}`} style={{ width: 18, height: 18, fontSize: '0.58rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0 }}>
                    {p.trim().slice(0, 2).toUpperCase()}
                  </span>
                  {p}
                </span>
                <input
                  className="custom-amount-input"
                  type="number"
                  placeholder="0"
                  value={e.customAmounts[p] ?? ''}
                  onChange={ev => updateCustomAmount(e.id, p, ev.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <ExpenseFooter e={e} people={current.people} />
    </div>
  )
}
