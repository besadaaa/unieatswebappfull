// API endpoint to create sample data for testing
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Creating sample data for reports testing...')

    // Get existing users and cafeterias
    const { data: users } = await supabase
      .from('profiles')
      .select('id, role')
      .limit(10)

    const { data: cafeterias } = await supabase
      .from('cafeterias')
      .select('id, name')
      .limit(5)

    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('id, name, price, cafeteria_id')
      .limit(20)

    if (!users?.length || !cafeterias?.length || !menuItems?.length) {
      return NextResponse.json({
        error: 'No existing users, cafeterias, or menu items found. Please create some first.'
      }, { status: 400 })
    }

    const students = users.filter(u => u.role === 'student')
    if (!students.length) {
      return NextResponse.json({
        error: 'No student users found. Please create some student accounts first.'
      }, { status: 400 })
    }

    // Generate sample orders for the last 30 days
    const orders = []
    const transactions = []
    const orderItems = []

    for (let i = 0; i < 50; i++) {
      const randomDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      const randomStudent = students[Math.floor(Math.random() * students.length)]
      const randomCafeteria = cafeterias[Math.floor(Math.random() * cafeterias.length)]
      const cafeteriaMenuItems = menuItems.filter(item => item.cafeteria_id === randomCafeteria.id)
      
      if (cafeteriaMenuItems.length === 0) continue

      // Create order
      const orderId = `order_${Date.now()}_${i}`
      const orderItemsCount = Math.floor(Math.random() * 3) + 1 // 1-3 items
      let totalAmount = 0

      // Create order items
      const selectedItems = []
      for (let j = 0; j < orderItemsCount; j++) {
        const randomItem = cafeteriaMenuItems[Math.floor(Math.random() * cafeteriaMenuItems.length)]
        const quantity = Math.floor(Math.random() * 3) + 1 // 1-3 quantity
        const itemTotal = randomItem.price * quantity
        totalAmount += itemTotal

        selectedItems.push({
          id: `item_${orderId}_${j}`,
          order_id: orderId,
          menu_item_id: randomItem.id,
          quantity,
          price: randomItem.price,
          created_at: randomDate.toISOString()
        })
      }

      // Calculate fees and commissions (4% service fee capped at 20 EGP, 10% commission)
      const serviceFee = Math.min(totalAmount * 0.04, 20)
      const commission = totalAmount * 0.10
      const netToCafeteria = totalAmount - commission
      const platformRevenue = serviceFee + commission

      const order = {
        id: orderId,
        user_id: randomStudent.id,
        cafeteria_id: randomCafeteria.id,
        total_amount: totalAmount,
        status: ['completed', 'completed', 'completed', 'cancelled', 'preparing'][Math.floor(Math.random() * 5)],
        pickup_time: new Date(randomDate.getTime() + 30 * 60 * 1000).toISOString(), // 30 minutes later
        rating: Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : null, // 70% chance of rating
        created_at: randomDate.toISOString(),
        updated_at: randomDate.toISOString()
      }

      // Create transaction
      const transaction = {
        id: `trans_${orderId}`,
        order_id: orderId,
        cafeteria_id: randomCafeteria.id,
        user_id: randomStudent.id,
        order_amount: totalAmount,
        service_fee: serviceFee,
        commission: commission,
        net_to_cafeteria: netToCafeteria,
        platform_revenue: platformRevenue,
        status: order.status === 'completed' ? 'processed' : 'pending',
        processed_at: order.status === 'completed' ? randomDate.toISOString() : null,
        created_at: randomDate.toISOString()
      }

      orders.push(order)
      transactions.push(transaction)
      orderItems.push(...selectedItems)
    }

    // Insert sample data
    const { error: ordersError } = await supabase
      .from('orders')
      .insert(orders)

    if (ordersError) {
      console.error('Error inserting orders:', ordersError)
      return NextResponse.json({
        error: 'Failed to insert orders: ' + ordersError.message
      }, { status: 500 })
    }

    const { error: transactionsError } = await supabase
      .from('transactions')
      .insert(transactions)

    if (transactionsError) {
      console.error('Error inserting transactions:', transactionsError)
      return NextResponse.json({
        error: 'Failed to insert transactions: ' + transactionsError.message
      }, { status: 500 })
    }

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error inserting order items:', itemsError)
      return NextResponse.json({
        error: 'Failed to insert order items: ' + itemsError.message
      }, { status: 500 })
    }

    // Calculate totals
    const totalRevenue = transactions.reduce((sum, t) => sum + t.order_amount, 0)
    const totalCommissions = transactions.reduce((sum, t) => sum + t.commission, 0)
    const totalServiceFees = transactions.reduce((sum, t) => sum + t.service_fee, 0)
    
    return NextResponse.json({
      success: true,
      message: 'Sample data created successfully!',
      data: {
        orders_created: orders.length,
        transactions_created: transactions.length,
        order_items_created: orderItems.length,
        total_revenue: totalRevenue.toFixed(2),
        total_commissions: totalCommissions.toFixed(2),
        total_service_fees: totalServiceFees.toFixed(2),
        platform_revenue: (totalCommissions + totalServiceFees).toFixed(2)
      }
    })

  } catch (error) {
    console.error('Error creating sample data:', error)
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
}
