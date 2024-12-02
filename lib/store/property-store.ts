// lib/store/property-store.ts
import { create } from 'zustand'
import type { Property, PropertyFilters } from '@/lib/types/property'

interface PropertyStore {
  properties: Property[]
  isLoading: boolean
  error: string | null
  filters: PropertyFilters
  setProperties: (properties: Property[]) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setFilters: (filters: PropertyFilters) => void
}

export const usePropertyStore = create<PropertyStore>((set) => ({
  properties: [],
  isLoading: false,
  error: null,
  filters: {},
  setProperties: (properties) => set({ properties }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setFilters: (filters) => set({ filters })
}))