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

  const getToastStyle = (type: string) => {
    switch (type) {
      case 'success':
        return {
          background: 'rgba(0,125,255,0.9)',
          border: '1px solid rgba(0,125,255,0.5)',
          color: 'white',
        }
      case 'error':
        return {
          background: 'rgba(127,29,29,0.9)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#fca5a5',
        }
      default:
        return {
          background: 'rgba(39,39,42,0.9)',
          border: '1px solid rgba(63,63,70,0.4)',
          color: '#e4e4e7',
        }
    }
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-2rem)]">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="pointer-events-auto px-4 py-3 rounded-xl text-sm font-medium shadow-2xl backdrop-blur-xl"
              style={getToastStyle(t.type)}
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
