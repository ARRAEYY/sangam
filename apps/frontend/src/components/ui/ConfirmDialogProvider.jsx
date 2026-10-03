import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, HelpCircle, Info } from 'lucide-react'

// Promise-based confirm dialogs replacing window.confirm. Mount
// <ConfirmDialogProvider> once (main.jsx) and call useConfirm() anywhere:
//   const confirmDialog = useConfirm()
//   if (await confirmDialog({ title: 'Delete?', message: 'This cannot be undone.', danger: true })) { ... }
// Resolves true only when the confirm button is clicked; Escape/overlay click
// or dismissal resolves false.

const ConfirmContext = createContext(null)

const INTENTS = {
  danger: { icon: AlertTriangle, iconClass: 'text-red-600 bg-red-50', confirmClass: 'bg-red-600 hover:bg-red-700' },
  question: { icon: HelpCircle, iconClass: 'text-[#7f1d3b] bg-[#7f1d3b]/10', confirmClass: 'bg-[#800023] hover:bg-[#7f1d3b]' },
  info: { icon: Info, iconClass: 'text-slate-600 bg-slate-100', confirmClass: 'bg-[#2a2a2a] hover:bg-[#2a2a2a]/90' },
}

export function ConfirmDialogProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const resolverRef = useRef(null)
  const confirmButtonRef = useRef(null)
  const cancelButtonRef = useRef(null)

  const confirmDialog = ({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, intent }) => {
    return new Promise((resolve) => {
      if (resolverRef.current) resolverRef.current(false)
      resolverRef.current = resolve
      setDialog({ title, message, confirmLabel, cancelLabel, intent: intent || (danger ? 'danger' : 'question') })
    })
  }

  const settle = (result) => {
    const resolve = resolverRef.current
    resolverRef.current = null
    setDialog(null)
    if (resolve) resolve(result)
  }

  useEffect(() => {
    if (!dialog) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        settle(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [dialog])

  // Focus the confirm button when the dialog opens
  useEffect(() => {
    if (dialog) {
      const target = dialog.intent === 'danger' ? cancelButtonRef.current : confirmButtonRef.current
      if (target) target.focus()
    }
  }, [dialog])

  const style = INTENTS[dialog?.intent] || INTENTS.question
  const Icon = style.icon

  return (
    <ConfirmContext.Provider value={confirmDialog}>
      {children}
      {dialog &&
        createPortal(
          <div
            className="fixed inset-0 z-[10100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) settle(false)
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
              aria-describedby="confirm-dialog-message"
              className="w-full max-w-sm bg-white border border-[#2a2a2a]/10 rounded-2xl shadow-2xl p-5"
            >
              <div className="flex items-start gap-3">
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${style.iconClass}`}>
                  <Icon size={20} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h2 id="confirm-dialog-title" className="text-base font-semibold text-[#2a2a2a]">
                    {dialog.title}
                  </h2>
                  {dialog.message && (
                    <p id="confirm-dialog-message" className="mt-1 text-sm text-[#2a2a2a]/70 break-words">
                      {dialog.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  ref={cancelButtonRef}
                  onClick={() => settle(false)}
                  className="px-4 py-2 text-sm font-medium text-[#2a2a2a] bg-white border border-[#2a2a2a]/15 rounded-xl hover:bg-[#2a2a2a]/5 transition-colors"
                >
                  {dialog.cancelLabel}
                </button>
                <button
                  type="button"
                  ref={confirmButtonRef}
                  onClick={() => settle(true)}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors ${style.confirmClass}`}
                >
                  {dialog.confirmLabel}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used inside <ConfirmDialogProvider>')
  }
  return context
}
