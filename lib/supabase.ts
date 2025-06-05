import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Service role client for admin operations (bypasses RLS) - SERVER SIDE ONLY
export const createSupabaseAdmin = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Database types for type safety
export interface User {
  id: string
  email: string
  role: 'admin' | 'cafeteria_owner' | 'student'
  full_name: string
  created_at?: string
  updated_at?: string
}

export interface MenuItem {
  id: string
  cafeteria_id: string
  name: string
  description: string
  price: number
  category: string
  is_available: boolean
  image_url?: string
  rating?: number
  totalRatings?: number
  nutrition_info?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    fiber?: number
    sugar?: number
  }
  ingredients?: string[]
  customization_options?: {
    name: string
    options: { name: string; price: number }[]
  }[]
  created_at?: string
}

export interface InventoryItem {
  id: string
  cafeteria_id: string
  name: string
  category: string
  quantity: number
  unit: string
  min_quantity: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  created_at?: string
  updated_at?: string
}

export interface Order {
  id: string
  cafeteria_id: string
  user_id: string
  status: 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  total_amount: number
  created_at: string
  updated_at: string
  user?: User
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  price: number
  menu_item?: MenuItem
}

export interface Cafeteria {
  id: string
  name: string
  location: string
  owner_id: string
  status: 'active' | 'inactive' | 'pending'
  created_at?: string
  updated_at?: string
}

export interface StudentMessage {
  id: string
  user_id: string
  user_name: string
  user_type: string
  user_avatar?: string
  subject: string
  content: string
  status: 'new' | 'in-progress' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  unread: boolean
  created_at: string
  updated_at: string
  responses?: MessageResponse[]
}

export interface MessageResponse {
  id: string
  message_id: string
  content: string
  is_admin: boolean
  admin_name?: string
  created_at: string
}

// New interfaces for additional features
export interface ThemePreference {
  id: string
  user_id: string
  theme: 'light' | 'dark'
  auto_switch: boolean
  created_at?: string
  updated_at?: string
}

export interface ContactSubmission {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'new' | 'in_progress' | 'resolved'
  ip_address?: string
  user_agent?: string
  created_at?: string
  updated_at?: string
}

export interface ChartAnnotation {
  id: string
  chart_id: string
  user_id: string
  annotation_type: 'point' | 'line' | 'range' | 'threshold'
  x_index?: number
  x_range?: number[]
  y_value?: number
  label: string
  color?: string
  description?: string
  created_at?: string
  updated_at?: string
}

export interface SystemSetting {
  id: string
  setting_key: string
  setting_value: any
  description?: string
  category: string
  is_public: boolean
  created_at?: string
  updated_at?: string
}

export interface InventoryItem {
  id: string
  cafeteria_id: string
  name: string
  category: string
  quantity: number
  unit: string
  min_quantity: number
  max_quantity?: number
  cost_per_unit?: number
  supplier?: string
  expiry_date?: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired'
  last_restocked?: string
  created_at?: string
  updated_at?: string
}

export interface ExportLog {
  id: string
  user_id?: string
  export_type: string
  file_format: string
  file_name?: string
  file_size?: number
  status: 'pending' | 'completed' | 'failed'
  error_message?: string
  download_url?: string
  expires_at?: string
  created_at?: string
}

// Connection test function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('cafeterias')
      .select('id, name')
      .limit(1)

    if (error) {
      console.error('Supabase connection test failed:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Supabase connection test error:', error)
    return { success: false, error: 'Connection failed' }
  }
}

// Auth helper functions
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error getting current user:', error)
      return null
    }

    if (!user) {
      return null
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error getting user profile:', profileError)
      // Return basic user info if profile fetch fails
      return {
        ...user,
        full_name: user.email?.split('@')[0] || 'User',
        role: 'student',
        avatar_url: null,
        phone: null,
        is_suspended: false,
        suspension_reason: null
      }
    }

    // Combine auth user with profile data
    return {
      ...user,
      ...profile
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    console.error('Error signing out:', error)
    return { error: 'Sign out failed' }
  }
}

