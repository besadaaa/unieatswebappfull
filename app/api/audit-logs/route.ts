import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { auditLogger, getClientIP, getUserAgent } from '@/lib/audit-logger'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const category = searchParams.get('category') || 'all'
    const userRole = searchParams.get('userRole') || 'all'
    const severity = searchParams.get('severity') || 'all'
    const dateFilter = searchParams.get('dateFilter') || 'all'
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (category !== 'all') {
      query = query.eq('category', category)
    }

    if (userRole !== 'all') {
      query = query.eq('user_role', userRole)
    }

    if (severity !== 'all') {
      if (severity === 'critical') {
        query = query.in('severity', ['high', 'critical'])
      } else {
        query = query.eq('severity', severity)
      }
    }

    // Date filtering
    if (dateFilter !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
          const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          query = query.gte('created_at', startDate.toISOString())
          query = query.lt('created_at', endDate.toISOString())
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          query = query.gte('created_at', startDate.toISOString())
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          query = query.gte('created_at', startDate.toISOString())
          break
        default:
          break
      }

      if (dateFilter !== 'yesterday' && startDate!) {
        query = query.gte('created_at', startDate.toISOString())
      }
    }

    const { data: logs, error } = await query

    if (error) {
      console.error('Error fetching audit logs:', error)
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
    }

    // Filter by search term if provided
    let filteredLogs = logs || []
    if (search) {
      const searchLower = search.toLowerCase()
      filteredLogs = filteredLogs.filter(log =>
        log.action?.toLowerCase().includes(searchLower) ||
        log.details?.toLowerCase().includes(searchLower) ||
        log.user_email?.toLowerCase().includes(searchLower)
      )
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })

    if (category !== 'all') {
      countQuery = countQuery.eq('category', category)
    }
    if (userRole !== 'all') {
      countQuery = countQuery.eq('user_role', userRole)
    }

    const { count } = await countQuery

    return NextResponse.json({
      success: true,
      logs: filteredLogs,
      total: count || 0,
      pagination: {
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Error in audit logs API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, details, user_email, user_role, severity, category, metadata } = body

    // Get client information
    const ip_address = getClientIP(request)
    const user_agent = getUserAgent(request)

    // Log the audit event
    const success = await auditLogger.log({
      user_email,
      user_role,
      action,
      details,
      severity: severity || 'low',
      category: category || 'general',
      ip_address,
      user_agent,
      metadata
    })

    if (!success) {
      return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Audit log created successfully' })

  } catch (error) {
    console.error('Error creating audit log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET audit log statistics
export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    
    // Get statistics
    const { data: stats, error } = await supabaseAdmin
      .from('audit_logs')
      .select('user_role, category, severity, created_at')

    if (error) {
      console.error('Error fetching audit log stats:', error)
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
    }

    // Calculate statistics
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const statistics = {
      total: stats?.length || 0,
      today: stats?.filter(log => new Date(log.created_at) >= today).length || 0,
      thisWeek: stats?.filter(log => new Date(log.created_at) >= thisWeek).length || 0,
      byRole: {
        student: stats?.filter(log => log.user_role === 'student').length || 0,
        cafeteria_manager: stats?.filter(log => log.user_role === 'cafeteria_manager').length || 0,
        admin: stats?.filter(log => log.user_role === 'admin').length || 0,
        system: stats?.filter(log => log.user_role === 'system').length || 0
      },
      byCategory: {
        authentication: stats?.filter(log => log.category === 'authentication').length || 0,
        user_management: stats?.filter(log => log.category === 'user_management').length || 0,
        cafeteria_actions: stats?.filter(log => log.category === 'cafeteria_actions').length || 0,
        orders: stats?.filter(log => log.category === 'orders').length || 0,
        security: stats?.filter(log => log.category === 'security').length || 0,
        system: stats?.filter(log => log.category === 'system').length || 0,
        general: stats?.filter(log => log.category === 'general').length || 0
      },
      bySeverity: {
        low: stats?.filter(log => log.severity === 'low').length || 0,
        medium: stats?.filter(log => log.severity === 'medium').length || 0,
        high: stats?.filter(log => log.severity === 'high').length || 0,
        critical: stats?.filter(log => log.severity === 'critical').length || 0
      }
    }

    return NextResponse.json({
      success: true,
      statistics
    })

  } catch (error) {
    console.error('Error fetching audit log statistics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
