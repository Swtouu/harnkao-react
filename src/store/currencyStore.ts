import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchRates, type RateSource } from '../services/currencyService'
import { OFFLINE_RATES } from '../constants'

interface CurrencyStore {
  displayCurrency: string
  rates: Record<string, number>
  source: RateSource
  ageMinutes: number
  setDisplayCurrency: (currency: string) => void
  refresh: () => Promise<void>
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      displayCurrency: 'THB',
      rates: OFFLINE_RATES,
      source: 'offline' as RateSource,
      ageMinutes: 0,

      setDisplayCurrency(currency) {
        set({ displayCurrency: currency })
        get().refresh()
      },

      async refresh() {
        const result = await fetchRates()
        set({ rates: result.rates, source: result.source, ageMinutes: result.ageMinutes })
      }
    }),
    {
      name: 'hk_currency',
      partialize: s => ({ displayCurrency: s.displayCurrency })
    }
  )
)
