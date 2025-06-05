import { supabase } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE'

export interface RealtimeEvent {
  eventType: RealtimeEventType
  new: any
  old: any
  table: string
}

export type RealtimeCallback = (event: RealtimeEvent) => void

class RealtimeSync {
  private channels: Map<string, RealtimeChannel> = new Map()
  private callbacks: Map<string, RealtimeCallback[]> = new Map()

  // Subscribe to real-time changes for a specific table
  subscribeToTable(table: string, callback: RealtimeCallback, filter?: { column: string; value: string }) {
    const channelName = filter ? `${table}_${filter.column}_${filter.value}` : table
    
    // Add callback to the list
    if (!this.callbacks.has(channelName)) {
      this.callbacks.set(channelName, [])
    }
    this.callbacks.get(channelName)!.push(callback)

    // Create channel if it doesn't exist
    if (!this.channels.has(channelName)) {
      const channel = supabase.channel(channelName)

      let subscription = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          ...(filter && { filter: `${filter.column}=eq.${filter.value}` })
        },
        (payload) => {
          const event: RealtimeEvent = {
            eventType: payload.eventType as RealtimeEventType,
            new: payload.new,
            old: payload.old,
            table: table
          }

          // Notify all callbacks for this channel
          const channelCallbacks = this.callbacks.get(channelName) || []
          channelCallbacks.forEach(cb => {
            try {
              cb(event)
            } catch (error) {
              console.error('Error in realtime callback:', error)
            }
          })
        }
      )

      subscription.subscribe((status) => {
        console.log(`Realtime subscription status for ${channelName}:`, status)
      })

      this.channels.set(channelName, channel)
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribeFromTable(table, callback, filter)
    }
  }

  // Unsubscribe from real-time changes
  unsubscribeFromTable(table: string, callback: RealtimeCallback, filter?: { column: string; value: string }) {
    const channelName = filter ? `${table}_${filter.column}_${filter.value}` : table
    
    const callbacks = this.callbacks.get(channelName)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }

      // If no more callbacks, remove the channel
      if (callbacks.length === 0) {
        const channel = this.channels.get(channelName)
        if (channel) {
          supabase.removeChannel(channel)
          this.channels.delete(channelName)
          this.callbacks.delete(channelName)
        }
      }
    }
  }

  // Subscribe to menu items for a specific cafeteria
  subscribeToMenuItems(cafeteriaId: string, callback: RealtimeCallback) {
    return this.subscribeToTable('menu_items', callback, { column: 'cafeteria_id', value: cafeteriaId })
  }

  // Subscribe to orders for a specific cafeteria
  subscribeToOrders(cafeteriaId: string, callback: RealtimeCallback) {
    return this.subscribeToTable('orders', callback, { column: 'cafeteria_id', value: cafeteriaId })
  }

  // Subscribe to all cafeterias
  subscribeToCafeterias(callback: RealtimeCallback) {
    return this.subscribeToTable('cafeterias', callback)
  }

  // Clean up all subscriptions
  cleanup() {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel)
    })
    this.channels.clear()
    this.callbacks.clear()
  }
}

// Export singleton instance
export const realtimeSync = new RealtimeSync()

// React hook for real-time subscriptions
export function useRealtimeSubscription(
  table: string, 
  callback: RealtimeCallback, 
  filter?: { column: string; value: string },
  dependencies: any[] = []
) {
  const { useEffect } = require('react')
  
  useEffect(() => {
    const unsubscribe = realtimeSync.subscribeToTable(table, callback, filter)
    return unsubscribe
  }, dependencies)
}

// Convenience hooks
export function useMenuItemsSync(cafeteriaId: string, callback: RealtimeCallback) {
  return useRealtimeSubscription('menu_items', callback, { column: 'cafeteria_id', value: cafeteriaId }, [cafeteriaId])
}

export function useOrdersSync(cafeteriaId: string, callback: RealtimeCallback) {
  return useRealtimeSubscription('orders', callback, { column: 'cafeteria_id', value: cafeteriaId }, [cafeteriaId])
}

export function useCafeteriasSync(callback: RealtimeCallback) {
  return useRealtimeSubscription('cafeterias', callback, undefined, [])
}

// Helper function to invalidate cache when data changes
export function createCacheInvalidator(cacheKeys: string[]) {
  return (event: RealtimeEvent) => {
    // Clear relevant cache entries
    cacheKeys.forEach(key => {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(localStorage).filter(k => k.includes(key))
        keys.forEach(k => localStorage.removeItem(k))
      }
    })
    
    console.log(`Cache invalidated for keys: ${cacheKeys.join(', ')} due to ${event.eventType} on ${event.table}`)
  }
}

// Auto-refresh data service cache on changes
export function setupAutoRefresh() {
  // Import DataService dynamically to avoid circular dependency
  import('./data-service').then(({ DataService }) => {
    // Clear cache when menu items change
    realtimeSync.subscribeToTable('menu_items', () => {
      DataService.clearCache()
    })

    // Clear cache when cafeterias change
    realtimeSync.subscribeToTable('cafeterias', () => {
      DataService.clearCache()
    })

    // Clear cache when orders change
    realtimeSync.subscribeToTable('orders', () => {
      DataService.clearCache()
    })
  })
}
