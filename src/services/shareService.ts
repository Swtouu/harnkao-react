import type { Trip, Expense } from '../models'

interface TripPayload {
  i?: string
  p: string[]
  e: Array<{
    d: string; a: string; dt: string; cur: string; cr: number | null
    py: string; sm: string; sw: string[]; ca: Record<string, string>; cat: string; n?: string
  }>
  tn: string; ts: string; te: string
  st?: string[]
  pp?: Record<string, string>
}

function toPayload(trip: Trip): TripPayload {
  return {
    i: trip.id,
    p: trip.people,
    ...(trip.settledTransfers.length ? { st: trip.settledTransfers } : {}),
    ...(Object.keys(trip.promptPay ?? {}).length ? { pp: trip.promptPay } : {}),
    e: trip.expenses.map(e => ({
      d: e.desc, a: e.amount, dt: e.date, cur: e.currency,
      cr: e.currencyRate, py: e.payer, sm: e.splitMode,
      sw: e.splitWith, ca: e.customAmounts, cat: e.category ?? '',
      ...(e.notes ? { n: e.notes } : {})
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

  const strings = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

  return {
    // carry the id so reopening the same link updates the trip instead of duplicating it
    ...(typeof r.i === 'string' && r.i ? { id: r.i } : {}),
    people: strings(r.p),
    expenses: (Array.isArray(r.e) ? r.e : []).map((x, i): Expense => ({
      id: Date.now() + i,
      desc: x.d ?? '', date: x.dt ?? '', amount: x.a ?? '',
      currency: x.cur ?? 'THB', currencyRate: typeof x.cr === 'number' ? x.cr : null,
      payer: x.py ?? '', splitMode: (x.sm as Expense['splitMode']) ?? 'equal',
      splitWith: strings(x.sw),
      customAmounts: x.ca && typeof x.ca === 'object' ? x.ca : {},
      category: (x.cat as Expense['category']) ?? '', notes: x.n ?? ''
    })),
    tripName: r.tn ?? '', tripDateStart: r.ts ?? '', tripDateEnd: r.te ?? '',
    settledTransfers: strings(r.st),
    promptPay: r.pp && typeof r.pp === 'object' && !Array.isArray(r.pp) ? r.pp : {}
  }
}

