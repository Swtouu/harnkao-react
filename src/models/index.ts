export type SplitMode = 'equal' | 'custom'

export type Category = '' | 'Food' | 'Hotel' | 'Transport' | 'Activity' | 'Shopping' | 'Other'

export interface Expense {
  id: number
  desc: string
  notes: string
  date: string
  amount: string
  currency: string
  currencyRate: number | null
  payer: string
  splitMode: SplitMode
  splitWith: string[]
  customAmounts: Record<string, string>
  category: Category
}

export interface Trip {
  id: string
  tripName: string
  tripDateStart: string
  tripDateEnd: string
  people: string[]
  expenses: Expense[]
  settledTransfers: string[]
}

export interface TripIndex {
  id: string
  name: string
  updatedAt: number
}

export interface Settlement {
  from: string
  to: string
  amount: number
}

export interface RateCache {
  ts: number
  rates: Record<string, number>
}
