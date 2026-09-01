import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'

import { vi } from 'vitest'

// Mock the AuthContext so we don't try to fetch real APIs on mount
vi.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: () => ({
    user: null,
    loading: false,
    token: null,
  })
}))

describe('App Routing', () => {
  it('renders without crashing and shows the landing page or nav', () => {
    render(
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    )
    
    // Check if a main app container is present, or just verify it didn't throw.
    // The App component renders a <main className="app-canvas w-full min-h-screen relative">
    const mainElement = document.querySelector('main')
    expect(mainElement).toBeInTheDocument()
  })
})
