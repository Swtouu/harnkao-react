// OCR runs fully client-side (Tesseract.js) — the receipt image never leaves the browser.
type TesseractRecognizeFn = (image: File, langs: string) => Promise<{ data: { text: string } }>
type WinWithTesseract = Window & { Tesseract?: { recognize: TesseractRecognizeFn } }

async function loadTesseract(): Promise<{ recognize: TesseractRecognizeFn }> {
  const w = window as WinWithTesseract
  if (w.Tesseract) return w.Tesseract
  await new Promise<void>((res, rej) => {
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
    s.onload = () => res()
    s.onerror = rej
    document.head.appendChild(s)
  })
  const t = (window as WinWithTesseract).Tesseract
  if (!t) throw new Error('Tesseract failed to load')
  return t
}

// Thai month abbreviations as printed on bank-app slips, e.g. "17 ก.ค. 2569" — dots are part of the token
const THAI_MONTHS: Record<string, string> = {
  'ม.ค.': '01', 'ก.พ.': '02', 'มี.ค.': '03', 'เม.ย.': '04', 'พ.ค.': '05', 'มิ.ย.': '06',
  'ก.ค.': '07', 'ส.ค.': '08', 'ก.ย.': '09', 'ต.ค.': '10', 'พ.ย.': '11', 'ธ.ค.': '12'
}
const THAI_MONTH_PATTERN = Object.keys(THAI_MONTHS).map(m => m.replace(/\./g, '\\.')).join('|')

// Merchandise-receipt wording (English/Thai) + Thai bank-transfer-slip wording, incl. bare "จำนวน"
// (bank-app slips commonly label the amount with just this word, value stacked on the line below).
// "โอนเงิน" is deliberately excluded — it also appears in unrelated status text (e.g. "โอนเงินสำเร็จ" =
// "Transfer successful"), which matches a line with no amount and misdirects the next-line fallback below.
const TOTAL_LINE = /\b(grand\s*total|total\s*due|amount\s*due|net\s*total|total\s*amount|balance\s*due|total)\b|รวม|ยอดรวม|ยอดสุทธิ|จำนวนเงิน|จำนวน|ยอดโอน|ยอดเงิน/i
const NUMBER = /\d[\d,]*\.\d{2}|\d[\d,]*/g
const DECIMAL_NUMBER = /\d[\d,]*\.\d{2}\b/g
// Trip expenses are never 9+ digit baht amounts — this bound exists solely to reject bank
// account/reference numbers (routinely 10-18 digits) from the numeric fallbacks below.
const MAX_AMOUNT_DIGITS = 9

// Every date shape parseDate() understands — used to blank out dates before amount extraction so a
// dotted/sliced date (e.g. "17.07.2569") can't be misread as a decimal amount ("17.07")
const DATE_LIKE_PATTERNS = [
  new RegExp(`\\b\\d{1,2}\\s*(?:${THAI_MONTH_PATTERN})\\s*\\d{2,4}\\b`, 'g'),
  /\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/g,
  /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/g,
  /\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/g,
  /\b[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}\b/g
]

function stripDates(text: string): string {
  return DATE_LIKE_PATTERNS.reduce(
    (acc, re) => acc.replace(re, m => ' '.repeat(m.length)),
    text
  )
}

function plausibleAmounts(matches: RegExpMatchArray | null): number[] {
  if (!matches?.length) return []
  return matches
    .filter(n => n.replace(/[,.]/g, '').length <= MAX_AMOUNT_DIGITS)
    .map(n => parseFloat(n.replace(/,/g, '')))
    .filter(n => !Number.isNaN(n))
}

function parseAmount(text: string): string | null {
  const clean = stripDates(text)
  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean)

  // Prefer the last line that reads like a total — receipts print the grand total near the bottom
  for (let i = lines.length - 1; i >= 0; i--) {
    if (TOTAL_LINE.test(lines[i])) {
      const nums = plausibleAmounts(lines[i].match(NUMBER))
      if (nums.length) return nums[nums.length - 1].toFixed(2)
      // Thai bank-slip apps often stack the label and its value on separate lines
      const nextNums = plausibleAmounts(lines[i + 1]?.match(NUMBER) ?? null)
      if (nextNums.length) return nextNums[nextNums.length - 1].toFixed(2)
    }
  }

  // Fallback: largest decimal (X.XX) figure — bank slips print account/reference numbers as bare
  // integers with no decimal point, so restricting to decimals avoids picking those over the amount
  const decimals = plausibleAmounts(clean.match(DECIMAL_NUMBER))
  if (decimals.length) return Math.max(...decimals).toFixed(2)

  // Last resort: largest number anywhere on the receipt
  const all = plausibleAmounts(clean.match(NUMBER))
  if (!all.length) return null
  return Math.max(...all).toFixed(2)
}

