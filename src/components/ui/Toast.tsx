import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  toast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = nextId++
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`pointer-events-auto px-4 py-3 rounded-xl text-sm font-medium shadow-xl backdrop-blur-md border ${
                t.type === 'success'
                  ? 'bg-emerald-900/80 text-emerald-200 border-emerald-700/50'
                  : t.type === 'error'
                  ? 'bg-red-900/80 text-red-200 border-red-700/50'
                  : 'bg-zinc-800/80 text-zinc-200 border-zinc-700/50'
              }`}
            >
              <div className="flex items-center gap-2">
                {t.type === 'success' && <span>✓</span>}
                {t.type === 'error' && <span>✕</span>}
                {t.type === 'info' && <span>ℹ</span>}
                {t.message}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
