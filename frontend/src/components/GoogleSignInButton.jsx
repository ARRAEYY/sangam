import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

// Renders Google's official "Continue with Google" button via Google Identity Services.
export default function GoogleSignInButton({ onSuccess, onError }) {
  const { loginWithGoogle } = useAuth()
  const containerRef = useRef(null)
  const [errorState, setErrorState] = useState(null) // null | 'UNCONFIGURED' | 'SCRIPT_FAILED' | string
  const [isInitializing, setIsInitializing] = useState(true)
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()

  useEffect(() => {
    // 1. Check if Client ID is configured
    if (!clientId || clientId.includes('your-google-oauth-client-id')) {
      setErrorState('UNCONFIGURED')
      setIsInitializing(false)
      return
    }

    let cancelled = false

    const render = () => {
      if (cancelled || !containerRef.current || !window.google?.accounts?.id) return

      try {
        if (!window._googleInitialized) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response) => {
              try {
                const profile = await loginWithGoogle(response.credential)
                onSuccess?.(profile)
              } catch (err) {
                onError?.(err.message || 'Google sign-in failed.')
              }
            },
          })
          window._googleInitialized = true
        }

        // Clear container before rendering button
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
        }

        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          width: 308,
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
        })

        setIsInitializing(false)
        setErrorState(null)
      } catch (err) {
        console.error('[GIS INIT ERROR]', err)
        setErrorState(err.message || 'Failed to initialize Google Sign-In button.')
        setIsInitializing(false)
      }
    }

    // 2. Load Google Identity Services script if not already present
    if (!window.google?.accounts?.id) {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      if (!existingScript) {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => {
          if (!cancelled) render()
        }
        script.onerror = () => {
          if (!cancelled) {
            setErrorState('SCRIPT_FAILED')
            setIsInitializing(false)
          }
        }
        document.head.appendChild(script)
      }
    }

    // 3. Poll for readiness
    if (window.google?.accounts?.id) {
      render()
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval)
          render()
        }
      }, 100)

      const timeout = setTimeout(() => {
        clearInterval(interval)
        if (!window.google?.accounts?.id && !cancelled) {
          setErrorState('SCRIPT_FAILED')
          setIsInitializing(false)
        }
      }, 6000)

      return () => {
        cancelled = true
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }

    return () => {
      cancelled = true
    }
  }, [clientId, loginWithGoogle, onSuccess, onError])

  if (errorState === 'UNCONFIGURED') {
    return (
      <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-4 py-2.5 text-center text-xs text-amber-800">
        Google Sign-In isn't configured in Vercel. Set <code className="font-mono font-semibold">VITE_GOOGLE_CLIENT_ID</code> in Vercel Environment Variables.
      </div>
    )
  }

  if (errorState === 'SCRIPT_FAILED') {
    return (
      <div className="rounded-xl border border-dashed border-red-300 bg-red-50/60 px-4 py-2.5 text-center text-xs text-red-700">
        Could not load Google Identity Services library. Please check your internet connection or adblocker.
      </div>
    )
  }

  if (errorState) {
    return (
      <div className="rounded-xl border border-dashed border-red-300 bg-red-50/60 px-4 py-2.5 text-center text-xs text-red-700">
        {errorState}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[44px]">
      {isInitializing && (
        <div className="h-10 w-[308px] animate-pulse rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-400">
          Loading Google Sign-In...
        </div>
      )}
      <div ref={containerRef} className={isInitializing ? 'hidden' : 'flex justify-center'} />
    </div>
  )
}
