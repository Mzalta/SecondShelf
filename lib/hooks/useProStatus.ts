'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/browser'

export function useProStatus() {
  const [isPro, setIsPro] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkProStatus() {
      try {
        const supabase = createBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setIsPro(false)
          setLoading(false)
          return
        }

        const response = await fetch('/api/subscriptions/status', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          setIsPro(data.isPro || false)
        } else {
          setIsPro(false)
        }
      } catch (error) {
        console.error('Error checking Pro status:', error)
        setIsPro(false)
      } finally {
        setLoading(false)
      }
    }

    checkProStatus()
  }, [])

  return { isPro, loading }
}

