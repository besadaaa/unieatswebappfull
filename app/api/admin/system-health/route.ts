// System Health Monitoring API Endpoint
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface SystemHealthMetrics {
  database: {
    status: 'healthy' | 'warning' | 'critical'
    responseTime: number
    connectionCount: number
    activeQueries: number
  }
  orders: {
    status: 'healthy' | 'warning' | 'critical'
    processingRate: number
    averageProcessingTime: number
    failureRate: number
    pendingOrders: number
  }
  notifications: {
    status: 'healthy' | 'warning' | 'critical'
    deliveryRate: number
    queueSize: number
    failedDeliveries: number
  }
  storage: {
    status: 'healthy' | 'warning' | 'critical'
    usedSpace: number
    totalSpace: number
    uploadSuccess: number
  }
  users: {
    status: 'healthy' | 'warning' | 'critical'
    activeUsers: number
    newRegistrations: number
    authFailures: number
  }
  performance: {
    status: 'healthy' | 'warning' | 'critical'
    averageResponseTime: number
    errorRate: number
    uptime: number
  }
}

// Check database health
async function checkDatabaseHealth() {
  try {
    const startTime = Date.now()
    
    // Test basic connectivity
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    const responseTime = Date.now() - startTime
    
    if (error) {
      return {
        status: 'critical' as const,
        responseTime,
        connectionCount: 0,
        activeQueries: 0,
        error: error.message
      }
    }
    
    // Get connection info (mock data - would be real monitoring in production)
    return {
      status: responseTime < 100 ? 'healthy' as const : 
             responseTime < 500 ? 'warning' as const : 'critical' as const,
      responseTime,
      connectionCount: 25, // Mock data
      activeQueries: 12    // Mock data
    }
    
  } catch (error) {
    return {
      status: 'critical' as const,
      responseTime: 0,
      connectionCount: 0,
      activeQueries: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Check order processing health
async function checkOrderProcessingHealth() {
  try {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    // Get recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', oneHourAgo.toISOString())
    
    // Get pending orders
    const { data: pendingOrders } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['new', 'preparing'])
    
    // Calculate metrics
    const totalOrders = recentOrders?.length || 0
    const completedOrders = recentOrders?.filter(o => o.status === 'completed').length || 0
    const failedOrders = recentOrders?.filter(o => o.status === 'cancelled').length || 0
    
    const processingRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 100
    const failureRate = totalOrders > 0 ? (failedOrders / totalOrders) * 100 : 0
    
    // Calculate average processing time
    const processedOrders = recentOrders?.filter(o => 
      o.status === 'completed' && o.preparation_started_at && o.ready_at
    ) || []
    
    const averageProcessingTime = processedOrders.length > 0
      ? processedOrders.reduce((sum, order) => {
          const start = new Date(order.preparation_started_at!).getTime()
          const ready = new Date(order.ready_at!).getTime()
          return sum + (ready - start) / (1000 * 60) // minutes
        }, 0) / processedOrders.length
      : 0
    
    return {
      status: processingRate >= 90 && failureRate <= 5 ? 'healthy' as const :
             processingRate >= 70 && failureRate <= 15 ? 'warning' as const : 'critical' as const,
      processingRate,
      averageProcessingTime,
      failureRate,
      pendingOrders: pendingOrders?.length || 0
    }
    
  } catch (error) {
    return {
      status: 'critical' as const,
      processingRate: 0,
      averageProcessingTime: 0,
      failureRate: 100,
      pendingOrders: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Check notification system health
async function checkNotificationHealth() {
  try {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    // Get recent notifications
    const { data: recentNotifications } = await supabase
      .from('system_notifications')
      .select('*')
      .gte('created_at', oneHourAgo.toISOString())
    
    // Get unread notifications (queue size)
    const { data: unreadNotifications } = await supabase
      .from('system_notifications')
      .select('*')
      .eq('read', false)
    
    const totalNotifications = recentNotifications?.length || 0
    const queueSize = unreadNotifications?.length || 0
    
    // Mock delivery rate and failed deliveries (would be real monitoring in production)
    const deliveryRate = 98.5
    const failedDeliveries = Math.floor(totalNotifications * 0.015)
    
    return {
      status: deliveryRate >= 95 && queueSize < 1000 ? 'healthy' as const :
             deliveryRate >= 85 && queueSize < 5000 ? 'warning' as const : 'critical' as const,
      deliveryRate,
      queueSize,
      failedDeliveries
    }
    
  } catch (error) {
    return {
      status: 'critical' as const,
      deliveryRate: 0,
      queueSize: 0,
      failedDeliveries: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Check storage health (mock implementation)
async function checkStorageHealth() {
  try {
    // Mock storage metrics (would be real monitoring in production)
    const usedSpace = 2.5 // GB
    const totalSpace = 10  // GB
    const uploadSuccess = 99.2 // %
    
    const usagePercentage = (usedSpace / totalSpace) * 100
    
    return {
      status: usagePercentage < 80 && uploadSuccess >= 95 ? 'healthy' as const :
             usagePercentage < 90 && uploadSuccess >= 85 ? 'warning' as const : 'critical' as const,
      usedSpace,
      totalSpace,
      uploadSuccess
    }
    
  } catch (error) {
    return {
      status: 'critical' as const,
      usedSpace: 0,
      totalSpace: 0,
      uploadSuccess: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Check user system health
async function checkUserHealth() {
  try {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    // Get active users (logged in within last 24 hours)
    const { data: activeUsers } = await supabase
      .from('profiles')
      .select('*')
      .gte('last_login_at', oneDayAgo.toISOString())
    
    // Get new registrations in last hour
    const { data: newUsers } = await supabase
      .from('profiles')
      .select('*')
      .gte('created_at', oneHourAgo.toISOString())
    
    // Mock auth failures (would be real monitoring in production)
    const authFailures = 3
    
    return {
      status: authFailures < 10 ? 'healthy' as const :
             authFailures < 50 ? 'warning' as const : 'critical' as const,
      activeUsers: activeUsers?.length || 0,
      newRegistrations: newUsers?.length || 0,
      authFailures
    }
    
  } catch (error) {
    return {
      status: 'critical' as const,
      activeUsers: 0,
      newRegistrations: 0,
      authFailures: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Check overall performance
async function checkPerformanceHealth() {
  try {
    // Mock performance metrics (would be real monitoring in production)
    const averageResponseTime = 150 // ms
    const errorRate = 0.5 // %
    const uptime = 99.9 // %
    
    return {
      status: averageResponseTime < 200 && errorRate < 1 && uptime >= 99.5 ? 'healthy' as const :
             averageResponseTime < 500 && errorRate < 5 && uptime >= 99 ? 'warning' as const : 'critical' as const,
      averageResponseTime,
      errorRate,
      uptime
    }
    
  } catch (error) {
    return {
      status: 'critical' as const,
      averageResponseTime: 0,
      errorRate: 100,
      uptime: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const component = searchParams.get('component') // specific component or 'all'
    
    if (component && component !== 'all') {
      // Get specific component health
      let healthData
      
      switch (component) {
        case 'database':
          healthData = await checkDatabaseHealth()
          break
        case 'orders':
          healthData = await checkOrderProcessingHealth()
          break
        case 'notifications':
          healthData = await checkNotificationHealth()
          break
        case 'storage':
          healthData = await checkStorageHealth()
          break
        case 'users':
          healthData = await checkUserHealth()
          break
        case 'performance':
          healthData = await checkPerformanceHealth()
          break
        default:
          return NextResponse.json({ error: 'Invalid component' }, { status: 400 })
      }
      
      return NextResponse.json({
        success: true,
        component,
        data: healthData,
        timestamp: new Date().toISOString()
      })
    }
    
    // Get all system health metrics
    const [database, orders, notifications, storage, users, performance] = await Promise.all([
      checkDatabaseHealth(),
      checkOrderProcessingHealth(),
      checkNotificationHealth(),
      checkStorageHealth(),
      checkUserHealth(),
      checkPerformanceHealth()
    ])
    
    const systemHealth: SystemHealthMetrics = {
      database,
      orders,
      notifications,
      storage,
      users,
      performance
    }
    
    // Calculate overall system status
    const statuses = Object.values(systemHealth).map(component => component.status)
    const overallStatus = statuses.includes('critical') ? 'critical' :
                         statuses.includes('warning') ? 'warning' : 'healthy'
    
    // Store health metrics in database
    const healthMetrics = [
      { metric_name: 'database_response_time', metric_value: database.responseTime, metric_unit: 'ms', status: database.status },
      { metric_name: 'order_processing_rate', metric_value: orders.processingRate, metric_unit: '%', status: orders.status },
      { metric_name: 'notification_delivery_rate', metric_value: notifications.deliveryRate, metric_unit: '%', status: notifications.status },
      { metric_name: 'storage_usage', metric_value: (storage.usedSpace / storage.totalSpace) * 100, metric_unit: '%', status: storage.status },
      { metric_name: 'active_users', metric_value: users.activeUsers, metric_unit: 'count', status: users.status },
      { metric_name: 'system_uptime', metric_value: performance.uptime, metric_unit: '%', status: performance.status }
    ]
    
    await supabase
      .from('system_health_metrics')
      .insert(healthMetrics)
    
    return NextResponse.json({
      success: true,
      data: {
        overall: overallStatus,
        components: systemHealth,
        summary: {
          healthyComponents: statuses.filter(s => s === 'healthy').length,
          warningComponents: statuses.filter(s => s === 'warning').length,
          criticalComponents: statuses.filter(s => s === 'critical').length,
          totalComponents: statuses.length
        }
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error checking system health:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
