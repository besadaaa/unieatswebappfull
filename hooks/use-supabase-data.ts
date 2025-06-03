import { useState, useEffect, useCallback } from 'react'
import { DataService } from '@/lib/data-service'
import { supabase } from '@/lib/supabase'

interface UseSupabaseDataOptions {
  autoFetch?: boolean
  cacheEnabled?: boolean
  refreshInterval?: number
}

export function useCafeterias(options: UseSupabaseDataOptions = {}) {
  const { autoFetch = true, cacheEnabled = true, refreshInterval } = options
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await DataService.getCafeterias(cacheEnabled)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cafeterias')
    } finally {
      setLoading(false)
    }
  }, [cacheEnabled])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [autoFetch, fetchData])

  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshInterval, fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    isEmpty: data.length === 0
  }
}

export function useMenuItems(cafeteriaId?: string, options: UseSupabaseDataOptions = {}) {
  const { autoFetch = true, cacheEnabled = true, refreshInterval } = options
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await DataService.getMenuItems(cafeteriaId, cacheEnabled)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch menu items')
    } finally {
      setLoading(false)
    }
  }, [cafeteriaId, cacheEnabled])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [autoFetch, fetchData])

  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshInterval, fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    isEmpty: data.length === 0
  }
}

export function useOrders(userId?: string, cafeteriaId?: string, options: UseSupabaseDataOptions = {}) {
  const { autoFetch = true, refreshInterval } = options
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await DataService.getOrders(userId, cafeteriaId)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [userId, cafeteriaId])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [autoFetch, fetchData])

  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshInterval, fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    isEmpty: data.length === 0
  }
}

export function useSupabaseConnection() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testConnection = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await DataService.testConnection()
      setIsConnected(result.success)
      if (!result.success) {
        setError(result.error)
      }
    } catch (err) {
      setIsConnected(false)
      setError(err instanceof Error ? err.message : 'Connection test failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    testConnection()
  }, [testConnection])

  return {
    isConnected,
    loading,
    error,
    testConnection
  }
}

export function useRealtimeSubscription(table: string, callback: (payload: any) => void) {
  useEffect(() => {
    const subscription = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table }, 
        callback
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [table, callback])
}

// Admin hook for comprehensive data
export function useAdminData(options: UseSupabaseDataOptions = {}) {
  const { autoFetch = true, refreshInterval } = options
  const [data, setData] = useState<any>({
    cafeterias: [],
    orders: [],
    users: [],
    errors: {}
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await DataService.getAdminData()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [autoFetch, fetchData])

  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshInterval, fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}
