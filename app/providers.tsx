// app/providers.tsx
'use client'

import { ReactNode, createContext, useContext, useEffect, useState, useRef } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { usePropertyStore } from '@/lib/store/property-store'

const LoadingContext = createContext<{ isLoading: boolean } | undefined>(undefined)

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-100">
      <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-accent-500 mb-4">
          Something went wrong
        </h2>
        <p className="text-accent-400 mb-4">
          {error.message}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-secondary-300 text-white rounded-full hover:bg-secondary-400 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
      <div className="text-accent-500 animate-pulse">Loading...</div>
    </div>
  )
}

function StoreProvider({ children }: { children: ReactNode }) {
  const { setProperties, setIsLoading, setError } = usePropertyStore()
  const mountedRef = useRef(false)

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    async function initializeStore() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/properties')
        
        if (!response.ok) {
          throw new Error('Failed to fetch properties')
        }

        const data = await response.json()
        setProperties(data.properties)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load properties')
      } finally {
        setIsLoading(false)
      }
    }

    initializeStore()
  }, [setIsLoading, setError, setProperties])

  return children
}

export function Providers({ children }: { children: ReactNode }) {
  const providerId = useRef(`provider-${Math.random().toString(36).substr(2, 9)}`)
  const { isLoading } = usePropertyStore()

  console.log('=== Providers Mounting ===', {
    id: providerId.current,
    time: new Date().toISOString()
  })

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        usePropertyStore.setState({
          properties: [],
          isLoading: false,
          error: null,
          filters: {}
        })
      }}
    >
      <LoadingContext.Provider value={{ isLoading }}>
        <StoreProvider>
          {isLoading && <LoadingOverlay />}
          {children}
        </StoreProvider>
      </LoadingContext.Provider>
    </ErrorBoundary>
  )
}