import { useState, useEffect, useRef } from 'react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa']

interface Props {
  value: string             // YYYY-MM-DD or ''
  onChange: (v: string) => void
  placeholder?: string
  className?: string        // applied to the trigger button (e.g. 'trip-date-input')
  alignRight?: boolean      // open popover aligned to right edge instead of left
}

type View = 'days' | 'months' | 'years'

function parseYMD(s: string): { y: number; m: number; d: number } | null {
  if (!s) return null
  const parts = s.split('-').map(Number)
  if (parts.length !== 3 || parts.some(n => isNaN(n) || n === 0)) return null
  const [y, m, d] = parts
  return { y, m, d }
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

export default function DatePicker({ value, onChange, placeholder = 'Date', className, alignRight }: Props) {
  const parsed    = parseYMD(value)
  const today     = new Date()
  const todayY    = today.getFullYear()
  const todayM    = today.getMonth() + 1
  const todayDay  = today.getDate()

  const [open,   setOpen]   = useState(false)
  const [view,   setView]   = useState<View>('days')
  const [cursor, setCursor] = useState({ y: parsed?.y ?? todayY, m: parsed?.m ?? todayM })
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) close()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function close() { setOpen(false); setView('days') }

  function toggle() {
    if (open) { close(); return }
    const p = parseYMD(value)
    setCursor({ y: p?.y ?? todayY, m: p?.m ?? todayM })
    setView('days')
    setOpen(true)
  }

  function pickDay(d: number) {
    onChange(toISO(cursor.y, cursor.m, d))
    close()
  }

  function prevMonth() {
    setCursor(c => c.m === 1  ? { y: c.y - 1, m: 12 } : { ...c, m: c.m - 1 })
  }
  function nextMonth() {
    setCursor(c => c.m === 12 ? { y: c.y + 1, m: 1  } : { ...c, m: c.m + 1 })
  }

  const firstDow    = new Date(cursor.y, cursor.m - 1, 1).getDay()
  const daysInMonth = new Date(cursor.y, cursor.m, 0).getDate()
  const yearBase    = Math.floor(cursor.y / 12) * 12
  const years       = Array.from({ length: 12 }, (_, i) => yearBase + i)

  const label = parsed ? `${parsed.d} ${MONTHS[parsed.m - 1]} ${parsed.y}` : ''

  return (
    <div className="datepicker-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`datepicker-trigger${className ? ' ' + className : ''}`}
        onClick={toggle}
      >
        {label || <span className="dp-placeholder">{placeholder}</span>}
      </button>

      {open && (
        <div className={`datepicker-popover${alignRight ? ' dp-align-right' : ''}`}>

          {view === 'days' && (
            <>
              <div className="dp-header">
                <button className="dp-nav" onClick={prevMonth}>‹</button>
                <button className="dp-title" onClick={() => setView('months')}>
                  {MONTHS[cursor.m - 1]} {cursor.y}
                </button>
                <button className="dp-nav" onClick={nextMonth}>›</button>
              </div>
              <div className="dp-dow-row">
                {DAYS.map(d => <span key={d}>{d}</span>)}
              </div>
              <div className="dp-days-grid">
                {Array.from({ length: firstDow }, (_, i) => <span key={`g${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const d      = i + 1
                  const sel    = parsed?.y === cursor.y && parsed?.m === cursor.m && parsed?.d === d
                  const isToday = todayY === cursor.y && todayM === cursor.m && todayDay === d
                  return (
                    <button
                      key={d}
                      className={`dp-day${sel ? ' dp-sel' : ''}${isToday && !sel ? ' dp-today' : ''}`}
                      onClick={() => pickDay(d)}
                    >{d}</button>
                  )
                })}
              </div>
            </>
          )}

          {view === 'months' && (
            <>
              <div className="dp-header">
                <button className="dp-nav" onClick={() => setCursor(c => ({ ...c, y: c.y - 1 }))}>‹</button>
                <button className="dp-title" onClick={() => setView('years')}>{cursor.y}</button>
                <button className="dp-nav" onClick={() => setCursor(c => ({ ...c, y: c.y + 1 }))}>›</button>
              </div>
              <div className="dp-months-grid">
                {MONTHS.map((name, i) => {
                  const m   = i + 1
                  const sel = parsed?.y === cursor.y && parsed?.m === m
                  return (
                    <button
                      key={name}
                      className={`dp-month${sel ? ' dp-sel' : ''}`}
                      onClick={() => { setCursor(c => ({ ...c, m })); setView('days') }}
                    >{name}</button>
                  )
                })}
              </div>
            </>
          )}

          {view === 'years' && (
            <>
              <div className="dp-header">
                <button className="dp-nav" onClick={() => setCursor(c => ({ ...c, y: c.y - 12 }))}>‹</button>
                <span className="dp-title">{years[0]}–{years[11]}</span>
                <button className="dp-nav" onClick={() => setCursor(c => ({ ...c, y: c.y + 12 }))}>›</button>
              </div>
              <div className="dp-years-grid">
                {years.map(y => (
                  <button
                    key={y}
                    className={`dp-year${parsed?.y === y ? ' dp-sel' : ''}`}
                    onClick={() => { setCursor(c => ({ ...c, y })); setView('months') }}
                  >{y}</button>
                ))}
              </div>
            </>
          )}

        </div>
      )}
    </div>
  )
}
