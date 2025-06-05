import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, getCurrentUser } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const reportType = searchParams.get('type') || 'orders'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const supabaseAdmin = createSupabaseAdmin()

    let data: any[] = []
    let filename = 'report'

    switch (reportType) {
      case 'orders':
        filename = 'orders_report'
        const { data: orders, error: ordersError } = await supabaseAdmin
          .from('orders')
          .select(`
            id,
            total_amount,
            admin_revenue,
            status,
            created_at,
            pickup_time,
            cafeterias!orders_cafeteria_id_fkey(name, location),
            profiles!orders_user_id_fkey(full_name, email),
            order_items(quantity, price, menu_items(name))
          `)
          .gte('created_at', startDate || '2024-01-01')
          .lte('created_at', endDate || new Date().toISOString())
          .order('created_at', { ascending: false })

        if (ordersError) throw ordersError

        data = orders?.map(order => ({
          'Order ID': order.id,
          'Cafeteria': order.cafeterias?.name || 'Unknown',
          'Location': order.cafeterias?.location || 'Unknown',
          'Customer': order.profiles?.full_name || 'Anonymous',
          'Customer Email': order.profiles?.email || 'N/A',
          'Total Amount (EGP)': order.total_amount,
          'Admin Revenue (EGP)': order.admin_revenue,
          'Status': order.status,
          'Items Count': order.order_items?.length || 0,
          'Order Date': new Date(order.created_at).toLocaleDateString(),
          'Order Time': new Date(order.created_at).toLocaleTimeString(),
          'Pickup Time': order.pickup_time ? new Date(order.pickup_time).toLocaleString() : 'N/A'
        })) || []
        break

      case 'revenue':
        filename = 'revenue_report'
        const { data: transactions, error: transError } = await supabaseAdmin
          .from('transactions')
          .select(`
            *,
            cafeterias!transactions_cafeteria_id_fkey(name, location),
            profiles!transactions_user_id_fkey(full_name, email)
          `)
          .gte('created_at', startDate || '2024-01-01')
          .lte('created_at', endDate || new Date().toISOString())
          .order('created_at', { ascending: false })

        if (transError) throw transError

        data = transactions?.map(trans => ({
          'Transaction ID': trans.id,
          'Order ID': trans.order_id,
          'Cafeteria': trans.cafeterias?.name || 'Unknown',
          'Customer': trans.profiles?.full_name || 'Anonymous',
          'Order Amount (EGP)': trans.order_amount,
          'Service Fee (EGP)': trans.service_fee,
          'Commission (EGP)': trans.commission,
          'Net to Cafeteria (EGP)': trans.net_to_cafeteria,
          'Platform Revenue (EGP)': trans.platform_revenue,
          'Status': trans.status,
          'Payment Method': trans.payment_method,
          'Date': new Date(trans.created_at).toLocaleDateString(),
          'Time': new Date(trans.created_at).toLocaleTimeString()
        })) || []
        break

      case 'cafeterias':
        filename = 'cafeterias_report'
        const { data: cafeterias, error: cafError } = await supabaseAdmin
          .from('cafeterias')
          .select(`
            *,
            profiles!cafeterias_owner_id_fkey(full_name, email, phone)
          `)
          .order('created_at', { ascending: false })

        if (cafError) throw cafError

        data = cafeterias?.map(caf => ({
          'Cafeteria ID': caf.id,
          'Name': caf.name,
          'Location': caf.location,
          'Description': caf.description,
          'Owner': caf.profiles?.full_name || 'Unknown',
          'Owner Email': caf.profiles?.email || 'N/A',
          'Owner Phone': caf.profiles?.phone || 'N/A',
          'Rating': caf.rating,
          'Is Active': caf.is_active ? 'Yes' : 'No',
          'Is Open': caf.is_open ? 'Yes' : 'No',
          'Approval Status': caf.approval_status,
          'Created Date': new Date(caf.created_at).toLocaleDateString()
        })) || []
        break

      case 'users':
        filename = 'users_report'
        const { data: users, error: usersError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (usersError) throw usersError

        data = users?.map(user => ({
          'User ID': user.id,
          'Full Name': user.full_name || 'N/A',
          'Email': user.email,
          'Role': user.role,
          'Phone': user.phone || 'N/A',
          'Status': user.status || 'active',
          'Is Active': user.is_active ? 'Yes' : 'No',
          'Last Login': user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never',
          'Created Date': new Date(user.created_at).toLocaleDateString()
        })) || []
        break

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No data found for the specified criteria' },
        { status: 404 }
      )
    }

    if (format === 'csv') {
      // Generate CSV
      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value
          }).join(',')
        )
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else {
      // Return JSON
      return NextResponse.json({
        success: true,
        reportType,
        data,
        total: data.length,
        dateRange: { startDate, endDate },
        exported_at: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