// Theme preference functions
export const getUserThemePreference = async (userId: string): Promise<ThemePreference | null> => {
  try {
    const { data, error } = await supabase
      .from('theme_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // If table doesn't exist or no data, return default dark theme
      console.log('Theme preferences not found, using default dark theme')
      return {
        id: '',
        user_id: userId,
        theme: 'dark',
        auto_switch: false,
        created_at: '',
        updated_at: ''
      }
    }

    return data
  } catch (error) {
    console.log('Theme preferences error, using default dark theme:', error)
    return {
      id: '',
      user_id: userId,
      theme: 'dark',
      auto_switch: false,
      created_at: '',
      updated_at: ''
    }
  }
}

export const saveUserThemePreference = async (userId: string, theme: 'light' | 'dark', autoSwitch: boolean = false): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('theme_preferences')
      .upsert({
        user_id: userId,
        theme,
        auto_switch: autoSwitch,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.log('Theme preferences table not available, skipping save')
      return true // Return true to not break the app
    }

    return true
  } catch (error) {
    console.log('Theme preferences save error, continuing without saving:', error)
    return true // Return true to not break the app
  }
}

// Contact form functions
export const submitContactForm = async (formData: Omit<ContactSubmission, 'id' | 'status' | 'created_at' | 'updated_at'>): Promise<boolean> => {
  const { error } = await supabase
    .from('contact_submissions')
    .insert([formData])

  if (error) {
    console.error('Error submitting contact form:', error)
    return false
  }

  return true
}

// System settings functions
export const getSystemSetting = async (key: string): Promise<any> => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('setting_value')
    .eq('setting_key', key)
    .single()

  if (error) {
    console.error('Error fetching system setting:', error)
    return null
  }

  return data?.setting_value
}

export const getPublicSystemSettings = async (): Promise<Record<string, any>> => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('setting_key, setting_value')
    .eq('is_public', true)

  if (error) {
    console.error('Error fetching public system settings:', error)
    return {}
  }

  const settings: Record<string, any> = {}
  data?.forEach(setting => {
    settings[setting.setting_key] = setting.setting_value
  })

  return settings
}

export const updateSystemSetting = async (key: string, value: any): Promise<boolean> => {
  const { error } = await supabase
    .from('system_settings')
    .update({
      setting_value: value,
      updated_at: new Date().toISOString()
    })
    .eq('setting_key', key)

  if (error) {
    console.error('Error updating system setting:', error)
    return false
  }

  return true
}

// Chart annotation functions
export const getChartAnnotations = async (chartId: string): Promise<ChartAnnotation[]> => {
  const { data, error } = await supabase
    .from('chart_annotations')
    .select('*')
    .eq('chart_id', chartId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching chart annotations:', error)
    return []
  }

  return data || []
}

export const saveChartAnnotation = async (annotation: Omit<ChartAnnotation, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
  const { error } = await supabase
    .from('chart_annotations')
    .insert([annotation])

  if (error) {
    console.error('Error saving chart annotation:', error)
    return false
  }

  return true
}

export const updateChartAnnotation = async (id: string, updates: Partial<ChartAnnotation>): Promise<boolean> => {
  const { error } = await supabase
    .from('chart_annotations')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating chart annotation:', error)
    return false
  }

  return true
}

export const deleteChartAnnotation = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('chart_annotations')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting chart annotation:', error)
    return false
  }

  return true
}

// Inventory functions
export const getInventoryItems = async (cafeteriaId: string): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('cafeteria_id', cafeteriaId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching inventory items:', error)
    return []
  }

  return data || []
}

export const saveInventoryItem = async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
  const { error } = await supabase
    .from('inventory_items')
    .insert([item])

  if (error) {
    console.error('Error saving inventory item:', error)
    return false
  }

  return true
}

