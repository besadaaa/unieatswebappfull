// Dynamic Settings Service - Uses existing tables to store configuration
import { supabase } from './supabase'

// Default configuration values
const DEFAULT_SETTINGS = {
  // Platform Settings
  platformName: "UniEats",
  platformUrl: "https://unieats.com",
  supportEmail: "support@unieats.com",
  timezone: "Africa/Cairo",
  dateFormat: "YYYY-MM-DD",
  maintenanceMode: false,
  newRegistrations: true,
  cafeteriaApplications: true,
  autoApprove: true,
  maintenanceMessage: "We're currently performing scheduled maintenance. Please check back soon.",
  
  // Financial Settings
  serviceFeeRate: 0.04,        // 4%
  serviceFeeCap: 20.00,        // 20 EGP
  commissionRate: 0.10,        // 10%
  minimumOrderAmount: 0.00,
  
  // Performance Settings
  apiTimeout: 10000,           // 10 seconds
  retryAttempts: 3,
  retryDelay: 1000,
  cacheTtl: 300000,           // 5 minutes
  
  // Rate Limiting
  apiRateLimit: 100,          // requests per 15 minutes
  authRateLimit: 5,           // auth attempts per 15 minutes
  uploadRateLimit: 10,        // uploads per minute
  
  // UI Settings
  defaultPreparationTime: 15,  // minutes
  dataRetentionDays: 90,
  imageQuality: 75,
  
  // Categories
  menuCategories: [
    "Breakfast", "Lunch", "Dinner", "Snacks", 
    "Beverages", "Desserts", "Vegan", "Vegetarian",
    "Gluten-Free", "Keto-Friendly", "Low-Calorie", "Protein-Rich"
  ],
  
  inventoryCategories: [
    "produce", "meat", "dairy", "bakery", "grains",
    "beverages", "condiments", "frozen", "other"
  ],
  
  cafeteriaCategories: [
    "All", "Fast Food", "Healthy", "Desserts", "Beverages", "Asian"
  ]
}

// Settings cache
let settingsCache: Record<string, any> = {}
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export class SettingsService {
  // Get a setting value with fallback to default
  static async getSetting(key: string, defaultValue?: any): Promise<any> {
    try {
      // Check cache first
      const now = Date.now()
      if (now - cacheTimestamp < CACHE_DURATION && settingsCache[key] !== undefined) {
        return settingsCache[key]
      }

      // Try to get from cafeteria_settings table first (for cafeteria-specific settings)
      const { data: cafeteriaSettings } = await supabase
        .from('cafeteria_settings')
        .select('*')
        .limit(1)
        .single()

      if (cafeteriaSettings && cafeteriaSettings[key] !== undefined) {
        settingsCache[key] = cafeteriaSettings[key]
        cacheTimestamp = now
        return cafeteriaSettings[key]
      }

      // Fallback to default value
      const fallbackValue = defaultValue !== undefined ? defaultValue : DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS]
      settingsCache[key] = fallbackValue
      cacheTimestamp = now
      
      return fallbackValue
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error)
      return defaultValue !== undefined ? defaultValue : DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS]
    }
  }

  // Get multiple settings at once
  static async getSettings(keys: string[]): Promise<Record<string, any>> {
    const settings: Record<string, any> = {}
    
    for (const key of keys) {
      settings[key] = await this.getSetting(key)
    }
    
    return settings
  }

  // Get all platform settings
  static async getPlatformSettings() {
    return await this.getSettings([
      'platformName', 'platformUrl', 'supportEmail', 'timezone', 
      'dateFormat', 'maintenanceMode', 'newRegistrations', 
      'cafeteriaApplications', 'autoApprove', 'maintenanceMessage'
    ])
  }

  // Get financial settings
  static async getFinancialSettings() {
    return await this.getSettings([
      'serviceFeeRate', 'serviceFeeCap', 'commissionRate', 'minimumOrderAmount'
    ])
  }

  // Get performance settings
  static async getPerformanceSettings() {
    return await this.getSettings([
      'apiTimeout', 'retryAttempts', 'retryDelay', 'cacheTtl',
      'apiRateLimit', 'authRateLimit', 'uploadRateLimit'
    ])
  }

  // Get categories
  static async getMenuCategories(): Promise<string[]> {
    return await this.getSetting('menuCategories', DEFAULT_SETTINGS.menuCategories)
  }

  static async getInventoryCategories(): Promise<string[]> {
    return await this.getSetting('inventoryCategories', DEFAULT_SETTINGS.inventoryCategories)
  }

  static async getCafeteriaCategories(): Promise<string[]> {
    return await this.getSetting('cafeteriaCategories', DEFAULT_SETTINGS.cafeteriaCategories)
  }

  // Specific getters for commonly used settings
  static async getServiceFeeRate(): Promise<number> {
    return await this.getSetting('serviceFeeRate', 0.04)
  }

  static async getServiceFeeCap(): Promise<number> {
    return await this.getSetting('serviceFeeCap', 20.00)
  }

  static async getCommissionRate(): Promise<number> {
    return await this.getSetting('commissionRate', 0.10)
  }

  static async getDefaultPreparationTime(): Promise<number> {
    return await this.getSetting('defaultPreparationTime', 15)
  }

  // Update a setting (stores in cafeteria_settings table)
  static async updateSetting(key: string, value: any): Promise<boolean> {
    try {
      // Clear cache
      delete settingsCache[key]
      cacheTimestamp = 0

      // For now, we'll store settings as JSON in the cafeteria_settings table
      // This is a workaround since we can't create new tables
      const { error } = await supabase
        .from('cafeteria_settings')
        .upsert({
          [key]: value,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error(`Error updating setting ${key}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error)
      return false
    }
  }

  // Clear settings cache
  static clearCache() {
    settingsCache = {}
    cacheTimestamp = 0
  }

  // Calculate order fees using dynamic rates
  static async calculateOrderFees(subtotal: number) {
    const serviceFeeRate = await this.getServiceFeeRate()
    const serviceFeeCap = await this.getServiceFeeCap()
    const commissionRate = await this.getCommissionRate()

    const serviceFee = Math.min(subtotal * serviceFeeRate, serviceFeeCap)
    const commission = subtotal * commissionRate
    const totalAmount = subtotal + serviceFee
    const cafeteriaRevenue = subtotal - commission
    const adminRevenue = serviceFee + commission

    return {
      subtotal,
      serviceFee,
      commission,
      totalAmount,
      cafeteriaRevenue,
      adminRevenue
    }
  }
}

export default SettingsService
