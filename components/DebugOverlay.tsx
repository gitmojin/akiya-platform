// components/DebugOverlay.tsx
'use client'

import { useState } from 'react'

export default function DebugOverlay() {
  const [isVisible, setIsVisible] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed top-20 right-4 z-50 bg-accent-500 text-white px-4 py-2 rounded-full text-sm opacity-50 hover:opacity-100"
      >
        {isVisible ? 'Hide' : 'Show'} Debug
      </button>

      {isVisible && (
        <div className="fixed bottom-20 right-4 z-40 w-96 bg-accent-500 bg-opacity-90 text-white rounded-lg shadow-lg">
          <div 
            className="p-3 border-b border-accent-400 cursor-pointer flex justify-between items-center"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span>Debug Log</span>
            <button 
              className="text-xs bg-accent-400 px-2 py-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                const debugEl = document.getElementById('debug-overlay');
                if (debugEl) debugEl.innerHTML = '';
              }}
            >
              Clear
            </button>
          </div>
          <div 
            id="debug-overlay" 
            className={`overflow-y-auto transition-all ${
              isExpanded ? 'h-96' : 'h-32'
            }`}
          >
            {/* Logs will be inserted here */}
          </div>
        </div>
      )}
    </>
  )
}