// lib/hooks/useDisclosure.ts
import { useState, useCallback } from 'react'

export function useDisclosure<T>(initialState: T) {
  const [value, setValue] = useState<T>(initialState)

  const onChange = useCallback((newValue: T) => {
    setValue(newValue)
  }, [])

  const onToggle = useCallback(() => {
    setValue((current) => {
      if (typeof current === 'boolean') {
        return !current as unknown as T
      }
      return current
    })
  }, [])

  const onOpen = useCallback(() => {
    setValue((current) => {
      if (typeof current === 'boolean') {
        return true as unknown as T
      }
      return current
    })
  }, [])

  const onClose = useCallback(() => {
    setValue((current) => {
      if (typeof current === 'boolean') {
        return false as unknown as T
      }
      return current
    })
  }, [])

  return {
    value,
    onChange,
    onToggle,
    onOpen,
    onClose,
    isOpen: typeof value === 'boolean' ? value : false
  }
}