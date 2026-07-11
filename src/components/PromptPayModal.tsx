import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { useTripStore } from '../store/tripStore'
import { useToastStore } from '../store/toastStore'
import { buildPromptPayPayload, normalizePromptPayId } from '../services/promptpayService'
import type { Settlement } from '../models'

interface Props {
  settlement: Settlement
  onClose: () => void
}

export default function PromptPayModal({ settlement: s, onClose }: Props) {
  const promptPay    = useTripStore(st => st.current.promptPay)
  const setPromptPay = useTripStore(st => st.setPromptPay)
  const showToast    = useToastStore(st => st.show)

  const savedId = promptPay?.[s.to] ?? ''
  const [input, setInput]   = useState(savedId)
  const [editing, setEditing] = useState(!savedId)
  const [qrUrl, setQrUrl]   = useState('')

  const amount = Math.round(s.amount * 100) / 100

  useEffect(() => {
    if (!savedId || editing) { setQrUrl(''); return }
    QRCode.toDataURL(buildPromptPayPayload(savedId, amount), { width: 260, margin: 2 })
      .then(setQrUrl)
      .catch(() => showToast('Could not generate QR.'))
  }, [savedId, editing, amount, showToast])

  function handleSave() {
    const normalized = normalizePromptPayId(input)
    if (!normalized) {
      showToast('Enter a valid phone (10 digits), national ID (13) or e-wallet ID (15).')
      return
    }
    setPromptPay(s.to, normalized)
    setEditing(false)
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label="PromptPay QR" style={{ maxWidth: 340 }}>
        <div className="modal-header">
          <span className="modal-title">📱 PromptPay</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-section" style={{ textAlign: 'center' }}>
          <p className="modal-desc" style={{ marginBottom: '0.5rem' }}>
            <strong>{s.from}</strong> pays <strong>{s.to}</strong>
          </p>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            ฿{amount.toFixed(2)}
          </div>

          {editing ? (
            <>
              <p className="modal-desc">PromptPay number for {s.to}</p>
              <div className="load-trip-row">
                <input
                  type="tel"
                  placeholder="08X XXX XXXX"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  autoFocus
                />
                <button className="btn btn-primary" onClick={handleSave}>Save</button>
              </div>
            </>
          ) : (
            <>
              {qrUrl && (
                <img
                  src={qrUrl}
                  alt={`PromptPay QR: pay ${s.to} ฿${amount.toFixed(2)}`}
                  style={{ width: 260, maxWidth: '100%', borderRadius: 12 }}
                />
              )}
              <p className="modal-desc" style={{ marginTop: '0.5rem' }}>
                Scan with any Thai banking app — the amount is pre-filled.
              </p>
              <button
                className="btn btn-soft btn-xs"
                onClick={() => { setInput(savedId); setEditing(true) }}
              >
                Edit number ({savedId})
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
