import { useTripStore } from '../store/tripStore'
import ExpenseCard from '../components/ExpenseCard'
import PersonList from '../components/PersonList'

export default function TripScreen() {
  const current    = useTripStore(s => s.current)
  const addExpense = useTripStore(s => s.addExpense)

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
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.75rem' }}>
            <button className="btn btn-soft" onClick={addExpense}>
              + Add expense
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
