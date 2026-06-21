import { useEffect, useState } from 'react'
import TripScreen from './screens/TripScreen'
import SummaryScreen from './screens/SummaryScreen'
import AppHeader from './components/AppHeader'
import RateBanner from './components/RateBanner'
import Toast from './components/Toast'
import ShareModal from './components/ShareModal'
import { useTripStore } from './store/tripStore'
import { useCurrencyStore } from './store/currencyStore'
import { useExchangeRates } from './hooks/useExchangeRates'
import { decodeTrip } from './services/shareService'

type Tab = 'expenses' | 'summary'

export default function App() {
  const [tab, setTab]         = useState<Tab>('expenses')
  const [shareOpen, setShareOpen] = useState(false)
  const [theme, setTheme]     = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('hk_theme') as 'light' | 'dark') ?? 'light'
  })

  const loadSharedTrip    = useTripStore(s => s.loadSharedTrip)
  const displayCurrency   = useCurrencyStore(s => s.displayCurrency)
  useExchangeRates()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('hk_theme', next)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const d = params.get('d')
    if (d) {
      decodeTrip(d)
        .then(partial => {
          loadSharedTrip(partial)
          window.history.replaceState({}, '', '/')
        })
        .catch(() => {})
    }
  }, [loadSharedTrip])

  return (
    <div className="app">
      <div className="sticky-shell">
        <AppHeader
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <nav className="tab-bar">
        <button
          className={tab === 'expenses' ? 'active' : ''}
          onClick={() => setTab('expenses')}
        >
          Expenses
        </button>
        <button
          className={tab === 'summary' ? 'active' : ''}
          onClick={() => setTab('summary')}
        >
          Summary
        </button>
      </nav>
      </div>

      <main className="app-main">
        {displayCurrency !== 'THB' && <RateBanner />}
        {tab === 'expenses' ? <TripScreen /> : <SummaryScreen />}
      </main>

      <button className="share-fab" onClick={() => setShareOpen(true)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        Share trip
      </button>

      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}

      <Toast />
    </div>
  )
}
