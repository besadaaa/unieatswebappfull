import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

// Create Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type')
    const format = searchParams.get('format')

    if (!reportType || !format) {
      return NextResponse.json(
        { error: 'Missing required parameters: type and format' },
        { status: 400 }
      )
    }

    console.log(`Generating ${reportType} report in ${format} format`)

    // Generate report data
    let reportData: any[] = []
    let headers: string[] = []
    let title = ''

    switch (reportType) {
      case 'revenue':
        const revenueData = await generateRevenueReport()
        reportData = revenueData.data
        headers = revenueData.headers
        title = 'Platform Revenue Report'
        break
      
      case 'orders':
        const ordersData = await generateOrdersReport()
        reportData = ordersData.data
        headers = ordersData.headers
        title = 'Orders Report'
        break

      case 'users':
        const usersData = await generateUsersReport()
        reportData = usersData.data
        headers = usersData.headers
        title = 'Users Report'
        break

      case 'inventory':
        const inventoryData = await generateInventoryReport()
        reportData = inventoryData.data
        headers = inventoryData.headers
        title = 'Inventory Report'
        break

      case 'feedback':
        const feedbackData = await generateFeedbackReport()
        reportData = feedbackData.data
        headers = feedbackData.headers
        title = 'Customer Feedback Report'
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    console.log(`Generated ${reportData.length} rows of data`)

    // Generate file
    let fileBuffer: Buffer
    let contentType: string
    let filename: string

    if (format === 'csv') {
      const csvContent = generateCSV(headers, reportData)
      fileBuffer = Buffer.from(csvContent, 'utf-8')
      contentType = 'text/csv'
      filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`
    } else if (format === 'excel') {
      fileBuffer = generateExcel(headers, reportData, title)
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.xlsx`
    } else {
      return NextResponse.json(
        { error: 'Unsupported format. Use csv or excel.' },
        { status: 400 }
      )
    }

    // Return file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

// Report generation functions
async function generateRevenueReport() {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        admin_revenue,
        cafeteria_revenue,
        cafeteria_commission,
        user_service_fee,
        status,
        created_at,
        cafeterias!inner (
          id,
          name
        )
      `)
      .eq('status', 'completed')
      .not('admin_revenue', 'is', null)

    if (error) {
      console.error('Revenue report error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    if (!orders || orders.length === 0) {
      return {
        headers: ['Cafeteria', 'Orders', 'Total Amount (EGP)', 'Admin Revenue (EGP)', 'User Service Fee (EGP)', 'Cafeteria Commission (EGP)', 'Cafeteria Revenue (EGP)'],
        data: [['No completed orders with revenue data found', '', '', '', '', '', '']]
      }
    }

    // Group by cafeteria and calculate actual revenue
    const cafeteriaStats: { [key: string]: any } = {}
    let totalAdminRevenue = 0
    let totalUserServiceFee = 0
    let totalCafeteriaCommission = 0
    let totalCafeteriaRevenue = 0
    let totalGrossRevenue = 0
    let totalOrders = 0

    orders.forEach((order: any) => {
      const cafeteriaId = order.cafeterias?.id || 'unknown'
      const cafeteriaName = order.cafeterias?.name || 'Unknown Cafeteria'
      const totalAmount = parseFloat(order.total_amount || 0)
      const adminRevenue = parseFloat(order.admin_revenue || 0)
      const userServiceFee = parseFloat(order.user_service_fee || 0)
      const cafeteriaCommission = parseFloat(order.cafeteria_commission || 0)
      const cafeteriaRevenue = parseFloat(order.cafeteria_revenue || 0)

      if (!cafeteriaStats[cafeteriaId]) {
        cafeteriaStats[cafeteriaId] = {
          name: cafeteriaName,
          totalOrders: 0,
          totalAmount: 0,
          adminRevenue: 0,
          userServiceFee: 0,
          cafeteriaCommission: 0,
          cafeteriaRevenue: 0
        }
      }

      cafeteriaStats[cafeteriaId].totalOrders += 1
      cafeteriaStats[cafeteriaId].totalAmount += totalAmount
      cafeteriaStats[cafeteriaId].adminRevenue += adminRevenue
      cafeteriaStats[cafeteriaId].userServiceFee += userServiceFee
      cafeteriaStats[cafeteriaId].cafeteriaCommission += cafeteriaCommission
      cafeteriaStats[cafeteriaId].cafeteriaRevenue += cafeteriaRevenue

      // Platform totals
      totalOrders += 1
      totalGrossRevenue += totalAmount
      totalAdminRevenue += adminRevenue
      totalUserServiceFee += userServiceFee
      totalCafeteriaCommission += cafeteriaCommission
      totalCafeteriaRevenue += cafeteriaRevenue
    })

    const reportData = Object.values(cafeteriaStats).map((stats: any) => [
      stats.name,
      stats.totalOrders,
      stats.totalAmount.toFixed(2),
      stats.adminRevenue.toFixed(2),
      stats.userServiceFee.toFixed(2),
      stats.cafeteriaCommission.toFixed(2),
      stats.cafeteriaRevenue.toFixed(2)
    ])

    // Add summary rows for admin overview
    const avgOrderValue = totalGrossRevenue / totalOrders
    const adminRevenuePercentage = (totalAdminRevenue / totalGrossRevenue) * 100

    // Add platform summary at the top
    reportData.unshift([
      '🏢 PLATFORM SUMMARY',
      '',
      '',
      '',
      '',
      '',
      ''
    ])

    reportData.push([
      '💰 TOTAL PLATFORM EARNINGS',
      totalOrders,
      totalGrossRevenue.toFixed(2),
      totalAdminRevenue.toFixed(2),
      totalUserServiceFee.toFixed(2),
      totalCafeteriaCommission.toFixed(2),
      totalCafeteriaRevenue.toFixed(2)
    ])

    reportData.push([
      '📊 PLATFORM METRICS',
      'Avg Order: ' + avgOrderValue.toFixed(2) + ' EGP',
      'Admin Rate: ' + adminRevenuePercentage.toFixed(1) + '%',
      'Total Admin: ' + totalAdminRevenue.toFixed(2) + ' EGP',
      'User Fees: ' + totalUserServiceFee.toFixed(2) + ' EGP',
      'Vendor Fees: ' + totalCafeteriaCommission.toFixed(2) + ' EGP',
      'Vendor Net: ' + totalCafeteriaRevenue.toFixed(2) + ' EGP'
    ])

    reportData.push([
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ])

    reportData.push([
      '📊 BREAKDOWN BY CAFETERIA',
      '',
      '',
      '',
      '',
      '',
      ''
    ])

    return {
      headers: ['Cafeteria', 'Orders', 'Total Amount (EGP)', 'Admin Revenue (EGP)', 'User Service Fee (EGP)', 'Cafeteria Commission (EGP)', 'Cafeteria Revenue (EGP)'],
      data: reportData
    }
  } catch (error) {
    console.error('Revenue report generation failed:', error)
    throw error
  }
}

async function generateOrdersReport() {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total_amount,
        status,
        payment_status,
        payment_method,
        rating,
        review_comment,
        created_at,
        completed_at,
        student_id,
        cafeterias (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) {
      console.error('Orders report error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    if (!orders || orders.length === 0) {
      return {
        headers: ['Order Number', 'Order ID', 'Customer ID', 'Cafeteria', 'Status', 'Payment Status', 'Payment Method', 'Total Amount (EGP)', 'Rating', 'Review', 'Created At', 'Completed At'],
        data: [['No orders found', '', '', '', '', '', '', '', '', '', '', '']]
      }
    }

    // Get user emails from auth.users
    const userIds = [...new Set(orders.map(order => order.student_id).filter(Boolean))]
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .in('id', userIds)

    if (usersError) {
      console.error('Error fetching user emails:', usersError)
    }

    const userEmailMap = new Map()
    if (users) {
      users.forEach(user => {
        userEmailMap.set(user.id, user.email)
      })
    }

    const reportData = orders.map((order: any) => [
      order.order_number || 'N/A',
      order.id || 'N/A',
      userEmailMap.get(order.student_id) || order.student_id || 'Unknown',
      order.cafeterias?.name || 'Unknown',
      order.status || 'N/A',
      order.payment_status || 'N/A',
      order.payment_method || 'N/A',
      parseFloat(order.total_amount || 0).toFixed(2),
      order.rating || 'No rating',
      order.review_comment || 'No review',
      order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A',
      order.completed_at ? new Date(order.completed_at).toLocaleString() : 'Not completed'
    ])

    return {
      headers: ['Order Number', 'Order ID', 'Customer Email', 'Cafeteria', 'Status', 'Payment Status', 'Payment Method', 'Total Amount (EGP)', 'Rating', 'Review', 'Created At', 'Completed At'],
      data: reportData
    }
  } catch (error) {
    console.error('Orders report generation failed:', error)
    throw error
  }
}

async function generateUsersReport() {
  try {
    console.log('Starting users report generation...')

    // Get profiles data first
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, first_name, last_name, role, status, is_active, is_suspended, university, year, phone, created_at, updated_at')
      .limit(1000)

    if (profilesError) {
      console.error('Profiles error:', profilesError)
      throw new Error(`Cannot access profiles: ${profilesError.message}`)
    }

    if (!profilesData || profilesData.length === 0) {
      return {
        headers: ['User ID', 'Full Name', 'Role', 'Status', 'University', 'Year', 'Phone', 'Account Created', 'Total Orders', 'Total Spent'],
        data: [['No users found', '', '', '', '', '', '', '', '', '']]
      }
    }

    // Get order statistics for each user
    const { data: orderStats, error: orderError } = await supabase
      .from('orders')
      .select('student_id, total_amount, status')
      .eq('status', 'completed')

    const userOrderStats = new Map()
    if (orderStats && !orderError) {
      orderStats.forEach(order => {
        const userId = order.student_id
        if (!userOrderStats.has(userId)) {
          userOrderStats.set(userId, { count: 0, totalSpent: 0 })
        }
        const stats = userOrderStats.get(userId)
        stats.count += 1
        stats.totalSpent += parseFloat(order.total_amount || 0)
      })
    }

    const reportData = profilesData.map((profile: any) => {
      const orderStat = userOrderStats.get(profile.id) || { count: 0, totalSpent: 0 }
      const fullName = profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'N/A'
      const status = profile.is_suspended ? 'Suspended' : (profile.is_active ? 'Active' : 'Inactive')

      return [
        profile.id || 'N/A',
        fullName,
        profile.role || 'student',
        status,
        profile.university || 'N/A',
        profile.year || 'N/A',
        profile.phone || 'N/A',
        profile.created_at ? new Date(profile.created_at).toLocaleString() : 'N/A',
        orderStat.count,
        orderStat.totalSpent.toFixed(2) + ' EGP'
      ]
    })

    return {
      headers: ['User ID', 'Full Name', 'Role', 'Status', 'University', 'Year', 'Phone', 'Account Created', 'Total Orders', 'Total Spent'],
      data: reportData
    }

  } catch (error) {
    console.error('Users report generation failed:', error)
    return {
      headers: ['User ID', 'Full Name', 'Role', 'Status', 'University', 'Year', 'Phone', 'Account Created', 'Total Orders', 'Total Spent'],
      data: [['Error generating users report: ' + (error instanceof Error ? error.message : 'Unknown error'), '', '', '', '', '', '', '', '', '']]
    }
  }
}

async function generateInventoryReport() {
  try {
    const { data: items, error } = await supabase
      .from('inventory_items')
      .select(`
        id,
        name,
        quantity,
        unit,
        min_quantity,
        updated_at,
        cafeterias (
          name
        )
      `)
      .limit(1000)

    if (error) {
      console.error('Inventory report error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    if (!items || items.length === 0) {
      return {
        headers: ['Item Name', 'Cafeteria', 'Current Stock', 'Unit', 'Min Quantity', 'Stock Status', 'Last Updated'],
        data: [['No inventory items found', '', '', '', '', '', '']]
      }
    }

    const reportData = items.map((item: any) => {
      const currentStock = parseFloat(item.quantity || 0)
      const minQuantity = parseFloat(item.min_quantity || 0)
      const stockStatus = currentStock <= minQuantity ? 'Low Stock' : 'In Stock'
      
      return [
        item.name || 'N/A',
        item.cafeterias?.name || 'Unknown',
        currentStock.toFixed(2),
        item.unit || 'N/A',
        minQuantity.toFixed(2),
        stockStatus,
        item.updated_at ? new Date(item.updated_at).toLocaleString() : 'N/A'
      ]
    })

    return {
      headers: ['Item Name', 'Cafeteria', 'Current Stock', 'Unit', 'Min Quantity', 'Stock Status', 'Last Updated'],
      data: reportData
    }
  } catch (error) {
    console.error('Inventory report generation failed:', error)
    throw error
  }
}

async function generateFeedbackReport() {
  try {
    // Get order ratings and reviews (main source of feedback)
    const { data: orderFeedback, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        rating,
        review_comment,
        created_at,
        completed_at,
        student_id,
        cafeterias (
          name
        )
      `)
      .not('rating', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1000)

    if (orderError) {
      console.error('Order feedback error:', orderError)
      throw new Error(`Database error: ${orderError.message}`)
    }

    // Get user emails
    const userIds = [...new Set(orderFeedback?.map(order => order.student_id).filter(Boolean) || [])]
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .in('id', userIds)

    const userEmailMap = new Map()
    if (users && !usersError) {
      users.forEach(user => {
        userEmailMap.set(user.id, user.email)
      })
    }

    const reportData: any[] = []

    // Add order feedback
    if (orderFeedback && orderFeedback.length > 0) {
      orderFeedback.forEach((order: any) => {
        reportData.push([
          'Order Review',
          order.order_number || order.id,
          order.cafeterias?.name || 'Unknown Cafeteria',
          userEmailMap.get(order.student_id) || 'Unknown Customer',
          order.rating || 'N/A',
          order.review_comment || 'No comment',
          order.completed_at ? new Date(order.completed_at).toLocaleString() : 'N/A'
        ])
      })
    }

    // Try to get additional feedback from other tables
    try {
      const { data: menuRatings, error: menuError } = await supabase
        .from('menu_item_ratings')
        .select(`
          id,
          rating,
          comment,
          created_at,
          menu_items (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (menuRatings && !menuError) {
        menuRatings.forEach((rating: any) => {
          reportData.push([
            'Menu Item Rating',
            rating.menu_items?.name || 'Unknown Item',
            'N/A',
            'Unknown Customer',
            rating.rating || 'N/A',
            rating.comment || 'No comment',
            rating.created_at ? new Date(rating.created_at).toLocaleString() : 'N/A'
          ])
        })
      }
    } catch (error) {
      console.log('Menu ratings not available:', error)
    }

    try {
      const { data: cafeteriaRatings, error: cafeteriaError } = await supabase
        .from('cafeteria_ratings')
        .select(`
          id,
          rating,
          comment,
          created_at,
          cafeterias (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (cafeteriaRatings && !cafeteriaError) {
        cafeteriaRatings.forEach((rating: any) => {
          reportData.push([
            'Cafeteria Rating',
            'N/A',
            rating.cafeterias?.name || 'Unknown Cafeteria',
            'Unknown Customer',
            rating.rating || 'N/A',
            rating.comment || 'No comment',
            rating.created_at ? new Date(rating.created_at).toLocaleString() : 'N/A'
          ])
        })
      }
    } catch (error) {
      console.log('Cafeteria ratings not available:', error)
    }

    if (reportData.length === 0) {
      reportData.push(['No feedback found', '', '', '', '', '', ''])
    }

    return {
      headers: ['Feedback Type', 'Order/Item', 'Cafeteria', 'Customer Email', 'Rating', 'Comment', 'Date'],
      data: reportData
    }
  } catch (error) {
    console.error('Feedback report generation failed:', error)
    return {
      headers: ['Feedback Type', 'Order/Item', 'Cafeteria', 'Customer Email', 'Rating', 'Comment', 'Date'],
      data: [['Error generating feedback report', '', '', '', '', '', '']]
    }
  }
}

// File generation functions
function generateCSV(headers: string[], data: any[]): string {
  const csvRows = [headers.join(',')]
  
  data.forEach(row => {
    const csvRow = row.map((field: any) => {
      const stringField = String(field || '')
      // Escape quotes and wrap in quotes if contains comma
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`
      }
      return stringField
    })
    csvRows.push(csvRow.join(','))
  })
  
  return csvRows.join('\n')
}

function generateExcel(headers: string[], data: any[], title: string): Buffer {
  try {
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, title)
    
    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }))
  } catch (error) {
    console.error('Excel generation error:', error)
    throw new Error('Failed to generate Excel file')
  }
}
