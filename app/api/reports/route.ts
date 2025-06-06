import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { generatePDFReport, generateExcelReport } from '@/lib/report-generation'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    // Try to get real reports from the database, fallback to sample data if table doesn't exist
    let reports = []

    try {
      const { data: dbReports, error } = await supabaseAdmin
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.log('Reports table not found, using sample data:', error.message)
        throw error
      }

      reports = dbReports || []
    } catch (dbError) {
      // No fallback data - return empty array if table doesn't exist
      console.log('Reports table not available, returning empty list')
      reports = []
    }

    // Format reports for the frontend
    const formattedReports = reports.map(report => ({
      id: report.id,
      name: report.name,
      type: report.type,
      period: report.period,
      generated: new Date(report.created_at).toLocaleDateString(),
      format: report.format,
      file_url: report.file_url,
      file_size: report.file_size,
      total_records: report.total_records,
      status: report.status || 'completed'
    }))

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
    const supabaseAdmin = createSupabaseAdmin()
    const body = await request.json()
    const { reportType, reportPeriod, reportFormat } = body

    if (!reportType || !reportPeriod || !reportFormat) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('Generating report:', { reportType, reportPeriod, reportFormat })

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
      case 'analytics':
        reportTypeMapping = 'analytics'
        break
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    // Create report metadata first
    const reportName = `${reportType} Report - ${reportPeriod}`
    const reportId = `report_${Date.now()}`
    const fileUrl = `/api/reports/generate?type=${reportTypeMapping}&format=${reportFormat.toLowerCase()}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`

    // Insert report record into database
    const { data: reportRecord, error: insertError } = await supabaseAdmin
      .from('reports')
      .insert([{
        id: reportId,
        name: reportName,
        type: reportType,
        period: reportPeriod,
        format: reportFormat.toLowerCase() === 'excel' ? 'Excel' : reportFormat.toLowerCase() === 'pdf' ? 'PDF' : 'CSV',
        file_url: fileUrl,
        file_path: null,
        file_size: 0,
        total_records: 0,
        status: 'generating',
        metadata: {
          date_range_start: startDate.toISOString(),
          date_range_end: endDate.toISOString(),
          generated_at: new Date().toISOString()
        }
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting report record:', insertError)
      return NextResponse.json({
        error: 'Failed to create report record. Please recreate the reports table with all required columns.',
        details: insertError.message,
        sql_needed: 'Please run the recreate-reports-table.sql script in your Supabase SQL Editor'
      }, { status: 500 })
    }

    // Generate report using the new system
    let result: { success: boolean; blob?: Blob; error?: string; data?: any }

    try {
      if (reportFormat.toLowerCase() === 'pdf') {
        result = await generatePDFReport(reportTypeMapping, undefined, { from: startDate, to: endDate })
      } else {
        result = await generateExcelReport(reportTypeMapping, undefined, { from: startDate, to: endDate })
      }

      if (!result.success) {
        // Update report status to failed
        await supabaseAdmin
          .from('reports')
          .update({
            status: 'failed',
            metadata: {
              ...reportRecord.metadata,
              error_message: result.error || 'Unknown error',
              failed_at: new Date().toISOString()
            }
          })
          .eq('id', reportId)

        return NextResponse.json({ error: result.error || 'Failed to generate report' }, { status: 500 })
      }

      // Update report with success status and metadata
      const fileSize = result.blob?.size || 0
      const totalRecords = result.data?.length || 0

      await supabaseAdmin
        .from('reports')
        .update({
          status: 'completed',
          file_size: fileSize,
          total_records: totalRecords,
          metadata: {
            ...reportRecord.metadata,
            generation_completed_at: new Date().toISOString(),
            actual_file_size: fileSize,
            actual_records: totalRecords
          }
        })
        .eq('id', reportId)

      console.log('Report generated successfully:', reportId)

      return NextResponse.json({
        success: true,
        report: {
          id: reportId,
          name: reportName,
          type: reportType,
          period: reportPeriod,
          format: reportFormat.toUpperCase(),
          file_url: fileUrl,
          total_records: result.data?.length || 0,
          file_size: result.blob?.size || 0,
          generated: new Date().toLocaleDateString()
        }
      })

    } catch (generationError) {
      console.error('Error during report generation:', generationError)

      // Update report status to failed
      await supabaseAdmin
        .from('reports')
        .update({
          status: 'failed',
          metadata: {
            error_message: generationError.message || 'Generation failed',
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', reportId)

      return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in report generation API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


