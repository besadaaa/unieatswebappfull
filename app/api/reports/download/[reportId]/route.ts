import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { generatePDFReport, generateExcelReport } from '@/lib/report-generation'

export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const { reportId } = params

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 })
    }

    console.log('Downloading report:', reportId)

    // Get report metadata from database
    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (error || !report) {
      console.error('Report not found:', error)
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (report.status !== 'completed') {
      return NextResponse.json({ 
        error: `Report is not ready for download. Status: ${report.status}` 
      }, { status: 400 })
    }

    // Map report types to our generation system
    let reportTypeMapping: 'financial' | 'orders' | 'inventory' | 'analytics'
    switch (report.type.toLowerCase()) {
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

    // Generate the report file
    const startDate = new Date(report.date_range_start)
    const endDate = new Date(report.date_range_end)
    
    let result: { success: boolean; blob?: Blob; error?: string }

    if (report.format.toLowerCase() === 'pdf') {
      result = await generatePDFReport(reportTypeMapping, undefined, { from: startDate, to: endDate })
    } else {
      result = await generateExcelReport(reportTypeMapping, undefined, { from: startDate, to: endDate })
    }

    if (!result.success || !result.blob) {
      console.error('Failed to generate report file:', result.error)
      return NextResponse.json({ error: 'Failed to generate report file' }, { status: 500 })
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await result.blob.arrayBuffer())

    // Set appropriate headers for file download
    const headers = new Headers()
    
    if (report.format.toLowerCase() === 'pdf') {
      headers.set('Content-Type', 'application/pdf')
    } else if (report.format.toLowerCase() === 'excel') {
      headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    } else {
      headers.set('Content-Type', 'application/octet-stream')
    }

    // Create filename
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${report.name.replace(/\s+/g, '-')}-${timestamp}.${report.format.toLowerCase() === 'excel' ? 'xlsx' : report.format.toLowerCase()}`
    
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    headers.set('Content-Length', buffer.length.toString())
    headers.set('Cache-Control', 'no-cache')

    console.log('Serving report file:', filename, 'Size:', buffer.length)

    return new NextResponse(buffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Error downloading report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
