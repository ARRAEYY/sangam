import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

// App-wide toast notifications. Mount <ToastProvider> once (main.jsx) and call
// useToast() anywhere: toast.success('Saved'), toast.error('...'), toast.info('...').
// Success/info toasts auto-dismiss; errors stay until dismissed so failures are
// never missed.

const ToastContext = createContext(null)

const TOAST_STYLES = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
    barClass: 'bg-emerald-500',
  },
  error: {
    icon: AlertTriangle,
    iconClass: 'text-red-600',
    barClass: 'bg-red-500',
  },
  info: {
    icon: Info,
    iconClass: 'text-[#7f1d3b]',
    barClass: 'bg-[#7f1d3b]',
  },
}

const AUTO_DISMISS_MS = 4200

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idCounter = useRef(0)
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((type, message) => {
    const text = typeof message === 'string' ? message : (message && message.message) || String(message)
    const id = ++idCounter.current
    setToasts((current) => [...current, { id, type, message: text }])
    if (type !== 'error') {
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
      timers.current.set(id, timer)
    }
    return id
  }, [dismiss])

  useEffect(() => () => {
    timers.current.forEach((timer) => clearTimeout(timer))
    timers.current.clear()
  }, [])

  const toast = {
    success: useCallback((message) => push('success', message), [push]),
    error: useCallback((message) => push('error', message), [push]),
    info: useCallback((message) => push('info', message), [push]),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none"
        >
          {toasts.map((t) => {
            const style = TOAST_STYLES[t.type] || TOAST_STYLES.info
            const Icon = style.icon
            return (
              <div
                key={t.id}
                role={t.type === 'error' ? 'alert' : 'status'}
                className="pointer-events-auto flex items-start gap-3 bg-white border border-[#2a2a2a]/10 rounded-xl shadow-lg pl-0 pr-2 py-2 overflow-hidden animate-[toast-in_.18s_ease-out]"
              >
                <div className={`w-1 self-stretch rounded-full ${style.barClass}`} />
                <Icon size={18} className={`mt-0.5 shrink-0 ${style.iconClass}`} aria-hidden="true" />
                <p className="flex-1 text-sm text-[#2a2a2a] break-words pt-0.5">{t.message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="p-1 text-[#2a2a2a]/40 hover:text-[#2a2a2a] hover:bg-[#2a2a2a]/5 rounded-full transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used inside <ToastProvider>')
  }
  return context
}
