// components/PropertyCard.tsx
'use client'

import { Property } from '@/lib/types/property'
import { usePropertyStore } from '@/lib/store/property-store'
import { Heart } from 'lucide-react'

interface PropertyCardProps {
  property: Property
  onClick: (property: Property) => void
  selected?: boolean
}

export default function PropertyCard({ property, onClick, selected }: PropertyCardProps) {
  const { toggleFavorite, isFavorite } = usePropertyStore()
  const favorite = isFavorite(property.id)

  return (
    <div 
      className={`flex-shrink-0 w-44 mr-2 rounded-lg transition-all duration-300 transform bg-white relative
        ${selected ? [
          'ring-2 ring-secondary-300',
          'scale-105',
          'shadow-lg',
          'z-10'
        ].join(' ') : 'hover:shadow-md'}`}
    >
      {/* Favorite Button */}
      <div 
        onClick={(e) => {
          e.stopPropagation()
          toggleFavorite(property.id)
        }}
        className="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-white/80 
                   hover:bg-white transition-colors shadow-sm cursor-pointer"
      >
        <Heart
          size={18}
          className={`${favorite ? 'fill-secondary-300 text-secondary-300' : 'text-accent-300'}`}
        />
      </div>

      {/* Clickable area for property selection */}
      <div 
        onClick={() => onClick(property)}
        className="cursor-pointer"
      >
        {/* Image Container */}
        <div className="aspect-square relative rounded-t-lg overflow-hidden bg-primary-100">
          {property.images?.[0]?.url ? (
            <img 
              src={property.images[0].url} 
              alt={property.title_jp}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-200 text-accent-300 text-xs">
              No image
            </div>
          )}
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-secondary-300/90 rounded-full text-xs text-white">
            {property.type}
          </div>
        </div>

        {/* Info Container */}
        <div className="p-2 space-y-0.5">
          <h3 className="font-medium text-accent-500 text-xs line-clamp-1">
            {property.title_jp}
          </h3>
          <p className="text-[10px] text-accent-400 line-clamp-1">
            {property.prefecture} {property.city}
          </p>
          <p className="text-xs font-bold text-accent-500">
            {property.price 
              ? `¥${property.price.toLocaleString()}` 
              : 'Price on request'
            }
          </p>
        </div>
      </div>
    </div>
  )
}