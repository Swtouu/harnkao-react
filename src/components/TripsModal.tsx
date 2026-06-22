import { useTripStore } from '../store/tripStore'

interface Props {
  onClose: () => void
}

export default function TripsModal({ onClose }: Props) {
  const trips        = useTripStore(s => s.trips)
  const current      = useTripStore(s => s.current)
  const createTrip   = useTripStore(s => s.createTrip)
  const switchTrip   = useTripStore(s => s.switchTrip)
  const deleteTrip   = useTripStore(s => s.deleteTrip)
  const clearAllData = useTripStore(s => s.clearAllData)

  const sorted = [...trips].sort((a, b) => b.updatedAt - a.updatedAt)

  function handleCreate() {
    createTrip()
    onClose()
  }

  function handleSwitch(id: string) {
    if (id !== current.id) switchTrip(id)
    onClose()
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (!confirm('Delete this trip? This cannot be undone.')) return
    deleteTrip(id)
  }

  function handleClearAll() {
    if (!confirm('Delete all trips and start fresh? This cannot be undone.')) return
    clearAllData()
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label="My Trips">
        <div className="modal-header">
          <span className="modal-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            My Trips
          </span>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-section" style={{ paddingBottom: '0.75rem' }}>
          <button className="btn btn-primary" onClick={handleCreate} style={{ width: '100%', justifyContent: 'center' }}>
            + New Trip
          </button>
        </div>

        <div className="modal-divider" />

        <div className="modal-section">
          {sorted.length === 0 ? (
            <div className="empty-state">No saved trips yet.</div>
          ) : (
            <div className="trips-list">
              {sorted.map(t => (
                <div
                  key={t.id}
                  className={`trip-list-item${t.id === current.id ? ' active' : ''}`}
                  onClick={() => handleSwitch(t.id)}
                >
                  <div className="trip-list-info">
                    <div className="trip-list-name">{t.name || 'Untitled trip'}</div>
                    <div className="trip-list-meta">
                      {new Date(t.updatedAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </div>
                  </div>
                  <div className="trip-list-actions">
                    {t.id === current.id && (
                      <span className="badge">Active</span>
                    )}
                    <button
                      className="btn btn-danger btn-xs"
                      onClick={e => handleDelete(e, t.id)}
                      aria-label="Delete trip"
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-divider" />

        <div className="modal-section" style={{ paddingTop: '0.75rem' }}>
          <button
            className="btn btn-danger"
            onClick={handleClearAll}
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}
          >
            Reset all data
          </button>
        </div>
      </div>
    </div>
  )
}
