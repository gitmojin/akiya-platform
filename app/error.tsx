// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-100">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-accent-500">Something went wrong!</h2>
        <button
          onClick={() => reset()}
          className="mt-4 px-4 py-2 bg-secondary-300 text-accent-500 rounded-full hover:bg-secondary-400"
        >
          Try again
        </button>
      </div>
    </div>
  )
}