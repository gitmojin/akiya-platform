// components/BottomPanel.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronUp, ChevronDown } from 'lucide-react'
import PropertyCard from './PropertyCard'
import type { Property } from '@/lib/types/property'
import { useProperties } from '@/lib/hooks/useProperties'

const categories = ['All', 'New', 'Popular', 'Cheapest', 'Tokyo']

interface BottomPanelProps {
  onPropertySelect?: (property: Property) => void;
  selectedProperty?: Property | null;
}

export default function BottomPanel({ onPropertySelect, selectedProperty }: BottomPanelProps) {
  console.log('=== BottomPanel Mounting ===', {
    mountTime: new Date().toISOString(),
    hasOnPropertySelect: !!onPropertySelect,
    hasSelectedProperty: !!selectedProperty
  });

  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const { properties, loading } = useProperties()
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Category selection also expands panel if minimized
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
    setIsExpanded(true)
  }

  // Filter properties based on selected category
  useEffect(() => {
    let filtered = [...properties]
    
    switch (selectedCategory) {
      case 'New':
        filtered.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 10)
        break
      case 'Popular':
        filtered = filtered.slice(0, 10)
        break
      case 'Cheapest':
        filtered = filtered
          .filter(p => p.price)
          .sort((a, b) => (a.price || 0) - (b.price || 0))
          .slice(0, 10)
        break
      case 'Tokyo':
        filtered = filtered.filter(p => p.prefecture === '東京都')
        break
      default:
        break
    }

    setFilteredProperties(filtered)
  }, [selectedCategory, properties])

  // Scroll selected property into view
  useEffect(() => {
    if (selectedProperty && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const selectedCard = container.querySelector(`[data-property-id="${selectedProperty.id}"]`)
      if (selectedCard) {
        selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [selectedProperty])

  return (
    <div className="bottom-panel-wrapper">
      <motion.div
        initial={{ y: '80%' }}
        animate={{ y: isExpanded ? 0 : '90%' }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        className="fixed bottom-0 left-0 right-0 z-10"
      >
        {/* Pull tab */}
        <div className="absolute left-0 right-0 -top-6 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-white hover:bg-primary-100 rounded-full p-2 shadow-lg border border-primary-200 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="text-accent-500" size={24} />
            ) : (
              <ChevronUp className="text-accent-500" size={24} />
            )}
          </button>
        </div>

        {/* Panel Content */}
        <div className="bg-white rounded-t-3xl shadow-lg">
          <div className="px-3 pt-4 pb-2">
            {/* Categories - hidden when minimized */}
            {isExpanded && (
              <div className="flex space-x-2 overflow-x-auto hide-scrollbar pb-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={`px-3 py-1.5 rounded-full transition-colors flex-shrink-0 text-sm
                      ${selectedCategory === category 
                        ? 'bg-secondary-300 text-white' 
                        : 'bg-primary-100 text-accent-400 hover:bg-primary-200'
                      } whitespace-nowrap`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}

            {/* Properties Carousel */}
            <div>
              {loading ? (
                <div className="text-center py-4 text-accent-400">
                  Loading properties...
                </div>
              ) : filteredProperties.length === 0 ? (
                <div className="text-center py-4 text-accent-400">
                  No properties found
                </div>
              ) : (
                <div 
                  ref={scrollContainerRef}
                  className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory py-2"
                >
                  {filteredProperties.map((property) => (
                    <div 
                      key={property.id}
                      data-property-id={property.id}
                      className="snap-center"
                    >
                      <PropertyCard
                        property={property}
                        onClick={onPropertySelect ? onPropertySelect : () => {}}
                        selected={selectedProperty?.id === property.id}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}