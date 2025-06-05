import React from 'react'

// Performance optimization utilities

// Reduce animation delays for better performance
export const ANIMATION_CONFIG = {
  // Reduced durations for smoother performance
  FAST: '0.15s',
  NORMAL: '0.25s',
  SLOW: '0.4s',
  
  // Optimized easing functions
  EASE_OUT: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Animation delays for staggered effects
  STAGGER_DELAY: 0.05, // Reduced from 0.1s
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Lazy loading utility
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  return React.lazy(importFunc)
}

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startMeasure(name: string): void {
    performance.mark(`${name}-start`)
  }

  endMeasure(name: string): number {
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
    
    const measure = performance.getEntriesByName(name, 'measure')[0]
    const duration = measure.duration

    // Store metrics
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(duration)

    // Clean up
    performance.clearMarks(`${name}-start`)
    performance.clearMarks(`${name}-end`)
    performance.clearMeasures(name)

    return duration
  }

  getAverageTime(name: string): number {
    const times = this.metrics.get(name) || []
    if (times.length === 0) return 0
    
    return times.reduce((sum, time) => sum + time, 0) / times.length
  }

  logPerformanceReport(): void {
    console.group('Performance Report')
    
    this.metrics.forEach((times, name) => {
      const avg = this.getAverageTime(name)
      const max = Math.max(...times)
      const min = Math.min(...times)
      
      console.log(`${name}:`, {
        average: `${avg.toFixed(2)}ms`,
        max: `${max.toFixed(2)}ms`,
        min: `${min.toFixed(2)}ms`,
        samples: times.length
      })
    })
    
    console.groupEnd()
  }
}

// Memory optimization
export function cleanupMemory() {
  // Force garbage collection if available
  if (window.gc) {
    window.gc()
  }
  
  // Clear performance entries
  performance.clearResourceTimings()
  performance.clearMarks()
  performance.clearMeasures()
}

// Bundle size optimization
export const LAZY_COMPONENTS = {
  // Admin components
  AdminDashboard: () => import('@/app/admin/dashboard/page'),
  UserManagement: () => import('@/app/admin/user-management/page'),
  CafeteriaApprovals: () => import('@/app/admin/cafeteria-approvals/page'),
  
  // Cafeteria components  
  CafeteriaDashboard: () => import('@/app/cafeteria/dashboard/page'),
  MenuManagement: () => import('@/app/cafeteria/menu/page'),
  OrdersManagement: () => import('@/app/cafeteria/orders/page'),
}

// Image optimization
export const IMAGE_CONFIG = {
  QUALITY: 75, // Reduced from default 100
  FORMATS: ['webp', 'avif'], // Modern formats
  SIZES: {
    THUMBNAIL: 150,
    SMALL: 300,
    MEDIUM: 600,
    LARGE: 1200
  }
}

// API optimization - now uses dynamic settings
import SettingsService from './settings-service'

export class DynamicAPIConfig {
  private static cache: any = null
  private static cacheTime = 0
  private static readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static async getConfig() {
    const now = Date.now()

    // Return cached config if still valid
    if (this.cache && (now - this.cacheTime) < this.CACHE_DURATION) {
      return this.cache
    }

    try {
      // Load performance settings from database
      const settings = await SettingsService.getPerformanceSettings()

      this.cache = {
        TIMEOUT: settings.apiTimeout || 10000,
        RETRY_ATTEMPTS: settings.retryAttempts || 3,
        RETRY_DELAY: settings.retryDelay || 1000,
        CACHE_TTL: settings.cacheTtl || 300000,
      }

      this.cacheTime = now
      return this.cache
    } catch (error) {
      console.error('Error loading API config:', error)

      // Fallback to default values
      const defaultConfig = {
        TIMEOUT: 10000,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000,
        CACHE_TTL: 300000,
      }

      this.cache = defaultConfig
      this.cacheTime = now
      return defaultConfig
    }
  }
}

// Legacy export for backward compatibility
export const API_CONFIG = {
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  CACHE_TTL: 5 * 60 * 1000,
}

// Virtual scrolling configuration
export const VIRTUAL_SCROLL_CONFIG = {
  ITEM_HEIGHT: 60,
  BUFFER_SIZE: 5,
  OVERSCAN: 3
}

export default {
  ANIMATION_CONFIG,
  debounce,
  throttle,
  PerformanceMonitor,
  cleanupMemory,
  LAZY_COMPONENTS,
  IMAGE_CONFIG,
  API_CONFIG,
  VIRTUAL_SCROLL_CONFIG
}
