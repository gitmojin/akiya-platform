// app/page.tsx
'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import SearchBar from '@/components/SearchBar'
import BottomPanel from '@/components/BottomPanel'
import type { Property } from '@/lib/types/property'

const MapComponent = dynamic(
  () => import('@/components/Map'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-primary-100">
        <p className="text-accent-500">Loading map...</p>
      </div>
    )
  }
)

export default function Home() {
  console.log('=== Home Component Rendering ===');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  return (
    <main className="relative h-full w-full overflow-hidden">
      <SearchBar />
      <div className="absolute inset-0 z-0">
        <MapComponent 
          selectedProperty={selectedProperty}
          onPropertySelect={setSelectedProperty}
        />
      </div>
      <div key="bottom-panel-container">
        <BottomPanel 
          key="bottom-panel"
          onPropertySelect={setSelectedProperty}
          selectedProperty={selectedProperty}
        />
      </div>
    </main>
  )
}