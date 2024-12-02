// components/ErrorBoundary.tsx
'use client'

import React from 'react'
import { logger } from '@/lib/debug/logger'

interface Props {
  children: React.ReactNode
  componentName?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(
      'Component Error',
      { error, errorInfo },
      this.props.componentName
    )
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-red-700 font-medium">
            Component Error in {this.props.componentName || 'Unknown'}
          </h2>
          <pre className="mt-2 text-sm text-red-600 whitespace-pre-wrap">
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}