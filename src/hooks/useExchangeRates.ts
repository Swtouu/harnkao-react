import { useEffect } from 'react'
import { useCurrencyStore } from '../store/currencyStore'

export function useExchangeRates() {
  const { displayCurrency, refresh } = useCurrencyStore()

  useEffect(() => {
    if (displayCurrency !== 'THB') refresh()
  }, [displayCurrency, refresh])
}
