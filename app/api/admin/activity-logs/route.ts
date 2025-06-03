// User Activity Logs API Endpoint
import { NextRequest, NextResponse } from 'next/server'
import { getUserActivityLogs, logUserActivity } from '@/lib/financial'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Build query
    let query = supabase
      .from('user_activity_logs')
      .select(`
        *,
        profiles(full_name, email, role)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    if (action) {
      query = query.eq('action', action)
    }
    
    if (entityType) {
      query = query.eq('entity_type', entityType)
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    
    const { data: logs, error } = await query
    
    if (error) {
      console.error('Error fetching activity logs:', error)
      return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 })
    }
    
    // Get total count for pagination
    let countQuery = supabase
      .from('user_activity_logs')
      .select('*', { count: 'exact', head: true })
    
    if (userId) countQuery = countQuery.eq('user_id', userId)
    if (action) countQuery = countQuery.eq('action', action)
    if (entityType) countQuery = countQuery.eq('entity_type', entityType)
    if (startDate) countQuery = countQuery.gte('created_at', startDate)
    if (endDate) countQuery = countQuery.lte('created_at', endDate)
    
    const { count } = await countQuery
    
    // Get activity summary
    const { data: activitySummary } = await supabase
      .from('user_activity_logs')
      .select('action')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
    
    const actionCounts = activitySummary?.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}
    
    return NextResponse.json({
      success: true,
      data: {
        logs: logs || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit
        },
        summary: {
          totalToday: activitySummary?.length || 0,
          actionBreakdown: actionCounts
        }
      }
    })
    
  } catch (error) {
    console.error('Error in activity logs API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Log new activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, entityType, entityId, details, ipAddress, userAgent } = body
    
    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }
    
    const success = await logUserActivity(
      userId,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent
    )
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Activity logged successfully'
    })
    
  } catch (error) {
    console.error('Error logging activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get activity analytics
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, timeRange = 30 } = body
    
    if (action === 'analytics') {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - timeRange)
      
      // Get activity analytics
      const { data: activities } = await supabase
        .from('user_activity_logs')
        .select(`
          *,
          profiles(role)
        `)
        .gte('created_at', startDate.toISOString())
      
      if (!activities) {
        return NextResponse.json({ error: 'Failed to fetch activity data' }, { status: 500 })
      }
      
      // Analyze activities
      const analytics = {
        totalActivities: activities.length,
        uniqueUsers: new Set(activities.map(a => a.user_id)).size,
        
        // Activity by action
        actionBreakdown: activities.reduce((acc, activity) => {
          acc[activity.action] = (acc[activity.action] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        
        // Activity by role
        roleBreakdown: activities.reduce((acc, activity) => {
          const role = activity.profiles?.role || 'unknown'
          acc[role] = (acc[role] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        
        // Activity by entity type
        entityBreakdown: activities.reduce((acc, activity) => {
          const entityType = activity.entity_type || 'unknown'
          acc[entityType] = (acc[entityType] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        
        // Daily activity trend
        dailyTrend: activities.reduce((acc, activity) => {
          const date = new Date(activity.created_at).toISOString().split('T')[0]
          acc[date] = (acc[date] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        
        // Hourly activity pattern
        hourlyPattern: activities.reduce((acc, activity) => {
          const hour = new Date(activity.created_at).getHours()
          acc[hour] = (acc[hour] || 0) + 1
          return acc
        }, {} as Record<number, number>),
        
        // Success rate
        successRate: activities.length > 0 
          ? (activities.filter(a => a.success).length / activities.length) * 100 
          : 0,
        
        // Most active users
        topUsers: Object.entries(
          activities.reduce((acc, activity) => {
            if (activity.user_id) {
              acc[activity.user_id] = (acc[activity.user_id] || 0) + 1
            }
            return acc
          }, {} as Record<string, number>)
        )
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([userId, count]) => ({ userId, activityCount: count }))
      }
      
      return NextResponse.json({
        success: true,
        data: analytics,
        timeRange,
        generatedAt: new Date().toISOString()
      })
      
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Error getting activity analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
