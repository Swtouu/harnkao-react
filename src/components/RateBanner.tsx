import { useCurrencyStore } from '../store/currencyStore'
import { SYM, NODEC } from '../constants'

export default function RateBanner() {
  const { displayCurrency, rates, source, ageMinutes } = useCurrencyStore()

  const rate = rates[displayCurrency]
  const sym  = SYM[displayCurrency] ?? displayCurrency
  const dec  = NODEC.has(displayCurrency) ? 0 : 4

  const dotClass =
    source === 'live'  ? 'dot dot-live'  :
    source === 'cache' ? 'dot dot-cache' :
                         'dot dot-off'

  const statusText =
    source === 'live'  ? 'Live'                        :
    source === 'cache' ? `Cached · ${ageMinutes}m ago` :
                         'Offline estimate'

  return (
    <div className="rate-banner">
      <span className={dotClass} />
      {rate
        ? <span>฿1 = {sym}{rate.toFixed(dec)}</span>
        : <span>Rate unavailable</span>
      }
      <span className="rate-status">{statusText}</span>
    </div>
  )
}
