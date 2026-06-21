export const SYM: Record<string, string> = {
  THB: '฿', USD: '$',   EUR: '€', GBP: '£',
  JPY: '¥', CNY: '¥',  SGD: 'S$', KRW: '₩',
  AUD: 'A$', HKD: 'HK$', MYR: 'RM', INR: '₹'
}

export const NODEC = new Set(['JPY', 'KRW'])

export const CURRENCIES = ['THB','USD','EUR','GBP','JPY','CNY','SGD','KRW','AUD','HKD','MYR','INR']

export const CATEGORIES = ['Food','Hotel','Transport','Activity','Shopping','Other'] as const

export const CAT_EMOJI: Record<string, string> = {
  Food: '🍽', Hotel: '🏨', Transport: '🚗',
  Activity: '🎡', Shopping: '🛍', Other: '📦'
}

export const AVATAR_CLASSES = ['av0','av1','av2','av3','av4','av5','av6','av7']

export const OFFLINE_RATES: Record<string, number> = {
  USD: 0.0278, EUR: 0.0256, GBP: 0.0219, JPY: 4.19,  CNY: 0.201,
  SGD: 0.0372, KRW: 38.3,  AUD: 0.0431, HKD: 0.217,  MYR: 0.128,
  INR: 2.32,   THB: 1
}