export const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>): Promise<boolean> => {
  try {
    console.log('🔥 INVENTORY UPDATE FUNCTION CALLED 🔥')
    console.log('Updating inventory item:', { id, updates })

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('User not authenticated for inventory update:', authError)
      return false
    }

    console.log('Authenticated user for inventory update:', user.id)

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    // DETAILED DEBUGGING: Log everything about the status
    console.log('=== INVENTORY UPDATE DEBUG ===')
    console.log('Full updateData object:', JSON.stringify(updateData, null, 2))
    console.log('updateData.status type:', typeof updateData.status)
    console.log('updateData.status value:', updateData.status)

    // Map status values to match database constraint exactly
    if (updateData.status) {
      console.log('Original status value:', updateData.status)

      // Ensure we only use the exact values allowed by the constraint
      const allowedStatuses = ['in_stock', 'low_stock', 'out_of_stock', 'expired']

      if (!allowedStatuses.includes(updateData.status)) {
        console.log('Invalid status value, mapping to valid one')
        // Map common variations to valid values
        const statusMapping = {
          'in-stock': 'in_stock',
          'low': 'low_stock',
          'out-of-stock': 'out_of_stock',
          'available': 'in_stock',
          'unavailable': 'out_of_stock'
        }
        updateData.status = statusMapping[updateData.status] || 'in_stock'
      }

      console.log('Final status value:', updateData.status)
      console.log('Final status type:', typeof updateData.status)
    }

    console.log('Final update data being sent:', JSON.stringify(updateData, null, 2))
    console.log('=== END DEBUG ===')

    // Try to update the inventory item
    // If there's an ambiguous column reference error, it's likely due to a missing inventory_alerts table
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating inventory item:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      console.error('Error details JSON:', JSON.stringify(error, null, 2))

      // Handle specific RLS policy error
      if (error.code === '42501' && error.message?.includes('row-level security policy')) {
        console.error('❌ RLS POLICY ERROR: The trigger cannot create alerts due to row-level security.')
        console.error('💡 SOLUTION: We\'ll handle alert creation in the application instead of the trigger.')
      }

      return false
    }

    if (!data || data.length === 0) {
      console.error('No inventory item found with ID or access denied:', id)
      return false
    }

    console.log('Inventory item updated successfully:', data)

    // Handle alert creation manually since triggers have RLS issues
    const updatedItem = data[0]
    if (updatedItem.status === 'low_stock' || updatedItem.status === 'out_of_stock') {
      console.log('Creating inventory alert for status:', updatedItem.status)

      // Check if alert already exists
      const { data: existingAlert } = await supabase
        .from('inventory_alerts')
        .select('id')
        .eq('inventory_item_id', updatedItem.id)
        .eq('alert_type', updatedItem.status)
        .eq('is_resolved', false)
        .single()

      if (!existingAlert) {
        // Create new alert
        const alertMessage = updatedItem.status === 'out_of_stock'
          ? `${updatedItem.name} is out of stock`
          : `${updatedItem.name} is running low (${updatedItem.quantity} ${updatedItem.unit} remaining)`

        const { error: alertError } = await supabase
          .from('inventory_alerts')
          .insert({
            cafeteria_id: updatedItem.cafeteria_id,
            inventory_item_id: updatedItem.id,
            alert_type: updatedItem.status,
            message: alertMessage,
            is_resolved: false
          })

        if (alertError) {
          console.error('Error creating inventory alert:', alertError)
        } else {
          console.log('✅ Inventory alert created successfully')
        }
      }
    }

    // Resolve alerts when status improves
    if (updatedItem.status === 'in_stock') {
      console.log('Resolving inventory alerts for improved status')

      const { error: resolveError } = await supabase
        .from('inventory_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('inventory_item_id', updatedItem.id)
        .in('alert_type', ['low_stock', 'out_of_stock'])
        .eq('is_resolved', false)

      if (resolveError) {
        console.error('Error resolving inventory alerts:', resolveError)
      } else {
        console.log('✅ Inventory alerts resolved successfully')
      }
    }

    return true
  } catch (err) {
    console.error('Unexpected error updating inventory item:', err)
    return false
  }
}

export const deleteInventoryItem = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting inventory item:', error)
    return false
  }

  return true
}

// Export log functions
export const createExportLog = async (exportData: Omit<ExportLog, 'id' | 'created_at'>): Promise<string | null> => {
  const { data, error } = await supabase
    .from('export_logs')
    .insert([exportData])
    .select('id')
    .single()

  if (error) {
    console.error('Error creating export log:', error)
    return null
  }

  return data?.id || null
}

