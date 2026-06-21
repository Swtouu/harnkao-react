import type { Expense, Settlement } from '../models'

export function computeBalances(
  people: string[],
  expenses: Expense[]
): { paid: Record<string, number>; owed: Record<string, number> } {
  const paid: Record<string, number> = {}
  const owed: Record<string, number> = {}
  people.forEach(p => { paid[p] = 0; owed[p] = 0 })

  const valid = expenses.filter(
    e => e.payer && people.includes(e.payer) && parseFloat(e.amount) > 0
  )

  valid.forEach(e => {
    const rate = e.currency === 'THB' ? 1 : e.currencyRate
    if (!rate || rate <= 0) return
    const amtTHB = parseFloat(e.amount) / rate
    paid[e.payer] += amtTHB

    if (e.splitMode === 'equal') {
      const members = e.splitWith.filter(p => people.includes(p))
      if (members.length > 0) {
        const share = amtTHB / members.length
        members.forEach(p => { owed[p] += share })
      }
    } else {
      people.forEach(p => {
        const personTHB = (parseFloat(e.customAmounts[p]) || 0) / rate
        owed[p] += personTHB
      })
    }
  })

  return { paid, owed }
}

export function computeSettlements(balance: Record<string, number>): Settlement[] {
  const cred: { name: string; amt: number }[] = []
  const debt: { name: string; amt: number }[] = []

  Object.entries(balance).forEach(([name, amt]) => {
    if (amt > 0.005)  cred.push({ name, amt })
    if (amt < -0.005) debt.push({ name, amt: -amt })
  })

  cred.sort((a, b) => b.amt - a.amt)
  debt.sort((a, b) => b.amt - a.amt)

  const result: Settlement[] = []
  let ci = 0, di = 0

  while (ci < cred.length && di < debt.length) {
    const c = cred[ci], d = debt[di]
    const t = Math.min(c.amt, d.amt)
    result.push({ from: d.name, to: c.name, amount: t })
    c.amt -= t; d.amt -= t
    if (c.amt < 0.005) ci++
    if (d.amt < 0.005) di++
  }

  return result
}
