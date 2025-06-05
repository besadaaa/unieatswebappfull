import { supabase, createSupabaseAdmin } from './supabase'

// Enhanced data fetching service with proper error handling and caching
export class DataService {
  private static cache = new Map<string, { data: any; timestamp: number }>()
  private static CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  private static getCacheKey(table: string, params?: any): string {
    return `${table}_${JSON.stringify(params || {})}`
  }

  private static isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION
  }

  private static setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  private static getCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && this.isValidCache(cached.timestamp)) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  // Fetch cafeterias with caching
  static async getCafeterias(useCache = true) {
    const cacheKey = this.getCacheKey('cafeterias')
    
    if (useCache) {
      const cached = this.getCache(cacheKey)
      if (cached) return cached
    }

    try {
      const { data, error } = await supabase
        .from('cafeterias')
        .select('*')
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching cafeterias:', error)
        return []
      }

      const result = data || []
      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('Error fetching cafeterias:', error)
      return []
    }
  }

  // Fetch menu items with caching
  static async getMenuItems(cafeteriaId?: string, useCache = true) {
    const cacheKey = this.getCacheKey('menu_items', { cafeteriaId })
    
    if (useCache) {
      const cached = this.getCache(cacheKey)
      if (cached) return cached
    }

    try {
      let query = supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('name', { ascending: true })

      if (cafeteriaId) {
        query = query.eq('cafeteria_id', cafeteriaId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching menu items:', error)
        return []
      }

      const result = data || []
      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('Error fetching menu items:', error)
      return []
    }
  }

  // Fetch orders with proper authentication
  static async getOrders(userId?: string, cafeteriaId?: string) {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(*),
          profiles!orders_user_id_fkey(full_name, phone),
          cafeterias(name, location)
        `)
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.or(`user_id.eq.${userId},student_id.eq.${userId}`)
      }

      if (cafeteriaId) {
        query = query.eq('cafeteria_id', cafeteriaId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching orders:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching orders:', error)
      return []
    }
  }

  // Fetch user profile
  static async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  // Admin functions using service role
  static async getAdminData() {
    try {
      const supabaseAdmin = createSupabaseAdmin()
      
      // Fetch all data for admin dashboard
      const [cafeterias, orders, users] = await Promise.all([
        supabaseAdmin.from('cafeterias').select('*'),
        supabaseAdmin.from('orders').select('*'),
        supabaseAdmin.from('profiles').select('*')
      ])

      return {
        cafeterias: cafeterias.data || [],
        orders: orders.data || [],
        users: users.data || [],
        errors: {
          cafeterias: cafeterias.error,
          orders: orders.error,
          users: users.error
        }
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
      return {
        cafeterias: [],
        orders: [],
        users: [],
        errors: { general: error }
      }
    }
  }

  // Test database connection
  static async testConnection() {
    try {
      const { data, error } = await supabase
        .from('cafeterias')
        .select('id, name')
        .limit(1)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'Connection failed' }
    }
  }

  // Clear cache
  static clearCache() {
    this.cache.clear()
  }

  // Get cache stats
  static getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Export convenience functions
export const getCafeterias = DataService.getCafeterias
export const getMenuItems = DataService.getMenuItems
export const getOrders = DataService.getOrders
export const getUserProfile = DataService.getUserProfile
export const getAdminData = DataService.getAdminData
export const testConnection = DataService.testConnection
