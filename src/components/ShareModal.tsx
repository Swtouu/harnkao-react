import { useState } from 'react'
import { useTripStore } from '../store/tripStore'
import { useToastStore } from '../store/toastStore'
import { encodeTrip, shortenUrl } from '../services/shareService'

interface Props {
  onClose: () => void
}

export default function ShareModal({ onClose }: Props) {
  const current   = useTripStore(s => s.current)
  const loadSharedTrip = useTripStore(s => s.loadSharedTrip)
  const showToast = useToastStore(s => s.show)

  const [longUrl, setLongUrl]   = useState('')
  const [loadId, setLoadId]     = useState('')
  const [copying, setCopying]   = useState(false)
  const [shortening, setShortening] = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleCopyLink() {
    setCopying(true)
    try {
      const encoded = await encodeTrip(current)
      const url = `${window.location.origin}/?d=${encoded}`
      setLongUrl(url)
      await navigator.clipboard.writeText(url)
      showToast('Link copied!')
    } catch {
      showToast('Failed to copy link.')
    } finally {
      setCopying(false)
    }
  }

  async function handleShorten() {
    if (!longUrl) return
    setShortening(true)
    try {
      const short = await shortenUrl(longUrl)
      await navigator.clipboard.writeText(short)
      showToast('Short link copied!')
    } catch {
      showToast('URL shortener unavailable.')
    } finally {
      setShortening(false)
    }
  }

  async function handleLoadById() {
    const id = loadId.trim()
    if (!id) return
    setLoading(true)
    try {
      const res  = await fetch(`https://api.jsonbin.io/v3/b/${encodeURIComponent(id)}/latest`)
      if (!res.ok) throw new Error('not found')
      const data = await res.json() as { record: Record<string, unknown> }
      loadSharedTrip(data.record as Parameters<typeof loadSharedTrip>[0])
      showToast('Trip loaded!')
      onClose()
    } catch {
      showToast('Could not load trip — check the ID.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label="Share trip">
        <div className="modal-header">
          <span className="modal-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share this trip
          </span>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-section">
          <div className="modal-section-label">⚡ Quick link — no account needed</div>
          <p className="modal-desc">Encodes the trip into the URL itself. Instant, works offline.</p>

          <button
            className="btn btn-primary"
            onClick={handleCopyLink}
            disabled={copying}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            {copying ? 'Copying…' : 'Copy link'}
          </button>

          {longUrl && (
            <div className="quick-link-row">
              <span className="quick-link-url">{longUrl}</span>
              <button
                className="btn btn-soft"
                onClick={handleShorten}
                disabled={shortening}
                style={{ flexShrink: 0, fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
              >
                {shortening ? '…' : 'Shorten'}
              </button>
            </div>
          )}
        </div>

        <div className="modal-divider" />

        <div className="modal-section">
          <div className="modal-section-label">📥 Load a trip by ID</div>
          <p className="modal-desc">Have a Trip ID from a friend? Paste it below.</p>
          <div className="load-trip-row">
            <input
              type="text"
              placeholder="Paste Trip ID here…"
              value={loadId}
              onChange={e => setLoadId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLoadById()}
            />
            <button
              className="btn btn-soft"
              onClick={handleLoadById}
              disabled={loading || !loadId.trim()}
            >
              {loading ? 'Loading…' : 'Load trip'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
