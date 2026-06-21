import { useMemo, useRef } from 'react'
import { useTripStore } from '../store/tripStore'
import { useCurrencyStore } from '../store/currencyStore'
import { useToastStore } from '../store/toastStore'
import { computeBalances, computeSettlements } from '../services/settlementService'
import { formatTHB } from '../services/currencyService'
import { exportPDF, exportPNG } from '../services/exportService'
import { CAT_EMOJI, AVATAR_CLASSES } from '../constants'
import SettlementList from '../components/SettlementList'

export default function SummaryScreen() {
  const current  = useTripStore(s => s.current)
  const { displayCurrency, rates } = useCurrencyStore()
  const showToast = useToastStore(s => s.show)
  const summaryRef = useRef<HTMLDivElement>(null)

  const { paid, owed, settlements, totalTHB, catTotals, rateWarnings } = useMemo(() => {
    const { paid, owed } = computeBalances(current.people, current.expenses)

    const balance: Record<string, number> = {}
    current.people.forEach(p => { balance[p] = (paid[p] ?? 0) - (owed[p] ?? 0) })
    const settlements = computeSettlements(balance)

    let totalTHB = 0
    const catTotals: Record<string, number> = {}
    const rateWarnings: string[] = []

    current.expenses.forEach((e, i) => {
      const rate = e.currency === 'THB' ? 1 : e.currencyRate
      if (!rate || rate <= 0) { rateWarnings.push(e.desc || `#${i + 1}`); return }
      const amtTHB = parseFloat(e.amount) / rate
      totalTHB += amtTHB
      if (e.category) catTotals[e.category] = (catTotals[e.category] ?? 0) + amtTHB
    })

    return { paid, owed, settlements, totalTHB, catTotals, rateWarnings }
  }, [current.people, current.expenses])

  const totalFmt = formatTHB(totalTHB, displayCurrency, rates)
  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1])
  const maxCat = sortedCats[0]?.[1] ?? 1

  function handleExportPDF() {
    try {
      exportPDF(current)
    } catch {
      showToast('Allow pop-ups to export PDF.')
    }
  }

  async function handleExportPNG() {
    if (!summaryRef.current) return
    showToast('Preparing PNG…')
    try {
      await exportPNG(current, summaryRef.current)
      showToast('PNG downloaded!')
    } catch {
      showToast('PNG failed — try PDF instead.')
    }
  }

  return (
    <div className="summary-screen" ref={summaryRef}>
      {rateWarnings.length > 0 && (
        <div className="warn-banner">
          ⚠️ Exchange rate unavailable for: {rateWarnings.join(', ')}. Excluded from settlement.
        </div>
      )}

      <div className="card">
        <div className="export-bar">
          <span className="export-bar-label">Export</span>
          <button className="btn btn-soft btn-xs" onClick={handleExportPDF}>🖨 PDF</button>
          <button className="btn btn-soft btn-xs" onClick={handleExportPNG}>🖼 PNG</button>
        </div>

        <div className="stat-grid" style={{ marginBottom: '1.1rem' }}>
          <div className="stat-card accent-stat">
            <div className="stat-label">Total spent</div>
            <div className="stat-value">{totalFmt.primary}</div>
            {totalFmt.secondary && <div className="stat-converted">{totalFmt.secondary}</div>}
          </div>
          <div className="stat-card">
            <div className="stat-label">Expenses</div>
            <div className="stat-value">{current.expenses.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">People</div>
            <div className="stat-value">{current.people.length}</div>
          </div>
        </div>

        <div className="section-eyebrow">Who pays whom</div>
        <SettlementList settlements={settlements} />

        {sortedCats.length > 0 && (
          <>
            <div className="section-eyebrow" style={{ marginTop: '1.1rem' }}>By category</div>
            <div className="cat-breakdown">
              {sortedCats.map(([cat, amt]) => {
                const f = formatTHB(amt, displayCurrency, rates)
                const pct = Math.round((amt / maxCat) * 100)
                return (
                  <div key={cat} className="cat-bar-row">
                    <span className="cat-bar-label">{CAT_EMOJI[cat]} {cat}</span>
                    <div className="cat-bar-track">
                      <div className="cat-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="cat-bar-amt">{f.primary}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div className="section-eyebrow" style={{ marginTop: '1.1rem' }}>Per person</div>
        <table className="balance-table">
          <thead>
            <tr><th>Person</th><th>Paid</th><th>Owes</th><th>Net</th></tr>
          </thead>
          <tbody>
            {current.people.map((p, i) => {
              const net = (paid[p] ?? 0) - (owed[p] ?? 0)
              return (
                <tr key={p}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span
                        className={`avatar ${AVATAR_CLASSES[i % AVATAR_CLASSES.length]}`}
                        style={{ width: 22, height: 22, fontSize: '0.6rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 700, flexShrink: 0 }}
                      >
                        {p.trim().slice(0, 2).toUpperCase()}
                      </span>
                      <span style={{ fontWeight: 500 }}>{p}</span>
                    </div>
                  </td>
                  <td>{formatTHB(paid[p] ?? 0, displayCurrency, rates).primary}</td>
                  <td>{formatTHB(owed[p] ?? 0, displayCurrency, rates).primary}</td>
                  <td style={{ color: net >= 0 ? 'var(--positive)' : 'var(--negative)', fontWeight: 700 }}>
                    {net >= 0 ? '+' : ''}{formatTHB(Math.abs(net), displayCurrency, rates).primary}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
