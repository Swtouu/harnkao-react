import { OFFLINE_RATES, NODEC, SYM } from '../constants'
import type { RateCache } from '../models'

const STORAGE_KEY = 'hk_rates'
const TTL = 3_600_000

export type RateSource = 'live' | 'cache' | 'offline'

export interface RateResult {
  rates: Record<string, number>
  source: RateSource
  ageMinutes: number
}

export async function fetchRates(): Promise<RateResult> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const c: RateCache = JSON.parse(raw)
      if (Date.now() - c.ts < TTL)
        return { rates: c.rates, source: 'cache', ageMinutes: Math.round((Date.now() - c.ts) / 60000) }
    }
  } catch { /* ignore */ }

  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/THB')
    if (!res.ok) throw new Error()
    const data = await res.json() as { rates: Record<string, number> }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now(), rates: data.rates })) } catch { /* ignore */ }
    return { rates: data.rates, source: 'live', ageMinutes: 0 }
  } catch { /* fallthrough */ }

  return { rates: OFFLINE_RATES, source: 'offline', ageMinutes: 0 }
}

export function formatTHB(
  thb: number,
  displayCurrency: string,
  rates: Record<string, number>
): { primary: string; secondary: string | null } {
  if (displayCurrency === 'THB' || !rates[displayCurrency])
    return { primary: `฿${thb.toFixed(2)}`, secondary: null }
  const converted = thb * rates[displayCurrency]
  const sym = SYM[displayCurrency] ?? displayCurrency
  const dec = NODEC.has(displayCurrency) ? 0 : 2
  return { primary: `฿${thb.toFixed(2)}`, secondary: `${sym}${converted.toFixed(dec)}` }
}
