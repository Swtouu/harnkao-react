import { useRef, useState, type ChangeEvent } from 'react'
import { useTripStore } from '../store/tripStore'
import { useToastStore } from '../store/toastStore'
import ExpenseCard from '../components/ExpenseCard'
import PersonList from '../components/PersonList'
import { scanReceipt } from '../services/receiptService'

export default function TripScreen() {
  const current     = useTripStore(s => s.current)
  const addExpense   = useTripStore(s => s.addExpense)
  const showToast    = useToastStore(s => s.show)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [scanning, setScanning] = useState(false)

  async function handleReceiptFile(ev: ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    ev.target.value = ''
    if (!file) return

    setScanning(true)
    showToast('Scanning receipt…')
    try {
      const { amount, date, merchant } = await scanReceipt(file)
      addExpense({ amount: amount ?? undefined, date: date ?? undefined, desc: merchant ?? undefined })
      const found = [merchant, amount, date].filter(Boolean)
      showToast(found.length ? `Detected ${found.join(' · ')} — check it and adjust if needed` : 'Could not detect receipt details — expense added, fill it in')
    } catch {
      addExpense()
      showToast('Could not scan receipt — expense added, fill it in')
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="trip-screen">
      <div>
        <div className="section-eyebrow">People in the trip</div>
        <PersonList />
      </div>

      <div>
        <div className="section-eyebrow">Expenses</div>
        <div className="card" style={{ padding: '1rem' }}>
          <div className="expenses-section">
            {current.expenses.length === 0 ? (
              <div className="empty-state">No expenses yet — add one below.</div>
            ) : (
              current.expenses.map((expense, i) => (
                <ExpenseCard key={expense.id} expense={expense} index={i + 1} />
              ))
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleReceiptFile}
            />
            <button
              className="btn btn-soft"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
            >
              {scanning ? 'Scanning…' : '📷 Scan receipt'}
            </button>
            <button className="btn btn-soft" onClick={() => addExpense()}>
              + Add expense
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
