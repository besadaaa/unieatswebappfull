// Report Generation API Endpoint
import { NextRequest, NextResponse } from 'next/server'
import { generatePDFReport, generateExcelReport } from '@/lib/report-generation'
import { withRateLimit } from '@/lib/rate-limiting'

async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') as 'financial' | 'orders' | 'inventory' | 'analytics'
    const format = searchParams.get('format') as 'pdf' | 'excel'
    const cafeteriaId = searchParams.get('cafeteriaId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!reportType || !format) {
      return NextResponse.json(
        { error: 'Missing required parameters: type and format' },
        { status: 400 }
      )
    }

    if (!['financial', 'orders', 'inventory', 'analytics'].includes(reportType)) {
      return NextResponse.json(
        { error: 'Invalid report type' },
        { status: 400 }
      )
    }

    if (!['pdf', 'excel'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be pdf or excel' },
        { status: 400 }
      )
    }

    // Parse date range
    let dateRange: { from: Date; to: Date } | undefined
    if (startDate && endDate) {
      dateRange = {
        from: new Date(startDate),
        to: new Date(endDate)
      }
    }

    // Generate report
    let result: { success: boolean; blob?: Blob; error?: string }
    
    if (format === 'pdf') {
      result = await generatePDFReport(reportType, cafeteriaId || undefined, dateRange)
    } else {
      result = await generateExcelReport(reportType, cafeteriaId || undefined, dateRange)
    }

    if (!result.success || !result.blob) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate report' },
        { status: 500 }
      )
    }

    // Set appropriate headers
    const filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    const contentType = format === 'pdf' 
      ? 'application/pdf' 
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    return new NextResponse(result.blob, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Error in report generation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit('api')(handler)
