// lib/hooks/useMapGestures.ts
import { useEffect, useRef, useCallback } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'

interface TouchState {
  startX: number
  startY: number
  startDistance: number
  startAngle: number
  lastDistance: number
  lastAngle: number
  initialZoom: number
  initialCenter: [number, number]
  initialBearing: number
  timestamp: number
  isMoving: boolean
}

const ZOOM_SENSITIVITY = 0.15
const ROTATION_SENSITIVITY = 0.5
const PAN_SENSITIVITY = 0.5

export function useMapGestures(map: MapboxMap | null) {
  const touchStateRef = useRef<TouchState | null>(null)

  // Calculate distance between two touch points
  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // Calculate angle between two touch points
  const getAngle = useCallback((touch1: Touch, touch2: Touch): number => {
    return Math.atan2(
      touch2.clientY - touch1.clientY,
      touch2.clientX - touch1.clientX
    ) * 180 / Math.PI
  }, [])

  // Calculate center point between touches
  const getTouchCenter = useCallback((touch1: Touch, touch2: Touch): [number, number] => {
    return [
      (touch1.clientX + touch2.clientX) / 2,
      (touch1.clientY + touch2.clientY) / 2
    ]
  }, [])

  // Initialize touch gesture
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!map) return

    if (e.touches.length === 2) {
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]

      touchStateRef.current = {
        startX: (touch1.clientX + touch2.clientX) / 2,
        startY: (touch1.clientY + touch2.clientY) / 2,
        startDistance: getDistance(touch1, touch2),
        startAngle: getAngle(touch1, touch2),
        lastDistance: getDistance(touch1, touch2),
        lastAngle: getAngle(touch1, touch2),
        initialZoom: map.getZoom(),
        initialCenter: map.getCenter().toArray() as [number, number],
        initialBearing: map.getBearing(),
        timestamp: Date.now(),
        isMoving: false
      }
    }
  }, [map, getDistance, getAngle])

  // Handle touch movement
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!map || !touchStateRef.current || e.touches.length !== 2) return

    e.preventDefault()
    const state = touchStateRef.current
    const touch1 = e.touches[0]
    const touch2 = e.touches[1]

    // Calculate new values
    const currentDistance = getDistance(touch1, touch2)
    const currentAngle = getAngle(touch1, touch2)
    const [centerX, centerY] = getTouchCenter(touch1, touch2)

    // Calculate changes
    const scaleChange = currentDistance / state.startDistance
    const zoomDelta = Math.log2(scaleChange) * ZOOM_SENSITIVITY
    const newZoom = state.initialZoom + zoomDelta

    const rotationDelta = (currentAngle - state.lastAngle) * ROTATION_SENSITIVITY
    const newBearing = state.initialBearing + rotationDelta

    // Calculate pan
    const deltaX = (centerX - state.startX) * PAN_SENSITIVITY
    const deltaY = (centerY - state.startY) * PAN_SENSITIVITY

    // Update map with smooth transition
    map.easeTo({
      zoom: newZoom,
      center: [
        state.initialCenter[0] - deltaX / Math.pow(2, newZoom),
        state.initialCenter[1] + deltaY / Math.pow(2, newZoom)
      ],
      bearing: newBearing,
      duration: 0
    })

    // Update state
    state.lastDistance = currentDistance
    state.lastAngle = currentAngle
    state.isMoving = true
    state.timestamp = Date.now()
  }, [map, getDistance, getAngle, getTouchCenter])

  // Handle touch end with momentum
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!map || !touchStateRef.current) return

    const state = touchStateRef.current
    const timeDelta = Date.now() - state.timestamp

    // Add momentum if the gesture was quick
    if (state.isMoving && timeDelta < 200) {
      const currentZoom = map.getZoom()
      const currentCenter = map.getCenter()
      const currentBearing = map.getBearing()

      map.easeTo({
        zoom: currentZoom,
        center: currentCenter,
        bearing: currentBearing,
        duration: 300,
        easing: t => 1 - Math.pow(1 - t, 3) // Cubic easing
      })
    }

    touchStateRef.current = null
  }, [map])

  // Set up and clean up event listeners
  useEffect(() => {
    if (!map) return

    const container = map.getContainer()
    
    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)
    container.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('touchcancel', handleTouchEnd)
      touchStateRef.current = null
    }
  }, [map, handleTouchStart, handleTouchMove, handleTouchEnd])
}