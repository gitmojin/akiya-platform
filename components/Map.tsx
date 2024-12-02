// components/Map.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Property } from '@/lib/types/property'
import { useProperties } from '@/lib/hooks/useProperties'

interface PropertyPopupContent {
  property: Property;
  className?: string;
}

const PropertyPopup = ({ property, className }: PropertyPopupContent) => `
  <div class="p-4 max-w-[300px] ${className || ''}">
    ${property.images?.[0] ? `
      <div class="relative mb-3">
        <div class="w-full aspect-video rounded-lg overflow-hidden">
          <div class="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
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
`;

interface MapProps {
  selectedProperty?: Property | null;
  onPropertySelect?: (property: Property | null) => void;
}

export default function Map({ selectedProperty, onPropertySelect }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const { properties, loading } = useProperties()

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setMapError('Mapbox token missing');
      return;
    }

    try {
      mapboxgl.accessToken = token;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [140.104254, 39.719286],
        zoom: 8,
        minZoom: 5,
        maxZoom: 17
      });

      let isDragging = false;
      let touchStartTime = 0;

      mapContainer.current.addEventListener('touchstart', () => {
        isDragging = false;
        touchStartTime = Date.now();
      });

      mapContainer.current.addEventListener('touchmove', () => {
        isDragging = true;
      });

      mapContainer.current.addEventListener('touchend', (e) => {
        const touchDuration = Date.now() - touchStartTime;
        if (!isDragging && touchDuration < 200) {
          mapContainer.current?.dispatchEvent(new TouchEvent('touchcancel'));
          
          setTimeout(() => {
            const popups = document.getElementsByClassName('mapboxgl-popup');
            Array.from(popups).forEach(popup => popup.remove());
          }, 50);
        }
      });

    } catch (err) {
      console.error('Map initialization error:', err);
      setMapError(err instanceof Error ? err.message : 'Failed to initialize map');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Handle property selection
  useEffect(() => {
    if (!map.current || !selectedProperty?.location?.coordinates) return;

    // Close any existing popups
    const popups = document.getElementsByClassName('mapboxgl-popup');
    Array.from(popups).forEach(popup => popup.remove());

    // Fly to the selected property
    map.current.flyTo({
      center: selectedProperty.location.coordinates,
      zoom: 15,
      duration: 1500
    });

    // Show popup after flying
    setTimeout(() => {
      if (!map.current) return;

      const popup = new mapboxgl.Popup({
        offset: [0, -20],
        closeButton: true,
        closeOnClick: false,
        maxWidth: '300px',
        className: 'property-popup',
        trackPointer: false,
        anchor: 'bottom'
      })
      .setLngLat(selectedProperty.location.coordinates)
      .setHTML(PropertyPopup({ property: selectedProperty }))
      .addTo(map.current);

      // Set up image scroll monitoring
      setTimeout(() => {
        const scrollContainer = popup._content.querySelector('.overflow-x-auto');
        if (scrollContainer) {
          scrollContainer.scrollLeft = 0;
          scrollContainer.addEventListener('scroll', () => {
            const index = Math.round(scrollContainer.scrollLeft / scrollContainer.offsetWidth);
            const dots = popup._content.querySelectorAll('[data-index]');
            dots.forEach((dot: HTMLElement) => {
              const dotIndex = parseInt(dot.dataset.index || '0');
              dot.style.opacity = dotIndex === index ? '1' : '0.5';
            });
          });
        }
      }, 100);
    }, 1500);
  }, [selectedProperty]);

  // Add markers when properties change
  useEffect(() => {
    if (!map.current || !properties.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();

    properties.forEach(property => {
      if (!property.location?.coordinates) return;

      try {
        const el = document.createElement('div');
        el.className = 'marker-container';
        el.innerHTML = `
          <div class="w-8 h-8 bg-secondary-300 rounded-full border-2 border-white shadow-lg 
                      flex items-center justify-center text-white text-sm cursor-pointer
                      transform transition-transform hover:scale-110 duration-200">
            ${property.type === '売買' ? '売' : '賃'}
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onPropertySelect?.(property);
        });

        const marker = new mapboxgl.Marker(el)
          .setLngLat(property.location.coordinates)
          .addTo(map.current!);

        markersRef.current.push(marker);
        bounds.extend(property.location.coordinates);

      } catch (error) {
        console.error('Error adding marker:', error);
      }
    });

    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, { 
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 15
      });
    }
  }, [properties, onPropertySelect]);

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
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary-100/50">
          <p className="text-accent-500">Loading properties...</p>
        </div>
      )}
    </div>
  );
}