export const updateExportLog = async (id: string, updates: Partial<ExportLog>): Promise<boolean> => {
  const { error } = await supabase
    .from('export_logs')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating export log:', error)
    return false
  }

  return true
}

export const getUserExportLogs = async (userId: string): Promise<ExportLog[]> => {
  const { data, error } = await supabase
    .from('export_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching export logs:', error)
    return []
  }

  return data || []
}

// Analytics data functions
export const getAnalyticsData = async (
  cafeteriaId: string,
  metricType: string,
  startDate: string,
  endDate: string
): Promise<{ date: string; value: number }[]> => {
  const { data, error } = await supabase
    .from('analytics_data')
    .select('date_recorded, metric_value')
    .eq('cafeteria_id', cafeteriaId)
    .eq('metric_type', metricType)
    .gte('date_recorded', startDate)
    .lte('date_recorded', endDate)
    .order('date_recorded', { ascending: true })

  if (error) {
    console.error('Error fetching analytics data:', error)
    return []
  }

  return data?.map(item => ({
    date: item.date_recorded,
    value: Number(item.metric_value)
  })) || []
}

export const insertAnalyticsData = async (
  cafeteriaId: string,
  metricType: string,
  value: number,
  date?: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('analytics_data')
    .insert([{
      cafeteria_id: cafeteriaId,
      metric_type: metricType,
      metric_value: value,
      date_recorded: date || new Date().toISOString().split('T')[0]
    }])

  if (error) {
    console.error('Error inserting analytics data:', error)
    return false
  }

  return true
}

// User analytics preferences functions
export const getUserAnalyticsPreferences = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_analytics_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user analytics preferences:', error)
    return null
  }

  return data
}

export const saveUserAnalyticsPreferences = async (
  userId: string,
  preferences: {
    default_date_range?: string
    comparison_enabled?: boolean
    show_trends?: boolean
    chart_preferences?: any
    dashboard_layout?: any
  }
): Promise<boolean> => {
  const { error } = await supabase
    .from('user_analytics_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error saving user analytics preferences:', error)
    return false
  }

  return true
}

// Navigation tracking functions
export const trackNavigation = async (
  userId: string | null,
  fromPage: string | null,
  toPage: string,
  timeSpent?: number
): Promise<boolean> => {
  const { error } = await supabase
    .from('navigation_logs')
    .insert([{
      user_id: userId,
      from_page: fromPage,
      to_page: toPage,
      time_spent_seconds: timeSpent
    }])

  if (error) {
    console.error('Error tracking navigation:', error)
    return false
  }

  return true
}

// Notification functions
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: string = 'info',
  relatedOrderId?: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('notifications')
    .insert([{
      user_id: userId,
      title,
      message,
      type,
      related_order_id: relatedOrderId,
      is_read: false,
      created_at: new Date().toISOString()
    }])

  if (error) {
    console.error('Error creating notification:', error)
    return false
  }

  return true
}

// Create order notification for cafeteria owners
export const createOrderNotification = async (
  cafeteriaId: string,
  orderNumber: string,
  customerName?: string
): Promise<boolean> => {
  try {
    // Get cafeteria owner
    const { data: cafeteria, error: cafeteriaError } = await supabase
      .from('cafeterias')
      .select('owner_id, name')
      .eq('id', cafeteriaId)
      .single()

    if (cafeteriaError || !cafeteria) {
      console.error('Error fetching cafeteria:', cafeteriaError)
      return false
    }

    const title = 'New Order Received'
    const message = `New order #${orderNumber} received${customerName ? ` from ${customerName}` : ''} at ${cafeteria.name}`

    return await createNotification(
      cafeteria.owner_id,
      title,
      message,
      'order',
      orderNumber
    )
  } catch (error) {
    console.error('Error creating order notification:', error)
    return false
  }
}

// Analytics events tracking
export const trackAnalyticsEvent = async (
  userId: string | null,
  eventType: string,
  eventData: any,
  pageUrl?: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('analytics_events')
    .insert([{
      user_id: userId,
      event_type: eventType,
      event_data: eventData,
      page_url: pageUrl,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
    }])

  if (error) {
    console.error('Error tracking analytics event:', error)
    return false
  }

  return true
}

