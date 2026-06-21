import { useState } from 'react'
import { useTripStore } from '../store/tripStore'
import { useCurrencyStore } from '../store/currencyStore'
import { CURRENCIES } from '../constants'
import TripsModal from './TripsModal'

interface Props {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export default function AppHeader({ theme, onToggleTheme }: Props) {
  const [tripsOpen, setTripsOpen] = useState(false)

  const tripName      = useTripStore(s => s.current.tripName)
  const tripDateStart = useTripStore(s => s.current.tripDateStart)
  const tripDateEnd   = useTripStore(s => s.current.tripDateEnd)
  const updateTripMeta = useTripStore(s => s.updateTripMeta)

  const displayCurrency   = useCurrencyStore(s => s.displayCurrency)
  const setDisplayCurrency = useCurrencyStore(s => s.setDisplayCurrency)

  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          <div className="header-top">
            <div className="logo-block">
              <div className="logo-icon">
                <img src="/Harnkao.png" alt="HarnKao" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
              <div className="logo-text">
                <h1>HarnKao</h1>
                <p>หารข้าว — Trip Expense Splitter</p>
              </div>
            </div>

            <div className="header-actions">
              <div className="currency-pill">
                <select
                  value={displayCurrency}
                  onChange={e => setDisplayCurrency(e.target.value)}
                  title="Display currency"
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <button
                className="theme-toggle"
                onClick={onToggleTheme}
                title="Toggle theme"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>

              <button
                className="btn-trips"
                onClick={() => setTripsOpen(true)}
                title="My Trips"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                My Trips
              </button>
            </div>
          </div>

          <div className="header-trip-meta">
            <input
              className="trip-name-input"
              type="text"
              placeholder="Trip name…"
              maxLength={60}
              value={tripName}
              onChange={e => updateTripMeta('tripName', e.target.value)}
            />
            <div className="trip-dates-row">
              <input
                className="trip-date-input"
                type="date"
                value={tripDateStart}
                onChange={e => updateTripMeta('tripDateStart', e.target.value)}
              />
              <span className="trip-date-sep">→</span>
              <input
                className="trip-date-input"
                type="date"
                value={tripDateEnd}
                onChange={e => updateTripMeta('tripDateEnd', e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      {tripsOpen && <TripsModal onClose={() => setTripsOpen(false)} />}
    </>
  )
}
