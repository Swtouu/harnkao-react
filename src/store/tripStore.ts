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

const BALANCE_FIELDS = new Set<keyof Expense>(['amount', 'currency', 'payer', 'splitWith', 'customAmounts'])

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
  removeExpense: (id: number) => void
  updateExpense: <K extends keyof Expense>(id: number, field: K, value: Expense[K]) => void
  toggleSplit: (id: number, person: string) => void
  setSplitMode: (id: number, mode: Expense['splitMode']) => void
  updateCustomAmount: (id: number, person: string, value: string) => void

  toggleSettled: (from: string, to: string) => void
}

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      trips: [],
      current: emptyTrip(),

      createTrip() {
        const t = emptyTrip()
        set(s => ({
          current: t,
          trips: [{ id: t.id, name: 'New trip', updatedAt: Date.now() }, ...s.trips]
        }))
      },

      switchTrip(id) {
        const raw = localStorage.getItem(`hk_trip_${id}`)
        if (raw) {
          try { set({ current: JSON.parse(raw) as Trip }) } catch { /* ignore */ }
        }
      },

      deleteTrip(id) {
        localStorage.removeItem(`hk_trip_${id}`)
        set(s => ({ trips: s.trips.filter(t => t.id !== id) }))
      },

      updateTripMeta(field, value) {
        set(s => ({ current: { ...s.current, [field]: value } }))
      },

      loadSharedTrip(partial) {
        const t: Trip = { ...emptyTrip(), ...partial }
        set(s => ({
          current: t,
          trips: [{ id: t.id, name: t.tripName || 'Shared trip', updatedAt: Date.now() }, ...s.trips]
        }))
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
          desc: '', date: '', amount: '',
          currency: 'THB', currencyRate: 1,
          payer: current.people[0] ?? '',
          splitMode: 'equal',
          splitWith: [...current.people],
          customAmounts: {},
          category: ''
        }
        set(s => ({ current: { ...s.current, expenses: [...s.current.expenses, exp] } }))
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