// Chart configuration functions
export const getChartConfigurations = async (userId: string) => {
  const { data, error } = await supabase
    .from('chart_configurations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching chart configurations:', error)
    return []
  }

  return data || []
}

export const saveChartConfiguration = async (
  userId: string,
  chartType: string,
  title: string,
  configuration: any,
  isDefault: boolean = false
): Promise<boolean> => {
  const { error } = await supabase
    .from('chart_configurations')
    .insert([{
      user_id: userId,
      chart_type: chartType,
      chart_title: title,
      configuration,
      is_default: isDefault
    }])

  if (error) {
    console.error('Error saving chart configuration:', error)
    return false
  }

  return true
}

// User activity logging
export const logUserActivity = async (
  userId: string | null,
  activityType: string,
  description: string,
  entityType?: string,
  entityId?: string,
  metadata?: any
): Promise<boolean> => {
  const { error } = await supabase
    .from('user_activity_logs')
    .insert([{
      user_id: userId,
      activity_type: activityType,
      activity_description: description,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata || {}
    }])

  if (error) {
    console.error('Error logging user activity:', error)
    return false
  }

  return true
}

// Career management functions
export interface Career {
  id: string
  title: string
  department: string
  location: string
  description: string
  requirements: string
  status: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
}

export const getCareers = async (): Promise<Career[]> => {
  const { data, error } = await supabase
    .from('careers')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching careers:', error)
    return []
  }

  return data || []
}

export const createCareer = async (career: Omit<Career, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
  const { error } = await supabase
    .from('careers')
    .insert([career])

  if (error) {
    console.error('Error creating career:', error)
    return false
  }

  return true
}

export const updateCareer = async (id: string, updates: Partial<Career>): Promise<boolean> => {
  const { error } = await supabase
    .from('careers')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating career:', error)
    return false
  }

  return true
}

export const deleteCareer = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('careers')
    .update({ status: 'inactive' })
    .eq('id', id)

  if (error) {
    console.error('Error deleting career:', error)
    return false
  }

  return true
}

// Menu Items functions
export const getMenuItems = async (cafeteriaId?: string): Promise<any[]> => {
  let query = supabase
    .from('menu_items')
    .select('*')
    .order('name', { ascending: true })

  if (cafeteriaId) {
    query = query.eq('cafeteria_id', cafeteriaId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching menu items:', error)
    return []
  }

  return data || []
}

export const addMenuItem = async (menuItem: any): Promise<boolean> => {
  const { error } = await supabase
    .from('menu_items')
    .insert([menuItem])

  if (error) {
    console.error('Error adding menu item:', error)
    return false
  }

  return true
}

export const updateMenuItem = async (id: string, updates: any): Promise<boolean> => {
  const { error } = await supabase
    .from('menu_items')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating menu item:', error)
    return false
  }

  return true
}

export const deleteMenuItem = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting menu item:', error)
    return false
  }

  return true
}

// Cafeterias functions
export const getCafeterias = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('cafeterias')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching cafeterias:', error)
    return []
  }

  return data || []
}

// Support Tickets functions
export const submitSupportTicket = async (ticket: {
  user_id: string
  title: string
  description: string
  category?: string
  priority: string
  status?: string
  user_type?: string
}): Promise<boolean> => {
  // Generate a unique ticket number
  const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

  // Get user role if user_type not provided
  let userType = ticket.user_type
  if (!userType) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', ticket.user_id)
      .single()

    if (profile?.role === 'cafeteria_manager') {
      userType = 'cafeteria'
    } else if (profile?.role === 'admin') {
      userType = 'admin'
    } else {
      userType = 'student'
    }
  }

  const ticketData = {
    ticket_number: ticketNumber,
    user_id: ticket.user_id,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category || 'general_inquiry',
    priority: ticket.priority,
    status: ticket.status || 'open',
    user_type: userType,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase
    .from('support_tickets')
    .insert([ticketData])

  if (error) {
    console.error('Error submitting support ticket:', error)
    return false
  }

  return true
}

