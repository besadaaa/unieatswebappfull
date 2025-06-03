import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { auditLogger, getClientIP, getUserAgent } from '@/lib/audit-logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const { filename } = await params

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Extract report info from filename (e.g., "revenue-1234567890.csv")
    const [reportType, timestampWithExt] = filename.split('-')
    const [timestamp, format] = timestampWithExt.split('.')

    // Find the report in the database
    const { data: report, error } = await supabaseAdmin
      .from('generated_reports')
      .select('*')
      .eq('type', reportType)
      .like('file_url', `%${filename}`)
      .single()

    if (error || !report) {
      console.error('Report not found:', error)
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Generate the file content based on format
    let fileContent: string
    let contentType: string
    let downloadFilename: string

    switch (format.toLowerCase()) {
      case 'csv':
        fileContent = generateCSV(report.report_data, report.type)
        contentType = 'text/csv'
        downloadFilename = `${report.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`
        break
      case 'json':
        fileContent = JSON.stringify(report.report_data, null, 2)
        contentType = 'application/json'
        downloadFilename = `${report.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
        break
      case 'pdf':
        // For PDF, we'll return a simple text version for now
        fileContent = generateTextReport(report.report_data, report.type, report.name)
        contentType = 'text/plain'
        downloadFilename = `${report.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`
        break
      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
    }

    // Log the download
    await auditLogger.log({
      action: 'data_exported',
      details: `Downloaded ${report.type} report: ${report.name}`,
      severity: 'low',
      category: 'general',
      ip_address: getClientIP(request),
      user_agent: getUserAgent(request),
      metadata: {
        report_id: report.id,
        report_type: report.type,
        format: format,
        filename: downloadFilename
      }
    })

    // Return the file
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Content-Length': fileContent.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error downloading report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateCSV(data: any, reportType: string): string {
  let csvContent = ''

  switch (reportType) {
    case 'revenue':
      csvContent = generateRevenueCSV(data)
      break
    case 'orders':
      csvContent = generateOrdersCSV(data)
      break
    case 'users':
      csvContent = generateUsersCSV(data)
      break
    case 'performance':
      csvContent = generatePerformanceCSV(data)
      break
    case 'feedback':
      csvContent = generateFeedbackCSV(data)
      break
    default:
      csvContent = 'Report Type,Data\n' + reportType + ',' + JSON.stringify(data)
  }

  return csvContent
}

function generateRevenueCSV(data: any): string {
  let csv = 'Order ID,Date,Customer,Cafeteria,Total Amount,User Service Fee,Cafeteria Commission,Admin Revenue,Status\n'

  data.orders?.forEach((order: any) => {
    csv += [
      order.order_number || order.id,
      new Date(order.created_at).toLocaleDateString(),
      order.profiles?.full_name || order.profiles?.email || 'Unknown',
      order.cafeterias?.name || 'Unknown',
      order.total_amount || 0,
      order.user_service_fee || 0,
      order.cafeteria_commission || 0,
      order.admin_revenue || 0,
      order.status || 'Unknown'
    ].map(field => `"${field}"`).join(',') + '\n'
  })

  // Add summary
  csv += '\n\nSUMMARY\n'
  csv += 'Metric,Value\n'
  csv += `Total Revenue,"${data.summary?.total_revenue?.toFixed(2) || 0} EGP"\n`
  csv += `User Service Fees,"${data.summary?.user_service_fees?.toFixed(2) || 0} EGP"\n`
  csv += `Cafeteria Commissions,"${data.summary?.cafeteria_commissions?.toFixed(2) || 0} EGP"\n`
  csv += `Total Orders,"${data.summary?.total_orders || 0}"\n`
  csv += `Average Order Value,"${data.summary?.average_order_value?.toFixed(2) || 0} EGP"\n`

  return csv
}

function generateOrdersCSV(data: any): string {
  let csv = 'Order ID,Date,Customer,Customer Email,Cafeteria,Status,Total Amount,Items Count,Payment Method\n'

  data.orders?.forEach((order: any) => {
    const itemsCount = order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0

    csv += [
      order.order_number || order.id,
      new Date(order.created_at).toLocaleDateString(),
      order.profiles?.full_name || 'Unknown',
      order.profiles?.email || 'Unknown',
      order.cafeterias?.name || 'Unknown',
      order.status || 'Unknown',
      order.total_amount || 0,
      itemsCount,
      order.payment_method || 'Unknown'
    ].map(field => `"${field}"`).join(',') + '\n'
  })

  // Add summary
  csv += '\n\nSUMMARY\n'
  csv += 'Metric,Value\n'
  csv += `Total Orders,"${data.summary?.total_orders || 0}"\n`
  csv += `Completed Orders,"${data.summary?.completed_orders || 0}"\n`
  csv += `Cancelled Orders,"${data.summary?.cancelled_orders || 0}"\n`
  csv += `Pending Orders,"${data.summary?.pending_orders || 0}"\n`

  return csv
}

function generateUsersCSV(data: any): string {
  let csv = 'User ID,Full Name,Email,Role,Phone,Created Date,University,Year\n'

  data.users?.forEach((user: any) => {
    csv += [
      user.id,
      user.full_name || 'Unknown',
      user.email || 'Unknown',
      user.role || 'Unknown',
      user.phone || 'Not provided',
      new Date(user.created_at).toLocaleDateString(),
      user.university || 'Not provided',
      user.year || 'Not provided'
    ].map(field => `"${field}"`).join(',') + '\n'
  })

  // Add summary
  csv += '\n\nSUMMARY\n'
  csv += 'Metric,Value\n'
  csv += `Total Users,"${data.summary?.total_users || 0}"\n`
  csv += `Students,"${data.summary?.students || 0}"\n`
  csv += `Cafeteria Managers,"${data.summary?.cafeteria_managers || 0}"\n`
  csv += `Admins,"${data.summary?.admins || 0}"\n`

  return csv
}

function generatePerformanceCSV(data: any): string {
  let csv = 'Cafeteria ID,Name,Location,Status,Total Orders,Total Revenue,Average Rating,Active\n'

  data.cafeterias?.forEach((cafe: any) => {
    csv += [
      cafe.id,
      cafe.name || 'Unknown',
      cafe.location || 'Unknown',
      cafe.approval_status || 'Unknown',
      cafe.orders_in_period?.length || 0,
      cafe.total_revenue?.toFixed(2) || 0,
      cafe.average_rating?.toFixed(1) || 'N/A',
      cafe.is_active ? 'Yes' : 'No'
    ].map(field => `"${field}"`).join(',') + '\n'
  })

  // Add summary
  csv += '\n\nSUMMARY\n'
  csv += 'Metric,Value\n'
  csv += `Total Cafeterias,"${data.summary?.total_cafeterias || 0}"\n`
  csv += `Active Cafeterias,"${data.summary?.active_cafeterias || 0}"\n`

  return csv
}

function generateFeedbackCSV(data: any): string {
  let csv = 'Date,Customer,Cafeteria,Rating,Review Comment\n'

  data.feedback?.forEach((feedback: any) => {
    csv += [
      new Date(feedback.created_at).toLocaleDateString(),
      feedback.profiles?.full_name || feedback.profiles?.email || 'Unknown',
      feedback.cafeterias?.name || 'Unknown',
      feedback.rating || 'N/A',
      (feedback.review_comment || 'No comment').replace(/"/g, '""') // Escape quotes
    ].map(field => `"${field}"`).join(',') + '\n'
  })

  // Add summary
  csv += '\n\nSUMMARY\n'
  csv += 'Metric,Value\n'
  csv += `Total Reviews,"${data.summary?.total_reviews || 0}"\n`
  csv += `Average Rating,"${data.summary?.average_rating?.toFixed(1) || 0}/5"\n`
  csv += `5 Star Reviews,"${data.summary?.five_star || 0}"\n`
  csv += `4 Star Reviews,"${data.summary?.four_star || 0}"\n`
  csv += `3 Star Reviews,"${data.summary?.three_star || 0}"\n`
  csv += `2 Star Reviews,"${data.summary?.two_star || 0}"\n`
  csv += `1 Star Reviews,"${data.summary?.one_star || 0}"\n`

  return csv
}

function generateTextReport(data: any, reportType: string, reportName: string): string {
  let content = `${reportName}\n`
  content += `Generated on: ${new Date().toLocaleString()}\n`
  content += `Report Type: ${reportType.toUpperCase()}\n`
  content += '='.repeat(50) + '\n\n'

  switch (reportType) {
    case 'revenue':
      content += `REVENUE SUMMARY\n`
      content += `Total Revenue: ${data.summary?.total_revenue?.toFixed(2) || 0} EGP\n`
      content += `User Service Fees: ${data.summary?.user_service_fees?.toFixed(2) || 0} EGP\n`
      content += `Cafeteria Commissions: ${data.summary?.cafeteria_commissions?.toFixed(2) || 0} EGP\n`
      content += `Total Orders: ${data.summary?.total_orders || 0}\n`
      content += `Average Order Value: ${data.summary?.average_order_value?.toFixed(2) || 0} EGP\n`
      break
    case 'orders':
      content += `ORDERS SUMMARY\n`
      content += `Total Orders: ${data.summary?.total_orders || 0}\n`
      content += `Completed Orders: ${data.summary?.completed_orders || 0}\n`
      content += `Cancelled Orders: ${data.summary?.cancelled_orders || 0}\n`
      content += `Pending Orders: ${data.summary?.pending_orders || 0}\n`
      break
    case 'users':
      content += `USERS SUMMARY\n`
      content += `Total Users: ${data.summary?.total_users || 0}\n`
      content += `Students: ${data.summary?.students || 0}\n`
      content += `Cafeteria Managers: ${data.summary?.cafeteria_managers || 0}\n`
      content += `Admins: ${data.summary?.admins || 0}\n`
      break
    case 'performance':
      content += `PERFORMANCE SUMMARY\n`
      content += `Total Cafeterias: ${data.summary?.total_cafeterias || 0}\n`
      content += `Active Cafeterias: ${data.summary?.active_cafeterias || 0}\n`
      break
    case 'feedback':
      content += `FEEDBACK SUMMARY\n`
      content += `Total Reviews: ${data.summary?.total_reviews || 0}\n`
      content += `Average Rating: ${data.summary?.average_rating?.toFixed(1) || 0}/5\n`
      content += `5 Star Reviews: ${data.summary?.five_star || 0}\n`
      content += `4 Star Reviews: ${data.summary?.four_star || 0}\n`
      content += `3 Star Reviews: ${data.summary?.three_star || 0}\n`
      content += `2 Star Reviews: ${data.summary?.two_star || 0}\n`
      content += `1 Star Reviews: ${data.summary?.one_star || 0}\n`
      break
  }

  content += '\n' + '='.repeat(50) + '\n'
  content += 'This report was generated by UniEats Admin Dashboard\n'
  content += 'For detailed data, please download the CSV or JSON version.\n'

  return content
}
