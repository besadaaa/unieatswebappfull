import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generatePDFReport, generateExcelReport } from '@/lib/report-generation'

export async function GET(request: NextRequest) {
  try {
    // For now, return some sample reports since we don't have a reports storage table
    // In production, you would store generated reports in a database table
    const sampleReports = [
      {
        id: '1',
        name: 'Revenue Report - This Month',
        type: 'Revenue',
        period: 'This Month',
        generated: new Date().toLocaleDateString(),
        format: 'PDF',
        file_url: '/api/reports/generate?type=financial&format=pdf',
        file_size: 1024 * 50 // 50KB
      },
      {
        id: '2',
        name: 'Orders Report - This Week',
        type: 'Orders',
        period: 'This Week',
        generated: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString(),
        format: 'Excel',
        file_url: '/api/reports/generate?type=orders&format=excel',
        file_size: 1024 * 75 // 75KB
      },
      {
        id: '3',
        name: 'Users Report - Last Month',
        type: 'Users',
        period: 'Last Month',
        generated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        format: 'CSV',
        file_url: '/api/reports/generate?type=analytics&format=excel',
        file_size: 1024 * 30 // 30KB
      }
    ]

    return NextResponse.json({
      success: true,
      reports: sampleReports,
      total: sampleReports.length
    })

  } catch (error) {
    console.error('Error in reports API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reportType, reportPeriod, reportFormat } = body

    if (!reportType || !reportPeriod || !reportFormat) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date
    let endDate = now

    switch (reportPeriod) {
      case 'Today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'Yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'This Week':
        const dayOfWeek = now.getDay()
        startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'This Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'Last Month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'This Year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    }

    // Map report types to our new system
    let reportTypeMapping: 'financial' | 'orders' | 'inventory' | 'analytics'
    switch (reportType.toLowerCase()) {
      case 'revenue':
        reportTypeMapping = 'financial'
        break
      case 'orders':
        reportTypeMapping = 'orders'
        break
      case 'users':
      case 'performance':
      case 'feedback':
        reportTypeMapping = 'analytics'
        break
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    // Generate report using the new system
    let result: { success: boolean; blob?: Blob; error?: string }

    if (reportFormat.toLowerCase() === 'pdf') {
      result = await generatePDFReport(reportTypeMapping, undefined, { from: startDate, to: endDate })
    } else {
      result = await generateExcelReport(reportTypeMapping, undefined, { from: startDate, to: endDate })
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to generate report' }, { status: 500 })
    }

    // Create report metadata
    const reportName = `${reportType} Report - ${reportPeriod}`
    const reportId = `report_${Date.now()}`

    return NextResponse.json({
      success: true,
      report: {
        id: reportId,
        name: reportName,
        type: reportType,
        period: reportPeriod,
        format: reportFormat.toUpperCase(),
        file_url: `/api/reports/generate?type=${reportTypeMapping}&format=${reportFormat.toLowerCase()}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        total_records: 0, // Will be calculated in the actual report
        generated: new Date().toLocaleDateString()
      }
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


