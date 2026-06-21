import { create } from 'zustand'

interface ToastStore {
  message: string
  visible: boolean
  show: (msg: string) => void
}

let timer: ReturnType<typeof setTimeout> | null = null

export const useToastStore = create<ToastStore>((set) => ({
  message: '',
  visible: false,

  show(msg) {
    if (timer) clearTimeout(timer)
    set({ message: msg, visible: true })
    timer = setTimeout(() => set({ visible: false }), 2800)
  },
}))
