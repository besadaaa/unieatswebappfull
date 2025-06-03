// Financial Transaction System with Commission Calculations
import { supabase } from './supabase'

export interface FinancialTransaction {
  id: string
  order_id: string
  cafeteria_id: string
  user_id: string
  order_amount: number
  service_fee: number
  commission: number
  net_to_cafeteria: number
  platform_revenue: number
  status: 'pending' | 'processed' | 'failed' | 'refunded'
  payment_method: string
  processed_at?: string
  created_at: string
  updated_at: string
}

export interface RevenueBreakdown {
  orderAmount: number
  serviceFee: number
  commission: number
  netToCafeteria: number
  platformRevenue: number
}

// Revenue Model: 4% service fee (capped at 20 EGP) + 10% commission
export const calculateRevenueBreakdown = (orderAmount: number): RevenueBreakdown => {
  // Service fee: 4% of order amount, capped at 20 EGP
  const serviceFeeRate = 0.04 // 4%
  const maxServiceFee = 20.00 // 20 EGP cap
  const serviceFee = Math.min(orderAmount * serviceFeeRate, maxServiceFee)
  
  // Commission: 10% of order amount (paid by cafeteria)
  const commissionRate = 0.10 // 10%
  const commission = orderAmount * commissionRate
  
  // Net amount to cafeteria (order amount minus commission)
  const netToCafeteria = orderAmount - commission
  
  // Platform revenue (service fee from customer + commission from cafeteria)
  const platformRevenue = serviceFee + commission
  
  return {
    orderAmount,
    serviceFee,
    commission,
    netToCafeteria,
    platformRevenue
  }
}

// Create financial transaction when order is placed
export const createFinancialTransaction = async (
  orderId: string,
  cafeteriaId: string,
  userId: string,
  orderAmount: number,
  paymentMethod: string = 'cash_on_pickup'
): Promise<FinancialTransaction | null> => {
  try {
    const breakdown = calculateRevenueBreakdown(orderAmount)
    
    const transactionData = {
      order_id: orderId,
      cafeteria_id: cafeteriaId,
      user_id: userId,
      order_amount: breakdown.orderAmount,
      service_fee: breakdown.serviceFee,
      commission: breakdown.commission,
      net_to_cafeteria: breakdown.netToCafeteria,
      platform_revenue: breakdown.platformRevenue,
      status: 'pending',
      payment_method: paymentMethod
    }
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating financial transaction:', error)
      return null
    }
    
    // Log the transaction creation
    await logUserActivity(
      userId,
      'transaction_created',
      'financial_transaction',
      data.id,
      { order_amount: orderAmount, platform_revenue: breakdown.platformRevenue }
    )
    
    return data
  } catch (error) {
    console.error('Error in createFinancialTransaction:', error)
    return null
  }
}

// Process transaction (mark as completed)
export const processTransaction = async (transactionId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId)
      .select()
      .single()
    
    if (error) {
      console.error('Error processing transaction:', error)
      return false
    }
    
    // Log transaction processing
    await logUserActivity(
      data.user_id,
      'transaction_processed',
      'financial_transaction',
      transactionId,
      { amount: data.order_amount, status: 'processed' }
    )
    
    return true
  } catch (error) {
    console.error('Error in processTransaction:', error)
    return false
  }
}