export const fetchSupportTickets = async (userId?: string): Promise<any[]> => {
  try {
    // First try with the join
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        profiles!user_id(
          full_name,
          role,
          phone
        )
      `)
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching support tickets with profiles join:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })

      // Fallback: try without the join
      console.log('Trying fallback query without profiles join...')
      let fallbackQuery = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (userId) {
        fallbackQuery = fallbackQuery.eq('user_id', userId)
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery

      if (fallbackError) {
        console.error('Fallback query also failed:', fallbackError)
        return []
      }

      console.log('Fallback query successful, returning data without profile info')
      return fallbackData || []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error in fetchSupportTickets:', error)
    return []
  }
}

// Admin function to fetch all tickets with user information
export const fetchAllSupportTicketsForAdmin = async (): Promise<any[]> => {
  try {
    // First get support tickets with profiles
    const { data: tickets, error: ticketsError } = await supabase
      .from('support_tickets')
      .select(`
        *,
        profiles(
          full_name,
          role,
          phone
        )
      `)
      .order('created_at', { ascending: false })

    if (ticketsError) {
      console.error('Error fetching support tickets:', ticketsError)
      return []
    }

    // Then get user emails from auth.users
    const userIds = tickets?.map(ticket => ticket.user_id).filter(Boolean) || []

    if (userIds.length === 0) {
      return tickets || []
    }

    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('Error fetching auth users:', authError)
      return tickets || []
    }

    // Combine the data
    const ticketsWithEmails = tickets?.map(ticket => ({
      ...ticket,
      user_email: authUsers.users.find(user => user.id === ticket.user_id)?.email || 'No email'
    })) || []

    return ticketsWithEmails
  } catch (error) {
    console.error('Error in fetchAllSupportTicketsForAdmin:', error)
    return []
  }
}

// Fetch tickets by user type (for admin dashboard)
export const fetchSupportTicketsByType = async (userType: 'student' | 'cafeteria' | 'admin'): Promise<any[]> => {
  const { data, error } = await supabase
    .from('support_tickets')
    .select(`
      *,
      profiles(
        full_name,
        role,
        phone
      )
    `)
    .eq('user_type', userType)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(`Error fetching ${userType} support tickets:`, error)
    return []
  }

  return data || []
}

// Legacy functions for backward compatibility
export const submitStudentMessage = async (message: {
  user_id: string
  user_name: string
  user_type: string
  subject: string
  content: string
  priority: string
  status: string
  unread: boolean
}): Promise<boolean> => {
  return await submitSupportTicket({
    user_id: message.user_id,
    title: message.subject,
    description: message.content,
    category: message.user_type,
    priority: message.priority,
    status: message.status
  })
}

export const fetchStudentMessages = async (): Promise<any[]> => {
  try {
    console.log('Fetching student messages...')
    const tickets = await fetchSupportTickets()
    console.log('Successfully fetched tickets:', tickets.length)
    return tickets
  } catch (error) {
    console.error('Error in fetchStudentMessages:', error)
    return []
  }
}

// Chat System Functions
export const createChatConversation = async (conversation: {
  user_id: string
  subject: string
  category?: string
  priority?: string
  user_type?: string
  order_id?: string
  ticket_id?: string
}): Promise<string | null> => {
  // Get user role if user_type not provided
  let userType = conversation.user_type
  if (!userType) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', conversation.user_id)
      .single()

    if (profile?.role === 'cafeteria_manager') {
      userType = 'cafeteria'
    } else if (profile?.role === 'admin') {
      userType = 'admin'
    } else {
      userType = 'student'
    }
  }

  const { data, error } = await supabase
    .from('chat_conversations')
    .insert([{
      user_id: conversation.user_id,
      subject: conversation.subject,
      category: conversation.category || 'general_inquiry',
      priority: conversation.priority || 'medium',
      user_type: userType,
      order_id: conversation.order_id || null,
      ticket_id: conversation.ticket_id || null,
      status: 'open'
    }])
    .select('id')
    .single()

  if (error) {
    console.error('Error creating chat conversation:', error)
    return null
  }

  return data?.id || null
}

export const sendChatMessage = async (message: {
  conversation_id: string
  sender_id: string
  content: string
  message_type?: string
  file_url?: string
  file_name?: string
  file_size?: number
}): Promise<boolean> => {
  const { error } = await supabase
    .from('chat_messages')
    .insert([{
      conversation_id: message.conversation_id,
      sender_id: message.sender_id,
      content: message.content,
      message_type: message.message_type || 'text',
      file_url: message.file_url || null,
      file_name: message.file_name || null,
      file_size: message.file_size || null,
      is_read: false
    }])

  if (error) {
    console.error('Error sending chat message:', error)
    return false
  }

  // Update conversation updated_at
  await supabase
    .from('chat_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', message.conversation_id)

  return true
}

export const getChatConversations = async (userId?: string, userType?: string): Promise<any[]> => {
  let query = supabase
    .from('chat_conversations')
    .select(`
      *,
      profiles!chat_conversations_user_id_fkey(
        full_name,
        email,
        role
      ),
      support_agent:profiles!chat_conversations_support_agent_id_fkey(
        full_name,
        email
      )
    `)
    .order('updated_at', { ascending: false })

  if (userId) {
    query = query.eq('user_id', userId)
  }

  if (userType) {
    query = query.eq('user_type', userType)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching chat conversations:', error)
    return []
  }

  return data || []
}

export const getChatMessages = async (conversationId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      sender:profiles!chat_messages_sender_id_fkey(
        full_name,
        email,
        role
      )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching chat messages:', error)
    return []
  }

  return data || []
}

export const markMessagesAsRead = async (conversationId: string, userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('chat_messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)

  if (error) {
    console.error('Error marking messages as read:', error)
    return false
  }

  return true
}

export const assignChatToAgent = async (conversationId: string, agentId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('chat_conversations')
    .update({
      support_agent_id: agentId,
      status: 'in_progress',
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId)

  if (error) {
    console.error('Error assigning chat to agent:', error)
    return false
  }

  return true
}

export const closeChatConversation = async (conversationId: string, rating?: number, feedback?: string): Promise<boolean> => {
  const updateData: any = {
    status: 'closed',
    closed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  if (rating) updateData.rating = rating
  if (feedback) updateData.feedback = feedback

  const { error } = await supabase
    .from('chat_conversations')
    .update(updateData)
    .eq('id', conversationId)

  if (error) {
    console.error('Error closing chat conversation:', error)
    return false
  }

  return true
}

// Convert support ticket to chat conversation
export const convertTicketToChat = async (ticketId: string): Promise<string | null> => {
  // Get ticket details
  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .single()

  if (ticketError || !ticket) {
    console.error('Error fetching ticket for conversion:', ticketError)
    return null
  }

  // Create chat conversation linked to ticket
  const conversationId = await createChatConversation({
    user_id: ticket.user_id,
    subject: ticket.title,
    category: ticket.category,
    priority: ticket.priority,
    user_type: ticket.user_type,
    order_id: ticket.order_id,
    ticket_id: ticketId
  })

  if (conversationId) {
    // Add initial message with ticket description
    await sendChatMessage({
      conversation_id: conversationId,
      sender_id: ticket.user_id,
      content: `Original ticket: ${ticket.description}`,
      message_type: 'text'
    })

    // Update ticket status to indicate it has a chat
    await supabase
      .from('support_tickets')
      .update({
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)
  }

  return conversationId
}

// Get chat conversation for a ticket
export const getChatForTicket = async (ticketId: string): Promise<any | null> => {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select(`
      *,
      profiles!chat_conversations_user_id_fkey(
        full_name,
        email,
        role
      ),
      support_agent:profiles!chat_conversations_support_agent_id_fkey(
        full_name,
        email
      )
    `)
    .eq('ticket_id', ticketId)
    .single()

  if (error) {
    console.error('Error fetching chat for ticket:', error)
    return null
  }

  return data
}

// Orders functions
export const getOrders = async (cafeteriaId?: string): Promise<any[]> => {
  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (cafeteriaId) {
    query = query.eq('cafeteria_id', cafeteriaId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  return data || []
}