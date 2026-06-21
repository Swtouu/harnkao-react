import { useToastStore } from '../store/toastStore'

export default function Toast() {
  const { message, visible } = useToastStore()

  return (
    <div className={`toast${visible ? ' show' : ''}`} role="status" aria-live="polite">
      {message}
    </div>
  )
}
