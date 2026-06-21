import type { Trip, Expense } from '../models'

interface TripPayload {
  p: string[]
  e: Array<{
    d: string; a: string; dt: string; cur: string; cr: number | null
    py: string; sm: string; sw: string[]; ca: Record<string, string>; cat: string
  }>
  tn: string; ts: string; te: string
}

function toPayload(trip: Trip): TripPayload {
  return {
    p: trip.people,
    e: trip.expenses.map(e => ({
      d: e.desc, a: e.amount, dt: e.date, cur: e.currency,
      cr: e.currencyRate, py: e.payer, sm: e.splitMode,
      sw: e.splitWith, ca: e.customAmounts, cat: e.category ?? ''
    })),
    tn: trip.tripName, ts: trip.tripDateStart, te: trip.tripDateEnd
  }
}

export async function encodeTrip(trip: Trip): Promise<string> {
  const json = JSON.stringify(toPayload(trip))
  const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'))
  const buf = await new Response(stream).arrayBuffer()
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 8192)
    bin += String.fromCharCode(...bytes.subarray(i, i + 8192))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function decodeTrip(b64: string): Promise<Partial<Trip>> {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0))
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
  const r: TripPayload = JSON.parse(await new Response(stream).text())

  return {
    people: r.p ?? [],
    expenses: (r.e ?? []).map((x, i): Expense => ({
      id: Date.now() + i,
      desc: x.d ?? '', date: x.dt ?? '', amount: x.a ?? '',
      currency: x.cur ?? 'THB', currencyRate: x.cr ?? null,
      payer: x.py ?? '', splitMode: (x.sm as Expense['splitMode']) ?? 'equal',
      splitWith: x.sw ?? [], customAmounts: x.ca ?? {},
      category: (x.cat as Expense['category']) ?? ''
    })),
    tripName: r.tn ?? '', tripDateStart: r.ts ?? '', tripDateEnd: r.te ?? ''
  }
}

export async function shortenUrl(url: string): Promise<string> {
  const res = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`)
  const data = await res.json() as { shorturl?: string }
  if (!data.shorturl) throw new Error('no shorturl')
  return data.shorturl
}
