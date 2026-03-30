'use client'

import { useState } from 'react'
import getStripe from '@/lib/get-stripejs'

interface SubscribeButtonProps {
  children?: React.ReactNode
  className?: string
}

export function SubscribeButton({ children, className }: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Create a CheckoutSession via our API route
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()

      if (!res.ok || !data.url) {
        setError(data.error ?? 'Failed to create checkout session')
        return
      }

      // 2. Redirect to Stripe-hosted checkout page
      window.location.href = data.url
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className={
          className ??
          'inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 dark:bg-zinc-100 px-6 py-3 text-sm font-semibold text-white dark:text-zinc-900 shadow-lg transition-all hover:opacity-90 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed'
        }
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Redirecting to checkout…
          </>
        ) : (
          children ?? 'Subscribe — $5/mo'
        )}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
