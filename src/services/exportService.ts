import type { Trip } from '../models'
import { SYM, NODEC, CAT_EMOJI } from '../constants'
import { computeBalances, computeSettlements } from './settlementService'

function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function fmtCur(n: number, cur: string): string {
  const sym = SYM[cur] ?? cur
  const dec = NODEC.has(cur) ? 0 : 2
  return `${sym}${n.toFixed(dec)}`
}

function buildPrintHTML(trip: Trip): string {
  const tripTitle = trip.tripName || 'Trip Summary'

  // Reuse the same settlement math as SummaryScreen — do NOT re-derive differently here.
  const { paid, owed } = computeBalances(trip.people, trip.expenses)
  const balance: Record<string, number> = {}
  trip.people.forEach(p => { balance[p] = (paid[p] ?? 0) - (owed[p] ?? 0) })
  const settlements = computeSettlements({ ...balance })

  const totalTHB = trip.expenses.reduce((s, e) => {
    const rate = e.currency === 'THB' ? 1 : e.currencyRate
    return s + (rate && rate > 0 && parseFloat(e.amount) > 0 ? parseFloat(e.amount) / rate : 0)
  }, 0)

  const dateStr = (() => {
    if (trip.tripDateStart && trip.tripDateEnd && trip.tripDateStart !== trip.tripDateEnd)
      return `${trip.tripDateStart} – ${trip.tripDateEnd}`
    if (trip.tripDateStart) return trip.tripDateStart
    return ''
  })()

  const balRows = trip.people.map(p => {
    const net = balance[p]
    const sign  = net >  0.005 ? '+' : net < -0.005 ? '−' : ''
    const color = net >  0.005 ? '#3a7d52' : net < -0.005 ? '#b04060' : '#888'
    return `<tr>
      <td style="padding:0.5rem 0.4rem;border-bottom:1px solid #EDE7F6;font-weight:500">${esc(p)}</td>
      <td style="padding:0.5rem 0.4rem;border-bottom:1px solid #EDE7F6">฿${(paid[p] ?? 0).toFixed(2)}</td>
      <td style="padding:0.5rem 0.4rem;border-bottom:1px solid #EDE7F6">฿${(owed[p] ?? 0).toFixed(2)}</td>
      <td style="padding:0.5rem 0.4rem;border-bottom:1px solid #EDE7F6;font-weight:700;color:${color}">${sign}฿${Math.abs(net).toFixed(2)}</td>
    </tr>`
  }).join('')

  const settleRows = settlements.length === 0
    ? `<p style="background:#E8F5EE;color:#3a7d52;padding:0.8rem;border-radius:10px;font-weight:600;text-align:center;border:1px solid #B8DFC8">✓ All settled up! No transfers needed.</p>`
    : settlements.map(s => {
        const settled = trip.settledTransfers.includes(`${s.from}→${s.to}`)
        return `<div style="display:flex;align-items:center;gap:0.6rem;padding:0.6rem 0.9rem;background:${settled ? '#f5f5f5' : '#FBF3E5'};border:1px solid ${settled ? '#ddd' : '#EED9B8'};border-radius:10px;margin-bottom:0.4rem;${settled ? 'opacity:0.55' : ''}">
          <span style="font-weight:600">${esc(s.from)}</span>
          <span style="color:#9A7040">→</span>
          <span style="font-weight:600">${esc(s.to)}</span>
          <span style="margin-left:auto;font-weight:700;color:${settled ? '#888' : '#9A7040'};${settled ? 'text-decoration:line-through' : ''}">฿${s.amount.toFixed(2)}</span>
          ${settled ? '<span style="font-size:0.72rem;color:#3a7d52;font-weight:700">PAID</span>' : ''}
        </div>`
      }).join('')

  const expRows = trip.expenses.map((e, i) => {
    const sym   = SYM[e.currency] ?? e.currency
    const dec   = NODEC.has(e.currency) ? 0 : 2
    const amt   = parseFloat(e.amount) || 0
    const rate  = e.currency === 'THB' ? 1 : e.currencyRate
    const amtTHB = rate && rate > 0 ? amt / rate : null
    const splitDesc = e.splitMode === 'equal'
      ? e.splitWith.join(', ')
      : 'Custom: ' + trip.people.map(p => `${p} ${fmtCur(parseFloat(e.customAmounts[p]) || 0, e.currency)}`).join(', ')
    return `<tr>
      <td style="padding:0.45rem 0.4rem;border-bottom:1px solid #EDE7F6;color:#aaa;font-size:0.8rem">${i + 1}${e.date ? `<br><span style="font-size:0.68rem">${esc(e.date)}</span>` : ''}</td>
      <td style="padding:0.45rem 0.4rem;border-bottom:1px solid #EDE7F6;font-weight:500">${esc(e.desc || '—')}${e.category ? `<br><span style="font-size:0.68rem;color:#aaa">${esc((CAT_EMOJI[e.category] ?? '') + ' ' + e.category)}</span>` : ''}${e.notes ? `<br><span style="font-size:0.68rem;color:#aaa;font-style:italic">${esc(e.notes)}</span>` : ''}</td>
      <td style="padding:0.45rem 0.4rem;border-bottom:1px solid #EDE7F6">${sym}${amt.toFixed(dec)}${amtTHB !== null && e.currency !== 'THB' ? `<br><span style="font-size:0.7rem;color:#aaa">≈฿${amtTHB.toFixed(2)}</span>` : ''}</td>
      <td style="padding:0.45rem 0.4rem;border-bottom:1px solid #EDE7F6">${esc(e.payer || '—')}</td>
      <td style="padding:0.45rem 0.4rem;border-bottom:1px solid #EDE7F6;font-size:0.78rem;color:#8674A3">${esc(splitDesc)}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${esc(tripTitle)} — HarnKao Summary</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',system-ui,sans-serif;background:#F9F7FC;color:#2A1F3D;font-size:14px;line-height:1.6}
.page{max-width:800px;margin:0 auto;padding:2rem}
.print-header{background:linear-gradient(135deg,#7B5EA7,#A090BA);color:white;border-radius:16px;padding:1.75rem 2rem;margin-bottom:1.5rem;display:flex;justify-content:space-between;align-items:flex-start;gap:1rem}
.print-header h1{font-size:1.55rem;font-weight:700;letter-spacing:-0.02em}
.print-header .sub{font-size:0.8rem;opacity:0.78;margin-top:0.25rem}
.print-header .right{text-align:right;font-size:0.75rem;opacity:0.72;flex-shrink:0}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem}
.stat{background:white;border:1px solid #DDD3ED;border-radius:12px;padding:0.9rem;text-align:center}
.stat.accent{background:linear-gradient(135deg,#7B5EA7,#A090BA);border:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.stat-lbl{font-size:0.62rem;text-transform:uppercase;letter-spacing:0.08em;color:#B0A0C8;font-weight:600;margin-bottom:0.15rem}
.accent .stat-lbl{color:rgba(255,255,255,0.72)}
.stat-val{font-size:1.35rem;font-weight:700;color:#2A1F3D;letter-spacing:-0.02em}
.accent .stat-val{color:white}
section{background:white;border:1px solid #EDE7F6;border-radius:14px;padding:1.25rem 1.4rem;margin-bottom:1.25rem;break-inside:avoid}
.section-title{font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:#B0A0C8;font-weight:600;margin-bottom:0.9rem;padding-bottom:0.5rem;border-bottom:1px solid #EDE7F6}
table{width:100%;border-collapse:collapse}
th{font-size:0.62rem;text-transform:uppercase;letter-spacing:0.08em;color:#B0A0C8;font-weight:600;text-align:left;padding:0 0.4rem 0.45rem;border-bottom:1px solid #EDE7F6}
.no-print{text-align:center;padding:2rem 0;border-top:1px solid #EDE7F6;margin-top:1.5rem;display:flex;gap:0.75rem;justify-content:center}
.no-print button{font-family:inherit;font-size:0.88rem;font-weight:600;cursor:pointer;padding:0.65rem 1.4rem;border-radius:10px;border:none;transition:all 0.15s}
.print-btn{background:linear-gradient(135deg,#7B5EA7,#A090BA);color:white;box-shadow:0 2px 8px rgba(123,94,167,0.35)}
.close-btn{background:#F4EFFA;color:#5C4A7A;border:1.5px solid #DDD3ED !important}
.footer-note{text-align:center;font-size:0.72rem;color:#B0A0C8;margin-top:1rem;padding-top:1rem;border-top:1px solid #EDE7F6}
@media print{body{background:white}.page{padding:1rem}.print-header{border-radius:8px;-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none}}
</style>
</head>
<body>
<div class="page">
  <div class="print-header">
    <div>
      <div style="font-size:1.6rem;margin-bottom:0.35rem">🍚</div>
      <h1>${esc(tripTitle)}</h1>
      ${dateStr ? `<div class="sub">📅 ${esc(dateStr)}</div>` : ''}
      <div class="sub">HarnKao — Trip Expense Splitter</div>
    </div>
    <div class="right">
      Generated<br>${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}<br>
      ${trip.people.length} people · ${trip.expenses.length} expenses
    </div>
  </div>
  <div class="stats">
    <div class="stat accent"><div class="stat-lbl">Total Spent</div><div class="stat-val">฿${totalTHB.toFixed(2)}</div></div>
    <div class="stat"><div class="stat-lbl">Expenses</div><div class="stat-val">${trip.expenses.length}</div></div>
    <div class="stat"><div class="stat-lbl">People</div><div class="stat-val">${trip.people.length}</div></div>
  </div>
  <section>
    <div class="section-title">⚖️ Balance per person</div>
    <table><thead><tr><th>Person</th><th>Paid</th><th>Owes (share)</th><th>Net</th></tr></thead><tbody>${balRows}</tbody></table>
  </section>
  <section>
    <div class="section-title">💸 Who pays whom</div>
    ${settleRows}
  </section>
  <section>
    <div class="section-title">📋 Expense breakdown</div>
    <table><thead><tr><th>#</th><th>Item</th><th>Amount</th><th>Paid by</th><th>Split</th></tr></thead><tbody>${expRows}</tbody></table>
  </section>
  <div class="footer-note">Generated by HarnKao — หารข้าว</div>
  <div class="no-print">
    <button class="print-btn" onclick="window.print()">🖨 Print / Save as PDF</button>
    <button class="close-btn" onclick="window.close()">Close</button>
  </div>
</div>
<script>document.fonts.ready.then(()=>setTimeout(()=>window.print(),400));<\/script>
</body>
</html>`
}

export function exportPDF(trip: Trip): void {
  const html = buildPrintHTML(trip)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const win  = window.open(url, '_blank')
  if (!win) throw new Error('pop-up blocked')
  setTimeout(() => URL.revokeObjectURL(url), 120_000)
}

type Html2CanvasFn = (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>
type WinWithH2C = Window & { html2canvas?: Html2CanvasFn }

async function loadHtml2Canvas(): Promise<Html2CanvasFn> {
  const w = window as WinWithH2C
  if (w.html2canvas) return w.html2canvas
  await new Promise<void>((res, rej) => {
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
    s.onload = () => res()
    s.onerror = rej
    document.head.appendChild(s)
  })
  return (window as WinWithH2C).html2canvas!
}

export async function exportPNG(trip: Trip, summaryEl: HTMLElement): Promise<void> {
  const h2c   = await loadHtml2Canvas()
  const theme = document.documentElement.getAttribute('data-theme') ?? 'light'
  const bgVar = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#ffffff'

  const canvas = await h2c(summaryEl, {
    scale: 2,
    useCORS: true,
    backgroundColor: bgVar,
    onclone(doc: Document) {
      doc.documentElement.setAttribute('data-theme', theme)
      doc.querySelectorAll('.export-bar').forEach((el) => {
        (el as HTMLElement).style.display = 'none'
      })
    }
  })

  const link      = document.createElement('a')
  const slug      = (trip.tripName || 'trip').replace(/[^a-z0-9]/gi, '_').toLowerCase()
  link.download   = `${slug}_summary.png`
  link.href       = canvas.toDataURL('image/png')
  link.click()
}
