// Dynamic Pricing Rules System
import { supabase } from './supabase'

export interface PricingRule {
  id: string
  cafeteria_id: string
  name: string
  description: string
  type: 'time_based' | 'demand_based' | 'inventory_based' | 'seasonal' | 'bulk_discount' | 'loyalty'
  conditions: PricingConditions
  action: PricingAction
  priority: number
  active: boolean
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
}

export interface PricingConditions {
  time_range?: { start: string; end: string; days: string[] }
  demand_threshold?: { min_orders?: number; max_orders?: number; time_window: number }
  inventory_level?: { item_id: string; threshold: number; operator: 'below' | 'above' }
  season?: { start_month: number; end_month: number }
  quantity?: { min_quantity: number }
  customer_tier?: string[]
  menu_categories?: string[]
  menu_items?: string[]
}

export interface PricingAction {
  type: 'percentage' | 'fixed_amount' | 'fixed_price'
  value: number
  max_discount?: number
  min_price?: number
  max_price?: number
}

export interface PriceCalculationResult {
  original_price: number
  final_price: number
  applied_rules: AppliedRule[]
  total_discount: number
  discount_percentage: number
}

export interface AppliedRule {
  rule_id: string
  rule_name: string
  discount_amount: number
  discount_type: string
}

// Create a new pricing rule
export const createPricingRule = async (
  rule: Omit<PricingRule, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; rule?: PricingRule; error?: string }> => {
  try {
    // Validate the rule
    const validation = validatePricingRule(rule)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    const { data, error } = await supabase
      .from('pricing_rules')
      .insert([rule])
      .select()
      .single()

    if (error) throw error

    return { success: true, rule: data }
  } catch (error) {
    console.error('Error creating pricing rule:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Get all pricing rules for a cafeteria
export const getPricingRules = async (
  cafeteriaId: string,
  activeOnly: boolean = false
): Promise<PricingRule[]> => {
  try {
    let query = supabase
      .from('pricing_rules')
      .select('*')
      .eq('cafeteria_id', cafeteriaId)
      .order('priority', { ascending: false })

    if (activeOnly) {
      query = query.eq('active', true)
    }

    const { data: rules, error } = await query

    if (error) throw error
    return rules || []
  } catch (error) {
    console.error('Error getting pricing rules:', error)
    return []
  }
}

// Calculate dynamic price for a menu item
export const calculateDynamicPrice = async (
  menuItemId: string,
  quantity: number = 1,
  userId?: string,
  orderTime?: Date
): Promise<PriceCalculationResult> => {
  try {
    // Get menu item details
    const { data: menuItem, error: menuError } = await supabase
      .from('menu_items')
      .select('*, cafeterias(*)')
      .eq('id', menuItemId)
      .single()

    if (menuError || !menuItem) {
      throw new Error('Menu item not found')
    }

    const originalPrice = menuItem.price
    const cafeteriaId = menuItem.cafeteria_id
    const checkTime = orderTime || new Date()

    // Get active pricing rules for this cafeteria
    const rules = await getPricingRules(cafeteriaId, true)

    // Filter applicable rules
    const applicableRules = await filterApplicableRules(
      rules,
      menuItem,
      quantity,
      userId,
      checkTime
    )

    // Apply rules in priority order
    let finalPrice = originalPrice
    const appliedRules: AppliedRule[] = []
    let totalDiscount = 0

    for (const rule of applicableRules) {
      const ruleResult = applyPricingRule(rule, finalPrice, originalPrice, quantity)
      
      if (ruleResult.discount > 0) {
        appliedRules.push({
          rule_id: rule.id,
          rule_name: rule.name,
          discount_amount: ruleResult.discount,
          discount_type: rule.action.type
        })
        
        finalPrice = ruleResult.newPrice
        totalDiscount += ruleResult.discount
      }
    }

    // Ensure final price doesn't go below minimum
    const minPrice = Math.max(originalPrice * 0.1, 1) // Minimum 10% of original or 1 EGP
    finalPrice = Math.max(finalPrice, minPrice)

    const discountPercentage = originalPrice > 0 ? (totalDiscount / originalPrice) * 100 : 0

    return {
      original_price: originalPrice,
      final_price: finalPrice,
      applied_rules: appliedRules,
      total_discount: totalDiscount,
      discount_percentage: discountPercentage
    }
  } catch (error) {
    console.error('Error calculating dynamic price:', error)
    // Return original price if calculation fails
    const { data: menuItem } = await supabase
      .from('menu_items')
      .select('price')
      .eq('id', menuItemId)
      .single()

    const originalPrice = menuItem?.price || 0

    return {
      original_price: originalPrice,
      final_price: originalPrice,
      applied_rules: [],
      total_discount: 0,
      discount_percentage: 0
    }
  }
}

// Filter rules that apply to current context
const filterApplicableRules = async (
  rules: PricingRule[],
  menuItem: any,
  quantity: number,
  userId?: string,
  checkTime: Date = new Date()
): Promise<PricingRule[]> => {
  const applicableRules: PricingRule[] = []

  for (const rule of rules) {
    let isApplicable = true

    // Check date range
    if (rule.start_date && new Date(rule.start_date) > checkTime) {
      isApplicable = false
    }
    if (rule.end_date && new Date(rule.end_date) < checkTime) {
      isApplicable = false
    }

    // Check conditions
    if (isApplicable && rule.conditions) {
      isApplicable = await checkRuleConditions(rule.conditions, menuItem, quantity, userId, checkTime)
    }

    if (isApplicable) {
      applicableRules.push(rule)
    }
  }

  return applicableRules.sort((a, b) => b.priority - a.priority)
}

// Check if rule conditions are met
const checkRuleConditions = async (
  conditions: PricingConditions,
  menuItem: any,
  quantity: number,
  userId?: string,
  checkTime: Date
): Promise<boolean> => {
  // Time-based conditions
  if (conditions.time_range) {
    const currentTime = checkTime.toTimeString().slice(0, 5) // HH:MM
    const currentDay = checkTime.toLocaleDateString('en-US', { weekday: 'lowercase' })
    
    const isTimeInRange = currentTime >= conditions.time_range.start && 
                         currentTime <= conditions.time_range.end
    const isDayIncluded = conditions.time_range.days.includes(currentDay)
    
    if (!isTimeInRange || !isDayIncluded) {
      return false
    }
  }

  // Demand-based conditions
  if (conditions.demand_threshold) {
    const orderCount = await getRecentOrderCount(
      menuItem.cafeteria_id,
      conditions.demand_threshold.time_window
    )
    
    if (conditions.demand_threshold.min_orders && orderCount < conditions.demand_threshold.min_orders) {
      return false
    }
    if (conditions.demand_threshold.max_orders && orderCount > conditions.demand_threshold.max_orders) {
      return false
    }
  }

  // Inventory-based conditions
  if (conditions.inventory_level) {
    const inventoryLevel = await getInventoryLevel(conditions.inventory_level.item_id)
    
    if (conditions.inventory_level.operator === 'below' && 
        inventoryLevel >= conditions.inventory_level.threshold) {
      return false
    }
    if (conditions.inventory_level.operator === 'above' && 
        inventoryLevel <= conditions.inventory_level.threshold) {
      return false
    }
  }

  // Seasonal conditions
  if (conditions.season) {
    const currentMonth = checkTime.getMonth() + 1 // 1-12
    if (currentMonth < conditions.season.start_month || 
        currentMonth > conditions.season.end_month) {
      return false
    }
  }

  // Quantity conditions
  if (conditions.quantity && quantity < conditions.quantity.min_quantity) {
    return false
  }

  // Customer tier conditions
  if (conditions.customer_tier && userId) {
    const customerTier = await getCustomerTier(userId)
    if (!conditions.customer_tier.includes(customerTier)) {
      return false
    }
  }

  // Menu category conditions
  if (conditions.menu_categories && 
      !conditions.menu_categories.includes(menuItem.category)) {
    return false
  }

  // Menu item conditions
  if (conditions.menu_items && 
      !conditions.menu_items.includes(menuItem.id)) {
    return false
  }

  return true
}

// Apply a pricing rule to calculate new price
const applyPricingRule = (
  rule: PricingRule,
  currentPrice: number,
  originalPrice: number,
  quantity: number
): { newPrice: number; discount: number } => {
  let newPrice = currentPrice
  let discount = 0

  switch (rule.action.type) {
    case 'percentage':
      discount = currentPrice * (rule.action.value / 100)
      newPrice = currentPrice - discount
      break
      
    case 'fixed_amount':
      discount = rule.action.value
      newPrice = currentPrice - discount
      break
      
    case 'fixed_price':
      newPrice = rule.action.value
      discount = currentPrice - newPrice
      break
  }

  // Apply constraints
  if (rule.action.max_discount && discount > rule.action.max_discount) {
    discount = rule.action.max_discount
    newPrice = currentPrice - discount
  }

  if (rule.action.min_price && newPrice < rule.action.min_price) {
    newPrice = rule.action.min_price
    discount = currentPrice - newPrice
  }

  if (rule.action.max_price && newPrice > rule.action.max_price) {
    newPrice = rule.action.max_price
    discount = currentPrice - newPrice
  }

  // Ensure discount is not negative
  discount = Math.max(0, discount)
  newPrice = Math.max(0, newPrice)

  return { newPrice, discount }
}

// Helper functions
const getRecentOrderCount = async (cafeteriaId: string, timeWindowHours: number): Promise<number> => {
  try {
    const startTime = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000)
    
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .eq('cafeteria_id', cafeteriaId)
      .gte('created_at', startTime.toISOString())

    if (error) throw error
    return data?.length || 0
  } catch (error) {
    console.error('Error getting recent order count:', error)
    return 0
  }
}

const getInventoryLevel = async (itemId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('quantity')
      .eq('id', itemId)
      .single()

    if (error) throw error
    return data?.quantity || 0
  } catch (error) {
    console.error('Error getting inventory level:', error)
    return 0
  }
}

const getCustomerTier = async (userId: string): Promise<string> => {
  try {
    // Get customer order history to determine tier
    const { data, error } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('user_id', userId)
      .eq('status', 'completed')

    if (error) throw error

    const totalSpent = data?.reduce((sum, order) => sum + order.total_amount, 0) || 0
    const orderCount = data?.length || 0

    // Determine tier based on spending and order count
    if (totalSpent >= 1000 || orderCount >= 50) return 'gold'
    if (totalSpent >= 500 || orderCount >= 20) return 'silver'
    if (totalSpent >= 100 || orderCount >= 5) return 'bronze'
    return 'standard'
  } catch (error) {
    console.error('Error getting customer tier:', error)
    return 'standard'
  }
}

// Validate pricing rule
const validatePricingRule = (rule: Omit<PricingRule, 'id' | 'created_at' | 'updated_at'>): { valid: boolean; error?: string } => {
  if (!rule.name || rule.name.trim().length === 0) {
    return { valid: false, error: 'Rule name is required' }
  }

  if (!rule.cafeteria_id) {
    return { valid: false, error: 'Cafeteria ID is required' }
  }

  if (!rule.action || typeof rule.action.value !== 'number') {
    return { valid: false, error: 'Valid action with numeric value is required' }
  }

  if (rule.action.value < 0) {
    return { valid: false, error: 'Action value cannot be negative' }
  }

  if (rule.action.type === 'percentage' && rule.action.value > 100) {
    return { valid: false, error: 'Percentage discount cannot exceed 100%' }
  }

  if (rule.priority < 0 || rule.priority > 100) {
    return { valid: false, error: 'Priority must be between 0 and 100' }
  }

  return { valid: true }
}

// Update pricing rule
export const updatePricingRule = async (
  ruleId: string,
  updates: Partial<PricingRule>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('pricing_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', ruleId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error updating pricing rule:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Delete pricing rule
export const deletePricingRule = async (ruleId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('pricing_rules')
      .delete()
      .eq('id', ruleId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error deleting pricing rule:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
