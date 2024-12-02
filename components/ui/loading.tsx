// components/ui/loading.tsx
import { Loader2 } from 'lucide-react'

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
    </div>
  )
}

export function MapLoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-primary-100/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
        <p className="text-accent-500 font-medium">Loading properties...</p>
      </div>
    </div>
  )
}

export function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3 animate-pulse">
      <div className="h-4 bg-primary-200 rounded w-3/4"></div>
      <div className="h-4 bg-primary-200 rounded w-1/2"></div>
      <div className="h-4 bg-primary-200 rounded w-2/3"></div>
    </div>
  )
}