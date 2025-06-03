'use client'

import React, { useEffect } from 'react'
import { preloadCriticalData } from '@/lib/fast-queries'

export function PreloadProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Preload critical data on app start
    const preload = async () => {
      try {
        // Try to determine user role from localStorage or cookies
        const userRole = localStorage.getItem('userRole') as 'admin' | 'cafeteria' | null
        const userId = localStorage.getItem('userId')
        
        if (userRole) {
          preloadCriticalData(userRole, userId || undefined)
        }
      } catch (error) {
        console.log('Preload error (non-critical):', error)
      }
    }

    preload()
  }, [])

  return <>{children}</>
}
