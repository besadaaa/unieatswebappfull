import { useState, useEffect, useCallback } from 'react'
import { AutoInventoryManager, InventoryAlert } from '@/lib/auto-inventory-service'

// Hook for automatic inventory checking
export function useAutoInventory(cafeteriaId?: string) {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    if (!cafeteriaId) return

    try {
      setLoading(true)
      setError(null)
      const alertsData = await AutoInventoryManager.getInventoryAlerts(cafeteriaId)
      setAlerts(alertsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts')
    } finally {
      setLoading(false)
    }
  }, [cafeteriaId])

  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      const success = await AutoInventoryManager.resolveAlert(alertId)
      if (success) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId))
        return { success: true, message: 'Alert resolved successfully' }
      } else {
        return { success: false, message: 'Failed to resolve alert' }
      }
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Failed to resolve alert' }
    }
  }, [])

  const updateAllAvailability = useCallback(async () => {
    if (!cafeteriaId) return { success: false, message: 'Cafeteria ID required' }

    try {
      setLoading(true)
      const result = await AutoInventoryManager.updateAllMenuItemsAvailability(cafeteriaId)
      return result
    } catch (err) {
      return { success: false, updated: 0, errors: [err instanceof Error ? err.message : 'Update failed'] }
    } finally {
      setLoading(false)
    }
  }, [cafeteriaId])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  return {
    alerts,
    loading,
    error,
    refetchAlerts: fetchAlerts,
    resolveAlert,
    updateAllAvailability
  }
}

// Hook for menu item availability checking
export function useMenuItemAvailability(menuItemId?: string) {
  const [availability, setAvailability] = useState<{
    available: boolean
    missingIngredients: string[]
    lowStockIngredients: string[]
    details: { ingredient: string; needed: number; available: number; unit: string }[]
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkAvailability = useCallback(async () => {
    if (!menuItemId) return

    try {
      setLoading(true)
      setError(null)
      const result = await AutoInventoryManager.checkMenuItemAvailability(menuItemId)
      setAvailability(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check availability')
    } finally {
      setLoading(false)
    }
  }, [menuItemId])

  const updateAvailability = useCallback(async () => {
    if (!menuItemId) return false

    try {
      const success = await AutoInventoryManager.updateMenuItemAvailability(menuItemId)
      if (success) {
        await checkAvailability()
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update availability')
      return false
    }
  }, [menuItemId, checkAvailability])

  useEffect(() => {
    checkAvailability()
  }, [checkAvailability])

  return {
    availability,
    loading,
    error,
    checkAvailability,
    updateAvailability
  }
}

// Hook for linking menu items to inventory
export function useInventoryLinking() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const linkIngredients = useCallback(async (
    menuItemId: string,
    ingredients: { inventoryItemId: string; quantityNeeded: number; unit: string; isOptional?: boolean }[]
  ) => {
    try {
      setLoading(true)
      setError(null)
      const result = await AutoInventoryManager.linkMenuItemToInventory(menuItemId, ingredients)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to link ingredients'
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    linkIngredients
  }
}

// Hook for inventory restocking
export function useInventoryRestock() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const restockItem = useCallback(async (
    inventoryItemId: string,
    quantity: number,
    notes?: string
  ) => {
    try {
      setLoading(true)
      setError(null)
      const result = await AutoInventoryManager.restockInventoryItem(inventoryItemId, quantity, notes)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restock item'
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    restockItem
  }
}

// Hook for order inventory deduction
export function useOrderInventoryDeduction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deductForOrder = useCallback(async (orderId: string) => {
    try {
      setLoading(true)
      setError(null)
      const result = await AutoInventoryManager.deductInventoryForOrder(orderId)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deduct inventory'
      setError(errorMessage)
      return { success: false, message: errorMessage, affectedItems: [] }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    deductForOrder
  }
}

// Combined hook for comprehensive inventory management
export function useInventoryManagement(cafeteriaId?: string) {
  const autoInventory = useAutoInventory(cafeteriaId)
  const linking = useInventoryLinking()
  const restock = useInventoryRestock()
  const orderDeduction = useOrderInventoryDeduction()

  return {
    // Auto inventory features
    alerts: autoInventory.alerts,
    alertsLoading: autoInventory.loading,
    alertsError: autoInventory.error,
    refetchAlerts: autoInventory.refetchAlerts,
    resolveAlert: autoInventory.resolveAlert,
    updateAllAvailability: autoInventory.updateAllAvailability,

    // Linking features
    linkingLoading: linking.loading,
    linkingError: linking.error,
    linkIngredients: linking.linkIngredients,

    // Restocking features
    restockLoading: restock.loading,
    restockError: restock.error,
    restockItem: restock.restockItem,

    // Order deduction features
    deductionLoading: orderDeduction.loading,
    deductionError: orderDeduction.error,
    deductForOrder: orderDeduction.deductForOrder
  }
}
