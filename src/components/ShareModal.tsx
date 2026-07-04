import { useState } from 'react'
import { useTripStore } from '../store/tripStore'
import { useToastStore } from '../store/toastStore'
import { encodeTrip } from '../services/shareService'

interface Props {
  onClose: () => void
}

export default function ShareModal({ onClose }: Props) {
  const current   = useTripStore(s => s.current)
  const showToast = useToastStore(s => s.show)

  const [longUrl, setLongUrl]     = useState('')
  const [shortUrl, setShortUrl]   = useState('')
  const [copying, setCopying]     = useState(false)
  const [shortening, setShortening] = useState(false)

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
    setShortening(true)
    setShortUrl('')
    try {
      const encoded = await encodeTrip(current)
      const url = `${window.location.origin}/?d=${encoded}`
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url })
      })
      if (!res.ok) throw new Error()
      const { short } = await res.json() as { short: string }
      setShortUrl(short)
    } catch {
      showToast('Could not shorten link.')
    } finally {
      setShortening(false)
    }
  }

  async function handleCopyShort() {
    try {
      await navigator.clipboard.writeText(shortUrl)
      showToast('Short link copied!')
    } catch {
      showToast('Could not copy link.')
    }
  }

  async function handleNativeShare() {
    if (!longUrl) return
    try {
      await navigator.share({ title: current.tripName || 'HarnKao trip', url: longUrl })
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        showToast('Could not open share sheet.')
      }
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
                onClick={() => navigator.clipboard.writeText(longUrl).then(() => showToast('Link copied!')).catch(() => showToast('Could not copy.'))}
                style={{ flexShrink: 0, fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
              >
                Copy
              </button>
              {'share' in navigator && (
                <button
                  className="btn btn-soft"
                  onClick={handleNativeShare}
                  style={{ flexShrink: 0, fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                >
                  Share…
                </button>
              )}
            </div>
          )}

          <button
            className="btn btn-soft"
            onClick={handleShorten}
            disabled={shortening}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
          >
            {shortening ? 'Shortening…' : '✂️ Shorten link'}
          </button>

          {shortUrl && (
            <div className="quick-link-row">
              <span className="quick-link-url">{shortUrl}</span>
              <button
                className="btn btn-soft"
                onClick={handleCopyShort}
                style={{ flexShrink: 0, fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
              >
                Copy
              </button>
              {'share' in navigator && (
                <button
                  className="btn btn-soft"
                  onClick={() => navigator.share({ title: current.tripName || 'HarnKao trip', url: shortUrl }).catch(() => {})}
                  style={{ flexShrink: 0, fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                >
                  Share…
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
