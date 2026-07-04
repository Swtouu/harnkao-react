import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Trip, TripIndex, Expense } from '../models'

function genId(): string {
  return 'trip_' + Math.random().toString(36).slice(2, 9)
}

function emptyTrip(): Trip {
  return {
    id: genId(),
    tripName: '',
    tripDateStart: '',
    tripDateEnd: '',
    people: [],
    expenses: [],
    settledTransfers: []
  }
}

const BALANCE_FIELDS = new Set<keyof Expense>(['amount', 'currency', 'currencyRate', 'payer', 'splitWith', 'customAmounts'])

interface TripStore {
  trips: TripIndex[]
  current: Trip

  createTrip: () => void
  switchTrip: (id: string) => void
  deleteTrip: (id: string) => void
  updateTripMeta: (field: 'tripName' | 'tripDateStart' | 'tripDateEnd', value: string) => void
  loadSharedTrip: (partial: Partial<Trip>) => void

  addPerson: (name: string) => void
  removePerson: (name: string) => void

  addExpense: () => void
  duplicateExpense: (id: number) => void
  removeExpense: (id: number) => void
  updateExpense: <K extends keyof Expense>(id: number, field: K, value: Expense[K]) => void
  toggleSplit: (id: number, person: string) => void
  setSplitMode: (id: number, mode: Expense['splitMode']) => void
  updateCustomAmount: (id: number, person: string, value: string) => void

  toggleSettled: (from: string, to: string) => void
  clearAllData: () => void
}

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      trips: [],
      current: emptyTrip(),

      createTrip() {
        set({ current: emptyTrip() })
      },

      switchTrip(id) {
        const raw = localStorage.getItem(`hk_trip_${id}`)
        if (raw) {
          try { set({ current: JSON.parse(raw) as Trip }) } catch { /* ignore */ }
        }
      },

      deleteTrip(id) {
        localStorage.removeItem(`hk_trip_${id}`)
        set(s => {
          const trips = s.trips.filter(t => t.id !== id)
          if (id !== s.current.id) return { trips }
          // deleted the active trip — switch to the most recent remaining one
          const latest = [...trips].sort((a, b) => b.updatedAt - a.updatedAt)[0]
          let current = emptyTrip()
          if (latest) {
            const raw = localStorage.getItem(`hk_trip_${latest.id}`)
            if (raw) { try { current = JSON.parse(raw) as Trip } catch { /* ignore */ } }
          }
          return { trips, current }
        })
      },

      updateTripMeta(field, value) {
        set(s => ({ current: { ...s.current, [field]: value } }))
      },

      loadSharedTrip(partial) {
        const t: Trip = { ...emptyTrip(), ...partial }
        // union with the local copy's PAID marks so reopening a link never loses them
        if (partial.id) {
          const raw = localStorage.getItem(`hk_trip_${partial.id}`)
          if (raw) {
            try {
              const local = JSON.parse(raw) as Trip
              t.settledTransfers = [...new Set([...t.settledTransfers, ...local.settledTransfers])]
            } catch { /* ignore */ }
          }
        }
        set({ current: t })
      },

      addPerson(name) {
        set(s => ({ current: { ...s.current, people: [...s.current.people, name] } }))
      },

      removePerson(name) {
        set(s => ({
          current: {
            ...s.current,
            people: s.current.people.filter(p => p !== name),
            expenses: s.current.expenses.map(e => ({
              ...e,
              payer: e.payer === name ? '' : e.payer,
              splitWith: e.splitWith.filter(p => p !== name)
            })),
            settledTransfers: []
          }
        }))
      },

      addExpense() {
        const { current } = get()
        const exp: Expense = {
          id: Date.now(),
          desc: '', notes: '', date: '', amount: '',
          currency: 'THB', currencyRate: 1,
          payer: current.people[0] ?? '',
          splitMode: 'equal',
          splitWith: [...current.people],
          customAmounts: {},
          category: ''
        }
        set(s => ({ current: { ...s.current, expenses: [...s.current.expenses, exp] } }))
      },

      duplicateExpense(id) {
        set(s => {
          const idx = s.current.expenses.findIndex(e => e.id === id)
          if (idx === -1) return s
          const clone: Expense = { ...s.current.expenses[idx], id: Date.now() }
          const next = [...s.current.expenses]
          next.splice(idx + 1, 0, clone)
          return { current: { ...s.current, expenses: next, settledTransfers: [] } }
        })
      },

      removeExpense(id) {
        set(s => ({
          current: {
            ...s.current,
            expenses: s.current.expenses.filter(e => e.id !== id),
            settledTransfers: []
          }
        }))
      },

      updateExpense(id, field, value) {
        set(s => ({
          current: {
            ...s.current,
            expenses: s.current.expenses.map(e => e.id === id ? { ...e, [field]: value } : e),
            settledTransfers: BALANCE_FIELDS.has(field) ? [] : s.current.settledTransfers
          }
        }))
      },

      toggleSplit(id, person) {
        set(s => ({
          current: {
            ...s.current,
            expenses: s.current.expenses.map(e => {
              if (e.id !== id) return e
              const sw = e.splitWith.includes(person)
                ? e.splitWith.filter(p => p !== person)
                : [...e.splitWith, person]
              return { ...e, splitWith: sw }
            }),
            settledTransfers: []
          }
        }))
      },

      setSplitMode(id, mode) {
        set(s => ({
          current: {
            ...s.current,
            expenses: s.current.expenses.map(e =>
              e.id === id ? { ...e, splitMode: mode, customAmounts: {} } : e
            ),
            settledTransfers: []
          }
        }))
      },

      updateCustomAmount(id, person, value) {
        set(s => ({
          current: {
            ...s.current,
            expenses: s.current.expenses.map(e =>
              e.id === id
                ? { ...e, customAmounts: { ...e.customAmounts, [person]: value } }
                : e
            ),
            settledTransfers: []
          }
        }))
      },

      clearAllData() {
        Object.keys(localStorage)
          .filter(k => k.startsWith('hk_trip_'))
          .forEach(k => localStorage.removeItem(k))
        set({ trips: [], current: emptyTrip() })
      },

      toggleSettled(from, to) {
        const key = `${from}→${to}`
        set(s => {
          const next = s.current.settledTransfers.includes(key)
            ? s.current.settledTransfers.filter(k => k !== key)
            : [...s.current.settledTransfers, key]
          return { current: { ...s.current, settledTransfers: next } }
        })
      }
    }),
    {
      name: 'hk_store',
      partialize: s => ({ trips: s.trips, current: s.current })
    }
  )
)

// Persist current to hk_trip_{id} and upsert its index entry on every change
useTripStore.subscribe((s, prev) => {
  if (s.current === prev.current || !s.current.id) return
  localStorage.setItem(`hk_trip_${s.current.id}`, JSON.stringify(s.current))
  const entry: TripIndex = { id: s.current.id, name: s.current.tripName, updatedAt: Date.now() }
  useTripStore.setState(st => {
    const i = st.trips.findIndex(t => t.id === entry.id)
    if (i === -1) return { trips: [entry, ...st.trips] }
    const trips = [...st.trips]
    trips[i] = entry
    return { trips }
  })
})
