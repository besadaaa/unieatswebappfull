import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, getCurrentUser } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'admin') {
      // Temporary bypass for development - check if this is localhost
      const host = request.headers.get('host')
      if (!host?.includes('localhost')) {
        return NextResponse.json(
          { error: 'Unauthorized. Admin access required.' },
          { status: 401 }
        )
      }
      console.log('🔧 Development bypass: allowing admin access on localhost')
    }

    const supabaseAdmin = createSupabaseAdmin()

    // Get all reports from database
    const { data: reports, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reports:', error)
      // If reports table doesn't exist, return empty array
      return NextResponse.json({
        success: true,
        reports: [],
        total: 0
      })
    }

    // Format reports for frontend
    const formattedReports = reports?.map(report => ({
      id: report.id,
      name: report.name,
      type: report.type,
      period: report.period,
      generated: new Date(report.created_at).toLocaleDateString(),
      format: report.format,
      file_url: report.file_url,
      status: report.status
    })) || []

    return NextResponse.json({
      success: true,
      reports: formattedReports,
      total: formattedReports.length
    })

  } catch (error) {
    console.error('Error in reports API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'admin') {
      // Temporary bypass for development - check if this is localhost
      const host = request.headers.get('host')
      if (!host?.includes('localhost')) {
        return NextResponse.json(
          { error: 'Unauthorized. Admin access required.' },
          { status: 401 }
        )
      }
      console.log('🔧 Development bypass: allowing admin access on localhost')
    }

    const body = await request.json()
    const { reportType, reportPeriod, reportFormat } = body

    if (!reportType || !reportPeriod || !reportFormat) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Only allow CSV format
    if (reportFormat.toLowerCase() !== 'csv') {
      return NextResponse.json({ error: 'Only CSV format is supported' }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseAdmin()

    // Generate report name
    const reportName = `${reportType} Report - ${reportPeriod}`

    // Calculate date range based on period
    const now = new Date()
    let startDate: string
    let endDate: string = now.toISOString().split('T')[0]

    switch (reportPeriod) {
      case 'Today':
        startDate = endDate
        break
      case 'Yesterday':
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        startDate = yesterday.toISOString().split('T')[0]
        endDate = startDate
        break
      case 'This Week':
        const weekStart = new Date(now)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        startDate = weekStart.toISOString().split('T')[0]
        break
      case 'This Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        break
      case 'Last Month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        startDate = lastMonth.toISOString().split('T')[0]
        endDate = lastMonthEnd.toISOString().split('T')[0]
        break
      case 'This Year':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
        break
      default:
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
    }

    // Generate the actual report data URL
    const reportDataUrl = `/api/admin/export/reports?type=${reportType.toLowerCase()}&format=csv&startDate=${startDate}&endDate=${endDate}`

    // Create report record in database
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .insert({
        name: reportName,
        type: reportType,
        period: reportPeriod,
        format: 'CSV',
        file_url: reportDataUrl,
        generated_by: currentUser?.id || null,
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (reportError) {
      console.error('Error creating report:', reportError)
      return NextResponse.json(
        { error: `Failed to create report: ${reportError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Report generated successfully',
      report: {
        id: report.id,
        name: report.name,
        type: report.type,
        period: report.period,
        format: report.format,
        file_url: report.file_url,
        generated: new Date(report.created_at).toLocaleDateString(),
        status: report.status
      }
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


