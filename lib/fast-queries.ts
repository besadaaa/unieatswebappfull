// Ultra-fast data fetching with aggressive caching
import { supabase } from './supabase'

// Cache for instant loading
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// Cache TTL in milliseconds
const CACHE_TTL = {
  DASHBOARD: 30000, // 30 seconds
  ORDERS: 10000,    // 10 seconds
  MENU: 60000,      // 1 minute
  USERS: 30000,     // 30 seconds
  ANALYTICS: 60000, // 1 minute
}

// Ultra-fast cache helper
function getCached<T>(key: string, ttl: number): T | null {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data
  }
  return null
}

function setCache<T>(key: string, data: T, ttl: number): void {
  cache.set(key, { data, timestamp: Date.now(), ttl })
}

// Fast dashboard data
export async function getFastDashboardData(userRole: 'admin' | 'cafeteria', userId?: string) {
  const cacheKey = `dashboard-${userRole}-${userId}`
  const cached = getCached(cacheKey, CACHE_TTL.DASHBOARD)
  
  if (cached) {
    return { data: cached, fromCache: true }
  }

  try {
    let data: any = {}

    if (userRole === 'admin') {
      // Parallel queries for admin dashboard
      const [usersResult, cafeteriasResult, ordersResult] = await Promise.all([
        supabase.from('profiles').select('id, role').limit(1000),
        supabase.from('cafeterias').select('id, name, status').limit(100),
        supabase.from('orders').select('id, total_amount, status, created_at').limit(1000)
      ])

      data = {
        totalUsers: usersResult.data?.length || 0,
        totalCafeterias: cafeteriasResult.data?.length || 0,
        totalOrders: ordersResult.data?.length || 0,
        revenue: ordersResult.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
        recentOrders: ordersResult.data?.slice(0, 5) || []
      }
    } else {
      // Parallel queries for cafeteria dashboard
      const [ordersResult, menuResult] = await Promise.all([
        supabase.from('orders').select('id, total_amount, status, created_at').eq('cafeteria_id', userId).limit(500),
        supabase.from('menu_items').select('id, name, price').eq('cafeteria_id', userId).limit(100)
      ])

      data = {
        totalOrders: ordersResult.data?.length || 0,
        totalMenuItems: menuResult.data?.length || 0,
        revenue: ordersResult.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
        recentOrders: ordersResult.data?.slice(0, 5) || []
      }
    }

    setCache(cacheKey, data, CACHE_TTL.DASHBOARD)
    return { data, fromCache: false }
  } catch (error) {
    console.error('Fast dashboard data error:', error)
    return { data: null, error }
  }
}

// Fast orders data
export async function getFastOrders(cafeteriaId?: string, status?: string) {
  const cacheKey = `orders-${cafeteriaId}-${status}`
  const cached = getCached(cacheKey, CACHE_TTL.ORDERS)
  
  if (cached) {
    return { data: cached, fromCache: true }
  }

  try {
    let query = supabase
      .from('orders')
      .select(`
        id,
        user_id,
        total_amount,
        status,
        created_at,
        order_items(quantity, price, item_id)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (cafeteriaId) {
      query = query.eq('cafeteria_id', cafeteriaId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    setCache(cacheKey, data, CACHE_TTL.ORDERS)
    return { data, fromCache: false }
  } catch (error) {
    console.error('Fast orders error:', error)
    return { data: null, error }
  }
}

// Fast menu data
export async function getFastMenu(cafeteriaId: string) {
  const cacheKey = `menu-${cafeteriaId}`
  const cached = getCached(cacheKey, CACHE_TTL.MENU)
  
  if (cached) {
    return { data: cached, fromCache: true }
  }

  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('cafeteria_id', cafeteriaId)
      .order('name')
      .limit(200)

    if (error) throw error

    setCache(cacheKey, data, CACHE_TTL.MENU)
    return { data, fromCache: false }
  } catch (error) {
    console.error('Fast menu error:', error)
    return { data: null, error }
  }
}

// Fast users data
export async function getFastUsers(limit = 100) {
  const cacheKey = `users-${limit}`
  const cached = getCached(cacheKey, CACHE_TTL.USERS)
  
  if (cached) {
    return { data: cached, fromCache: true }
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    setCache(cacheKey, data, CACHE_TTL.USERS)
    return { data, fromCache: false }
  } catch (error) {
    console.error('Fast users error:', error)
    return { data: null, error }
  }
}

// Preload critical data
export function preloadCriticalData(userRole: 'admin' | 'cafeteria', userId?: string) {
  // Preload dashboard data
  getFastDashboardData(userRole, userId)
  
  if (userRole === 'admin') {
    // Preload admin data
    getFastUsers(50)
  } else if (userId) {
    // Preload cafeteria data
    getFastMenu(userId)
    getFastOrders(userId)
  }
}

// Clear cache when needed
export function clearCache(pattern?: string) {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key)
      }
    }
  } else {
    cache.clear()
  }
}

// Cache stats for debugging
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
    memory: JSON.stringify(Array.from(cache.values())).length
  }
}
