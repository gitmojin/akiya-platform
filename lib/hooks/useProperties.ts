// lib/hooks/useProperties.ts
import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Property } from '@/lib/types/property'

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/properties')
      
      if (!response.ok) {
        throw new Error('Failed to fetch properties')
      }

      const data = await response.json()
      setProperties(data.properties)
    } catch (err) {
      console.error('Error fetching properties:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  // Memoize the return value to prevent unnecessary rerenders
  return useMemo(() => ({
    properties,
    loading,
    error,
    refetch: fetchProperties
  }), [properties, loading, error, fetchProperties])
}