// Get financial analytics for admin dashboard
export const getFinancialAnalytics = async (timeRange: string = '30') => {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(timeRange))
    
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        orders(created_at),
        cafeterias(name)
      `)
      .gte('created_at', startDate.toISOString())
      .eq('status', 'processed')
    
    if (error) throw error
    
    const analytics = {
      totalRevenue: transactions?.reduce((sum, t) => sum + t.platform_revenue, 0) || 0,
      totalServiceFees: transactions?.reduce((sum, t) => sum + t.service_fee, 0) || 0,
      totalCommissions: transactions?.reduce((sum, t) => sum + t.commission, 0) || 0,
      totalOrderValue: transactions?.reduce((sum, t) => sum + t.order_amount, 0) || 0,
      transactionCount: transactions?.length || 0,
      averageOrderValue: transactions?.length ? 
        (transactions.reduce((sum, t) => sum + t.order_amount, 0) / transactions.length) : 0,
      
      // Revenue by cafeteria
      revenueByCafeteria: transactions?.reduce((acc, t) => {
        const cafeteriaName = t.cafeterias?.name || 'Unknown'
        if (!acc[cafeteriaName]) {
          acc[cafeteriaName] = {
            totalOrders: 0,
            totalRevenue: 0,
            totalCommission: 0,
            netToCafeteria: 0
          }
        }
        acc[cafeteriaName].totalOrders += 1
        acc[cafeteriaName].totalRevenue += t.order_amount
        acc[cafeteriaName].totalCommission += t.commission
        acc[cafeteriaName].netToCafeteria += t.net_to_cafeteria
        return acc
      }, {} as Record<string, any>) || {},
      
      // Daily revenue trend
      dailyRevenue: transactions?.reduce((acc, t) => {
        const date = new Date(t.created_at).toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = {
            date,
            revenue: 0,
            orders: 0,
            serviceFees: 0,
            commissions: 0
          }
        }
        acc[date].revenue += t.platform_revenue
        acc[date].orders += 1
        acc[date].serviceFees += t.service_fee
        acc[date].commissions += t.commission
        return acc
      }, {} as Record<string, any>) || {}
    }
    
    return analytics
  } catch (error) {
    console.error('Error getting financial analytics:', error)
    return null
  }
}

// Get cafeteria financial summary
export const getCafeteriaFinancialSummary = async (cafeteriaId: string, timeRange: string = '30') => {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(timeRange))
    
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('cafeteria_id', cafeteriaId)
      .gte('created_at', startDate.toISOString())
      .eq('status', 'processed')
    
    if (error) throw error
    
    const summary = {
      totalOrders: transactions?.length || 0,
      totalRevenue: transactions?.reduce((sum, t) => sum + t.order_amount, 0) || 0,
      totalCommission: transactions?.reduce((sum, t) => sum + t.commission, 0) || 0,
      netEarnings: transactions?.reduce((sum, t) => sum + t.net_to_cafeteria, 0) || 0,
      averageOrderValue: transactions?.length ? 
        (transactions.reduce((sum, t) => sum + t.order_amount, 0) / transactions.length) : 0,
      
      // Commission rate (should be 10%)
      effectiveCommissionRate: transactions?.length ? 
        ((transactions.reduce((sum, t) => sum + t.commission, 0) / 
          transactions.reduce((sum, t) => sum + t.order_amount, 0)) * 100) : 0,
      
      // Daily breakdown
      dailyBreakdown: transactions?.reduce((acc, t) => {
        const date = new Date(t.created_at).toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = {
            date,
            orders: 0,
            revenue: 0,
            commission: 0,
            netEarnings: 0
          }
        }
        acc[date].orders += 1
        acc[date].revenue += t.order_amount
        acc[date].commission += t.commission
        acc[date].netEarnings += t.net_to_cafeteria
        return acc
      }, {} as Record<string, any>) || {}
    }
    
    return summary
  } catch (error) {
    console.error('Error getting cafeteria financial summary:', error)
    return null
  }
}

// User activity logging function
export const logUserActivity = async (
  userId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> => {
  try {
    const activityData = {
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details ? JSON.stringify(details) : null,
      ip_address: ipAddress,
      user_agent: userAgent,
      success: true
    }
    
    const { error } = await supabase
      .from('user_activity_logs')
      .insert([activityData])
    
    if (error) {
      console.error('Error logging user activity:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error in logUserActivity:', error)
    return false
  }
}

// Get user activity logs for admin
export const getUserActivityLogs = async (
  userId?: string,
  limit: number = 100,
  offset: number = 0
) => {
  try {
    let query = supabase
      .from('user_activity_logs')
      .select(`
        *,
        profiles(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('Error getting user activity logs:', error)
    return []
  }
}

// Create system notification
export const createSystemNotification = async (
  userId: string,
  type: 'order' | 'system' | 'promotion' | 'alert' | 'reminder',
  title: string,
  message: string,
  data?: any,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
): Promise<boolean> => {
  try {
    const notificationData = {
      user_id: userId,
      type,
      title,
      message,
      data: data ? JSON.stringify(data) : null,
      priority
    }
    
    const { error } = await supabase
      .from('system_notifications')
      .insert([notificationData])
    
    if (error) {
      console.error('Error creating system notification:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error in createSystemNotification:', error)
    return false
  }
}
