// components/Map.tsx
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { useMapGestures } from '@/lib/hooks/useMapGestures'
import type { Property, MapBounds } from '@/lib/types/property'
import { usePropertyStore } from '@/lib/store/property-store'

interface PropertyPopupContent {
  property: Property
  className?: string
  onFavoriteToggle: () => void
  isFavorite: boolean
}

function createPopupContent({ property, onFavoriteToggle, isFavorite }: PropertyPopupContent): string {
  return `
    <div class="p-4 max-w-[300px]">
      <div class="relative">
        ${property.images?.[0] ? `
          <div class="relative mb-3">
            <div class="w-full aspect-video rounded-lg overflow-hidden">
              <div class="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar" id="imageScroller-${property.id}">
                ${property.images.map((image: any) => `
                  <div class="flex-shrink-0 w-full h-full snap-center">
                    <img 
                      src="${image.url}" 
                      alt="${image.caption_jp || property.title_jp}"
                      class="w-full h-full object-cover"
                      onerror="this.src='/api/placeholder/300/200'"
                    />
                  </div>
                `).join('')}
              </div>
              ${property.images.length > 1 ? `
                <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                  ${property.images.map((_: any, index: number) => `
                    <div class="w-1.5 h-1.5 rounded-full transition-all duration-200 
                      ${index === 0 ? 'bg-white' : 'bg-white/50'}"
                      data-index="${index}">
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}
        
        <button
          class="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-white/80 
                 hover:bg-white transition-colors shadow-sm favorite-button"
          aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
        >
          <svg 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="${isFavorite ? '#D49D9D' : 'none'}" 
            stroke="${isFavorite ? '#D49D9D' : '#576B70'}" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-linejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>

      <h3 class="font-bold text-accent-500 text-lg mb-1">${property.title_jp}</h3>
      <p class="text-accent-400 text-sm mb-2">${property.prefecture} ${property.city}</p>
      <div class="flex items-center justify-between">
        <span class="text-sm font-bold text-accent-500">
          ${property.price 
            ? `¥${property.price.toLocaleString()}` 
            : 'Price on request'
          }
        </span>
        <span class="px-2 py-1 bg-secondary-200 text-secondary-500 rounded-full text-xs">
          ${property.type}
        </span>
      </div>
    </div>
  `
}

interface MapProps {
  selectedProperty?: Property | null
  onPropertySelect?: (property: Property | null) => void
}

export default function Map({ selectedProperty, onPropertySelect }: MapProps) {
  console.log('=== Map Component Mounting ===')
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const { 
    properties, 
    isLoading, 
    toggleFavorite, 
    isFavorite,
    setFilters 
  } = usePropertyStore()
  const [visibleProperties, setVisibleProperties] = useState<Property[]>([])

  // Apply gesture handling
  useMapGestures(map.current)

  // Handle map bounds updates
  const updateBounds = useCallback(() => {
    if (!map.current) return

    const bounds = map.current.getBounds()
    const newBounds: MapBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    }

    const filtered = properties.filter(property => {
      if (!property.location?.coordinates) return false
      const [lng, lat] = property.location.coordinates
      return (
        lng >= newBounds.west &&
        lng <= newBounds.east &&
        lat >= newBounds.south &&
        lat <= newBounds.north
      )
    })

    setVisibleProperties(filtered)
  }, [properties])

  // Debounced update function
  const debouncedUpdateBounds = useCallback(() => {
    let timeoutId: NodeJS.Timeout
    return () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateBounds, 200)
    }
  }, [updateBounds])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      setMapError('Mapbox token missing')
      return
    }

    try {
      mapboxgl.accessToken = token
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [140.104254, 39.719286],
        zoom: 8,
        minZoom: 5,
        maxZoom: 17
      })

      const debouncedUpdate = debouncedUpdateBounds()

      // Add bounds change listeners
      map.current.on('moveend', debouncedUpdate)
      map.current.on('zoomend', debouncedUpdate)

      // Initial bounds update
      updateBounds()

      return () => {
        if (map.current) {
          map.current.off('moveend', debouncedUpdate)
          map.current.off('zoomend', debouncedUpdate)
          map.current.remove()
          map.current = null
        }
      }
    } catch (err) {
      console.error('Map initialization error:', err)
      setMapError(err instanceof Error ? err.message : 'Failed to initialize map')
    }
  }, [updateBounds, debouncedUpdateBounds])

  // Handle property selection and popup
  useEffect(() => {
    if (!map.current || !selectedProperty?.location?.coordinates) return

    // Close existing popup
    if (popupRef.current) {
      popupRef.current.remove()
      popupRef.current = null
    }

    // Fly to selected property
    map.current.flyTo({
      center: selectedProperty.location.coordinates,
      zoom: 15,
      duration: 1500
    })

    // Create new popup after animation
    const setupPopup = () => {
      if (!map.current) return

      popupRef.current = new mapboxgl.Popup({
        offset: [0, -20],
        closeButton: true,
        closeOnClick: false,
        maxWidth: '300px',
        className: 'property-popup'
      })
      .setLngLat(selectedProperty.location.coordinates!)
      .setHTML(createPopupContent({ 
        property: selectedProperty,
        onFavoriteToggle: () => toggleFavorite(selectedProperty.id),
        isFavorite: isFavorite(selectedProperty.id)
      }))
      .addTo(map.current)

      // Set up popup interactions
      const popup = popupRef.current
      const content = popup.getElement()

      // Handle favorite button
      const favoriteButton = content.querySelector('.favorite-button')
      if (favoriteButton) {
        const handleFavorite = (e: Event) => {
          e.preventDefault()
          e.stopPropagation()
          toggleFavorite(selectedProperty.id)
          
          popup.setHTML(createPopupContent({ 
            property: selectedProperty,
            onFavoriteToggle: () => toggleFavorite(selectedProperty.id),
            isFavorite: !isFavorite(selectedProperty.id)
          }))
        }
        
        favoriteButton.addEventListener('click', handleFavorite)
      }

      // Handle image scrolling
      const scrollContainer = content.querySelector(`#imageScroller-${selectedProperty.id}`)
      if (scrollContainer) {
        const handleScroll = () => {
          const container = scrollContainer as HTMLElement
          const index = Math.round(container.scrollLeft / container.offsetWidth)
          const dots = content.querySelectorAll('[data-index]')
          dots.forEach((dot: Element) => {
            const dotIndex = parseInt((dot as HTMLElement).dataset.index || '0')
            dot.classList.toggle('bg-white', dotIndex === index)
            dot.classList.toggle('bg-white/50', dotIndex !== index)
          })
        }
        
        scrollContainer.addEventListener('scroll', handleScroll)
      }

      // Cleanup on popup close
      popup.on('close', () => {
        popupRef.current = null
      })
    }

    setTimeout(setupPopup, 1500)
  }, [selectedProperty, toggleFavorite, isFavorite])

  // Update markers for visible properties
  useEffect(() => {
    if (!map.current) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    const bounds = new mapboxgl.LngLatBounds()

    visibleProperties.forEach(property => {
      if (!property.location?.coordinates) return

      try {
        const el = document.createElement('div')
        el.className = 'marker-container'
        const isFav = isFavorite(property.id)
        
        el.innerHTML = `
          <div class="w-8 h-8 bg-secondary-300 rounded-full border-2 
                      ${isFav ? 'border-secondary-300' : 'border-white'} 
                      shadow-lg flex items-center justify-center text-white text-sm 
                      cursor-pointer transform transition-transform hover:scale-110 
                      duration-200">
            ${property.type === '売買' ? '売' : '賃'}
          </div>
        `

        const handleClick = (e: Event) => {
          e.stopPropagation()
          onPropertySelect?.(property)
        }
        
        el.addEventListener('click', handleClick)

        const marker = new mapboxgl.Marker(el)
          .setLngLat(property.location.coordinates)
          .addTo(map.current!)

        markersRef.current.push(marker)
        bounds.extend(property.location.coordinates)
      } catch (error) {
        console.error('Error adding marker:', error)
      }
    })

    // Only fit bounds on initial load or when explicitly requested
    if (!bounds.isEmpty() && markersRef.current.length === properties.length) {
      map.current.fitBounds(bounds, { 
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 15
      })
    }

    return () => {
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current = []
    }
  }, [visibleProperties, onPropertySelect, isFavorite, properties.length])

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainer} 
        className="absolute inset-0 bg-primary-100"
        style={{ visibility: mapError ? 'hidden' : 'visible' }}
      />
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary-100">
          <div className="text-center">
            <p className="text-accent-500 mb-4">{mapError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-secondary-300 text-white rounded-full"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary-100/50">
          <p className="text-accent-500">Loading properties...</p>
        </div>
      )}
      
      {/* Properties count overlay */}
      <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg p-2 text-xs text-accent-500">
        {visibleProperties.length} of {properties.length} properties visible
      </div>
    </div>
  )
}