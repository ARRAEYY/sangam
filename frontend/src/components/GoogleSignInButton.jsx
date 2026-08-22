import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

// Renders Google's own "Continue with Google" button via Google Identity
// Services (loaded in index.html). We never build our own OAuth popup flow -
// Google issues a signed ID token ("credential") which we hand straight to
// our backend for verification.
export default function GoogleSignInButton({ onSuccess, onError }) {
  const { loginWithGoogle } = useAuth()
  const containerRef = useRef(null)
  const [unavailable, setUnavailable] = useState(false)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!clientId || clientId.includes('your-google-oauth-client-id')) {
      setUnavailable(true)
      return
    }

    let cancelled = false

    const render = () => {
      if (cancelled || !window.google?.accounts?.id || !containerRef.current) return

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

      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
      })
    }

    if (window.google?.accounts?.id) {
      render()
    } else {
      // The GIS script tag is async/defer - poll briefly until it's ready.
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval)
          render()
        }
      }, 100)
      const timeout = setTimeout(() => {
        clearInterval(interval)
        if (!window.google?.accounts?.id) setUnavailable(true)
      }, 5000)
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

  if (unavailable) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-2.5 text-center text-xs text-slate-400">
        Google Sign-In isn't configured yet. Set VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID to enable it.
      </div>
    )
  }

  return <div ref={containerRef} className="flex justify-center" />
}
