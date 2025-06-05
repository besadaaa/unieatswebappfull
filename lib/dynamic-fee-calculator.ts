// Dynamic Fee Calculator - Uses settings service for configurable rates
import SettingsService from './settings-service'

export interface OrderFeeBreakdown {
  subtotal: number
  serviceFee: number
  commission: number
  totalAmount: number
  cafeteriaRevenue: number
  adminRevenue: number
  serviceFeeRate: number
  serviceFeeCap: number
  commissionRate: number
}

export class DynamicFeeCalculator {
  // Calculate all order fees using dynamic rates from settings
  static async calculateOrderFees(subtotal: number): Promise<OrderFeeBreakdown> {
    try {
      // Get dynamic rates from settings
      const serviceFeeRate = await SettingsService.getServiceFeeRate()
      const serviceFeeCap = await SettingsService.getServiceFeeCap()
      const commissionRate = await SettingsService.getCommissionRate()

      // Calculate service fee (charged to student)
      const serviceFee = Math.min(subtotal * serviceFeeRate, serviceFeeCap)
      
      // Calculate commission (taken from cafeteria)
      const commission = subtotal * commissionRate
      
      // Calculate totals
      const totalAmount = subtotal + serviceFee
      const cafeteriaRevenue = subtotal - commission
      const adminRevenue = serviceFee + commission

      return {
        subtotal,
        serviceFee,
        commission,
        totalAmount,
        cafeteriaRevenue,
        adminRevenue,
        serviceFeeRate,
        serviceFeeCap,
        commissionRate
      }
    } catch (error) {
      console.error('Error calculating fees:', error)
      
      // Fallback to default rates if settings fail
      const defaultServiceFeeRate = 0.04 // 4%
      const defaultServiceFeeCap = 20.00 // 20 EGP
      const defaultCommissionRate = 0.10 // 10%

      const serviceFee = Math.min(subtotal * defaultServiceFeeRate, defaultServiceFeeCap)
      const commission = subtotal * defaultCommissionRate
      const totalAmount = subtotal + serviceFee
      const cafeteriaRevenue = subtotal - commission
      const adminRevenue = serviceFee + commission

      return {
        subtotal,
        serviceFee,
        commission,
        totalAmount,
        cafeteriaRevenue,
        adminRevenue,
        serviceFeeRate: defaultServiceFeeRate,
        serviceFeeCap: defaultServiceFeeCap,
        commissionRate: defaultCommissionRate
      }
    }
  }

  // Calculate just the service fee for display purposes
  static async calculateServiceFee(subtotal: number): Promise<number> {
    try {
      const serviceFeeRate = await SettingsService.getServiceFeeRate()
      const serviceFeeCap = await SettingsService.getServiceFeeCap()
      return Math.min(subtotal * serviceFeeRate, serviceFeeCap)
    } catch (error) {
      console.error('Error calculating service fee:', error)
      return Math.min(subtotal * 0.04, 20.00) // Fallback
    }
  }

  // Calculate just the commission for display purposes
  static async calculateCommission(subtotal: number): Promise<number> {
    try {
      const commissionRate = await SettingsService.getCommissionRate()
      return subtotal * commissionRate
    } catch (error) {
      console.error('Error calculating commission:', error)
      return subtotal * 0.10 // Fallback
    }
  }

  // Get current fee rates for display
  static async getCurrentRates() {
    try {
      return {
        serviceFeeRate: await SettingsService.getServiceFeeRate(),
        serviceFeeCap: await SettingsService.getServiceFeeCap(),
        commissionRate: await SettingsService.getCommissionRate()
      }
    } catch (error) {
      console.error('Error getting current rates:', error)
      return {
        serviceFeeRate: 0.04,
        serviceFeeCap: 20.00,
        commissionRate: 0.10
      }
    }
  }

  // Format fee breakdown for display
  static formatFeeBreakdown(breakdown: OrderFeeBreakdown) {
    return {
      subtotal: `${breakdown.subtotal.toFixed(2)} EGP`,
      serviceFee: `${breakdown.serviceFee.toFixed(2)} EGP (${(breakdown.serviceFeeRate * 100).toFixed(1)}%, max ${breakdown.serviceFeeCap} EGP)`,
      commission: `${breakdown.commission.toFixed(2)} EGP (${(breakdown.commissionRate * 100).toFixed(1)}%)`,
      totalAmount: `${breakdown.totalAmount.toFixed(2)} EGP`,
      cafeteriaRevenue: `${breakdown.cafeteriaRevenue.toFixed(2)} EGP`,
      adminRevenue: `${breakdown.adminRevenue.toFixed(2)} EGP`
    }
  }

  // Calculate revenue split for analytics
  static async calculateRevenueSplit(orders: Array<{ total_amount: number, status: string }>) {
    try {
      const commissionRate = await SettingsService.getCommissionRate()
      const serviceFeeRate = await SettingsService.getServiceFeeRate()
      const serviceFeeCap = await SettingsService.getServiceFeeCap()

      let totalRevenue = 0
      let totalCommission = 0
      let totalServiceFees = 0
      let cafeteriaRevenue = 0

      // Only include completed orders
      const completedOrders = orders.filter(order => 
        order.status === 'completed' || order.status === 'delivered'
      )

      for (const order of completedOrders) {
        const subtotal = order.total_amount
        const serviceFee = Math.min(subtotal * serviceFeeRate, serviceFeeCap)
        const commission = subtotal * commissionRate
        
        totalRevenue += order.total_amount
        totalServiceFees += serviceFee
        totalCommission += commission
        cafeteriaRevenue += (subtotal - commission)
      }

      const adminRevenue = totalServiceFees + totalCommission

      return {
        totalRevenue,
        cafeteriaRevenue,
        adminRevenue,
        totalServiceFees,
        totalCommission,
        orderCount: completedOrders.length,
        averageOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0
      }
    } catch (error) {
      console.error('Error calculating revenue split:', error)
      return {
        totalRevenue: 0,
        cafeteriaRevenue: 0,
        adminRevenue: 0,
        totalServiceFees: 0,
        totalCommission: 0,
        orderCount: 0,
        averageOrderValue: 0
      }
    }
  }
}

export default DynamicFeeCalculator
