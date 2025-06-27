import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type')
    const format = searchParams.get('format') || 'csv'

    if (!reportType) {
      return NextResponse.json(
        { error: 'Report type is required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createSupabaseAdmin()
    
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      )
    }

    let data: any[] = []
    let filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}`

    // Generate report data based on type
    switch (reportType) {
      case 'revenue':
        data = await generateRevenueReport(supabaseAdmin)
        filename = `admin-revenue-report-${new Date().toISOString().split('T')[0]}`
        break
      case 'orders':
        data = await generateOrdersReport(supabaseAdmin)
        filename = `orders-report-${new Date().toISOString().split('T')[0]}`
        break
      case 'users':
        data = await generateUsersReport(supabaseAdmin)
        filename = `users-report-${new Date().toISOString().split('T')[0]}`
        break
      case 'inventory':
        data = await generateInventoryReport(supabaseAdmin)
        filename = `inventory-report-${new Date().toISOString().split('T')[0]}`
        break
      case 'ratings':
        data = await generateRatingsReport(supabaseAdmin)
        filename = `ratings-report-${new Date().toISOString().split('T')[0]}`
        break
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    if (format === 'csv') {
      const csv = convertToCSV(data)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        }
      })
    } else {
      // For Excel format, return CSV for now (can be enhanced later)
      const csv = convertToCSV(data)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`
        }
      })
    }

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

async function generateRevenueReport(supabase: any) {
  console.log('💰 Generating revenue report...')

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching revenue orders:', error)
    return []
  }

  console.log(`💰 Found ${orders?.length || 0} revenue orders`)

  if (!orders || orders.length === 0) {
    return [{
      'Order ID': 'No orders found',
      'Date': new Date().toLocaleDateString(),
      'Total Amount': 0,
      'User Service Fee': 0,
      'Cafeteria Commission': 0,
      'Admin Revenue': 0,
      'Status': 'N/A'
    }]
  }

  return orders.map((order: any) => ({
    'Order ID': order.id || 'Unknown',
    'Date': order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown',
    'Total Amount': order.total_amount || 0,
    'User Service Fee': order.user_service_fee || 0,
    'Cafeteria Commission': order.cafeteria_commission || 0,
    'Admin Revenue': order.admin_revenue || 0,
    'Status': order.status || 'Unknown'
  }))
}

async function generateOrdersReport(supabase: any) {
  console.log('🔍 Generating orders report...')

  // First, get all orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (ordersError) {
    console.error('Error fetching orders:', ordersError)
    return []
  }

  console.log(`📊 Found ${orders?.length || 0} orders`)

  if (!orders || orders.length === 0) {
    return [{
      'Order ID': 'No orders found',
      'Date': new Date().toLocaleDateString(),
      'Customer': 'N/A',
      'Customer Email': 'N/A',
      'Cafeteria': 'N/A',
      'Total Amount': 0,
      'Status': 'N/A',
      'Payment Method': 'N/A'
    }]
  }

  // Get user profiles separately
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')

  // Get cafeterias separately
  const { data: cafeterias } = await supabase
    .from('cafeterias')
    .select('id, name')

  console.log(`👥 Found ${profiles?.length || 0} profiles, 🏪 ${cafeterias?.length || 0} cafeterias`)

  // Create lookup maps
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
  const cafeteriaMap = new Map(cafeterias?.map(c => [c.id, c]) || [])

  return orders.map((order: any) => {
    const profile = profileMap.get(order.user_id)
    const cafeteria = cafeteriaMap.get(order.cafeteria_id)

    return {
      'Order ID': order.id || 'Unknown',
      'Date': order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Unknown',
      'Customer': profile?.full_name || 'Unknown Customer',
      'Customer Email': profile?.email || 'Unknown Email',
      'Cafeteria': cafeteria?.name || 'Unknown Cafeteria',
      'Total Amount': order.total_amount || 0,
      'Status': order.status || 'Unknown',
      'Payment Method': order.payment_method || 'Unknown',
      'User Service Fee': order.user_service_fee || 0,
      'Cafeteria Commission': order.cafeteria_commission || 0,
      'Admin Revenue': order.admin_revenue || 0
    }
  })
}

async function generateUsersReport(supabase: any) {
  console.log('👥 Generating users report...')

  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  console.log(`👥 Found ${users?.length || 0} users`)

  if (!users || users.length === 0) {
    return [{
      'User ID': 'No users found',
      'Full Name': 'N/A',
      'Email': 'N/A',
      'Role': 'N/A',
      'Status': 'N/A',
      'Created Date': new Date().toLocaleDateString(),
      'Last Login': 'Never'
    }]
  }

  return users.map((user: any) => ({
    'User ID': user.id || 'Unknown',
    'Full Name': user.full_name || 'Unknown',
    'Email': user.email || 'Unknown',
    'Role': user.role || 'Unknown',
    'Status': user.status || 'Unknown',
    'Created Date': user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown',
    'Last Login': user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'
  }))
}

async function generateInventoryReport(supabase: any) {
  const { data: items } = await supabase
    .from('menu_items')
    .select(`
      *,
      cafeterias:cafeteria_id(name)
    `)
    .order('created_at', { ascending: false })

  return items?.map((item: any) => ({
    'Item ID': item.id,
    'Name': item.name || 'Unknown',
    'Cafeteria': item.cafeterias?.name || 'Unknown',
    'Price': item.price || 0,
    'Category': item.category || 'Unknown',
    'Available': item.is_available ? 'Yes' : 'No',
    'Created Date': new Date(item.created_at).toLocaleDateString()
  })) || []
}

async function generateRatingsReport(supabase: any) {
  const { data: ratings } = await supabase
    .from('ratings')
    .select(`
      *,
      profiles:user_id(full_name),
      cafeterias:cafeteria_id(name)
    `)
    .order('created_at', { ascending: false })

  return ratings?.map((rating: any) => ({
    'Rating ID': rating.id,
    'Date': new Date(rating.created_at).toLocaleDateString(),
    'Customer': rating.profiles?.full_name || 'Unknown',
    'Cafeteria': rating.cafeterias?.name || 'Unknown',
    'Rating': rating.rating || 0,
    'Comment': rating.comment || 'No comment'
  })) || []
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) {
    return 'No data available'
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  return csvContent
}
