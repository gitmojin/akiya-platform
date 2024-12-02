// lib/store/property-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Property, PropertyFilters } from '@/lib/types/property'

interface PropertyStore {
  properties: Property[]
  isLoading: boolean
  error: string | null
  filters: PropertyFilters
  favoriteIds: Set<string>
  selectedProperty: Property | null
  initialized: boolean
  setProperties: (properties: Property[]) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setFilters: (filters: PropertyFilters) => void
  toggleFavorite: (propertyId: string) => void
  isFavorite: (propertyId: string) => boolean
  setSelectedProperty: (property: Property | null) => void
}

export const usePropertyStore = create<PropertyStore>()(
  persist(
    (set, get) => ({
      properties: [],
      isLoading: false,
      error: null,
      filters: {},
      favoriteIds: new Set<string>(),
      selectedProperty: null,
      initialized: false,

      setProperties: (properties) => set({ properties, initialized: true }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setFilters: (filters) => set({ filters }),
      
      toggleFavorite: (propertyId) => set((state) => {
        const newFavoriteIds = new Set(state.favoriteIds)
        if (newFavoriteIds.has(propertyId)) {
          newFavoriteIds.delete(propertyId)
        } else {
          newFavoriteIds.add(propertyId)
        }
        return { favoriteIds: newFavoriteIds }
      }),

      isFavorite: (propertyId) => get().favoriteIds.has(propertyId),
      
      setSelectedProperty: (selectedProperty) => set({ selectedProperty })
    }),
    {
      name: 'property-store',
      partialize: (state) => ({ 
        favoriteIds: Array.from(state.favoriteIds),
        filters: state.filters
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        favoriteIds: new Set(persistedState.favoriteIds),
        filters: persistedState.filters || {}
      })
    }
  )
)