const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
}

function pad(n: string): string {
  return n.padStart(2, '0')
}

// Thai receipts print the Buddhist Era year (CE + 543) — BE years for 2020s-2030s fall in the 2560s-2580s
function beToCe(year: string): string {
  const y = parseInt(year, 10)
  return y >= 2400 ? String(y - 543) : year
}

function parseDate(text: string): string | null {
  // "17 ก.ค. 2569" / "17 ก.ค. 69" — Thai month abbreviation, 4-digit or 2-digit Buddhist year
  let m = text.match(new RegExp(`\\b(\\d{1,2})\\s*(${THAI_MONTH_PATTERN})\\s*(\\d{2,4})\\b`))
  if (m) {
    const mon = THAI_MONTHS[m[2]]
    const year = m[3].length === 2 ? `25${m[3]}` : m[3]
    if (mon) return `${beToCe(year)}-${mon}-${pad(m[1])}`
  }

  // YYYY-MM-DD or YYYY/MM/DD — already the app's native format
  m = text.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/)
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`

  // "12 Jan 2026" / "12 January 2026"
  m = text.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b/)
  if (m) {
    const mon = MONTHS[m[2].slice(0, 3).toLowerCase()]
    if (mon) return `${m[3]}-${mon}-${pad(m[1])}`
  }

  // "Jan 12, 2026"
  m = text.match(/\b([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(20\d{2})\b/)
  if (m) {
    const mon = MONTHS[m[1].slice(0, 3).toLowerCase()]
    if (mon) return `${m[3]}-${mon}-${pad(m[2])}`
  }

  // Day-first numeric with Buddhist year, e.g. "17/07/2569" or "17.07.2569"
  m = text.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](25\d{2})\b/)
  if (m) {
    const day = parseInt(m[1], 10)
    const mon = parseInt(m[2], 10)
    if (day >= 1 && day <= 31 && mon >= 1 && mon <= 12) {
      return `${beToCe(m[3])}-${pad(m[2])}-${pad(m[1])}`
    }
  }

  // Day-first numeric, e.g. "12/01/2026" or "12.01.2026" — most receipts outside the US print DD/MM/YYYY
  m = text.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](20\d{2})\b/)
  if (m) {
    const day = parseInt(m[1], 10)
    const mon = parseInt(m[2], 10)
    if (day >= 1 && day <= 31 && mon >= 1 && mon <= 12) {
      return `${m[3]}-${pad(m[2])}-${pad(m[1])}`
    }
  }

  return null
}

// Receipts print the merchant name as the first line, in the largest font on the page.
const BOILERPLATE_LINE = /^(tel|phone|fax|www\.|https?:|receipt|invoice|order|table|no\.?\s*\d|address|\d+$)/i
const THAI_BOILERPLATE_LINE = /^(วันที่|เวลา|เลขที่อ้างอิง|หมายเลขอ้างอิง|รหัสอ้างอิง|จำนวนเงิน|จำนวน|โอนเงิน|ยอดโอน|ยอดเงิน|รวม|ยอดรวม|ยอดสุทธิ)/

function parseMerchantName(text: string): string | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  for (const line of lines) {
    if (line.length < 2) continue
    if (BOILERPLATE_LINE.test(line)) continue
    if (THAI_BOILERPLATE_LINE.test(line)) continue
    // Thai script has no Latin letters — a Thai-only merchant/bank name must not be rejected here
    if (!/[a-zA-Z฀-๿]/.test(line)) continue
    return line
  }
  return null
}

export interface ReceiptScanResult {
  amount: string | null
  date: string | null
  merchant: string | null
}

export async function scanReceipt(file: File): Promise<ReceiptScanResult> {
  const tesseract = await loadTesseract()
  const { data: { text } } = await tesseract.recognize(file, 'eng+tha')
  return {
    amount: parseAmount(text),
    date: parseDate(text),
    merchant: parseMerchantName(text)
  }
}
