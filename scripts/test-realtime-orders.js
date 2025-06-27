const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testRealtimeOrderUpdates() {
  try {
    console.log('🧪 Testing real-time order updates...')
    
    // Find a recent order to test with
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, order_number')
      .order('created_at', { ascending: false })
      .limit(5)

    if (ordersError || !orders || orders.length === 0) {
      console.error('❌ No orders found for testing:', ordersError)
      return
    }

    console.log('📋 Available orders for testing:')
    orders.forEach((order, index) => {
      console.log(`  ${index + 1}. Order ${order.order_number} (${order.id}) - Status: ${order.status}`)
    })

    const testOrder = orders[0]
    console.log(`\n🎯 Testing with order: ${testOrder.order_number} (${testOrder.id})`)
    console.log(`📊 Current status: ${testOrder.status}`)

    // Test status updates
    const statusSequence = ['confirmed', 'preparing', 'ready', 'completed']
    const currentStatusIndex = statusSequence.indexOf(testOrder.status)
    
    if (currentStatusIndex === -1 || currentStatusIndex >= statusSequence.length - 1) {
      console.log('🔄 Resetting order status to "confirmed" for testing...')
      
      const { error: resetError } = await supabase
        .from('orders')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', testOrder.id)

      if (resetError) {
        console.error('❌ Error resetting order status:', resetError)
        return
      }
      
      console.log('✅ Order status reset to "confirmed"')
    }

    // Simulate status progression
    console.log('\n🔄 Simulating order status progression...')
    
    for (let i = 0; i < statusSequence.length; i++) {
      const newStatus = statusSequence[i]
      console.log(`\n📝 Updating order to: ${newStatus}`)
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', testOrder.id)

      if (updateError) {
        console.error(`❌ Error updating order to ${newStatus}:`, updateError)
        continue
      }
      
      console.log(`✅ Order updated to: ${newStatus}`)
      
      // Wait between updates to simulate real progression
      if (i < statusSequence.length - 1) {
        console.log('⏳ Waiting 3 seconds before next update...')
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
    }

    console.log('\n🎉 Real-time order update test completed!')
    console.log('📱 Check the mobile app to see if the order status updated in real-time')
    
  } catch (error) {
    console.error('❌ Error testing real-time updates:', error)
  }
}

async function testInventoryDeduction() {
  try {
    console.log('\n🧪 Testing inventory deduction system...')
    
    // Find a completed order to test inventory impact
    const { data: completedOrders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id, 
        status, 
        order_number,
        order_items (
          quantity,
          menu_items (
            name,
            menu_item_ingredients (
              quantity_needed,
              unit,
              inventory_items (
                name,
                quantity,
                unit
              )
            )
          )
        )
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(3)

    if (ordersError || !completedOrders || completedOrders.length === 0) {
      console.error('❌ No completed orders found for testing:', ordersError)
      return
    }

    console.log('📋 Recent completed orders and their inventory impact:')
    
    completedOrders.forEach((order, index) => {
      console.log(`\n  ${index + 1}. Order ${order.order_number}:`)
      
      order.order_items.forEach(orderItem => {
        const menuItem = orderItem.menu_items
        console.log(`    📦 ${menuItem.name} (qty: ${orderItem.quantity})`)
        
        if (menuItem.menu_item_ingredients && menuItem.menu_item_ingredients.length > 0) {
          menuItem.menu_item_ingredients.forEach(ingredient => {
            const totalUsed = ingredient.quantity_needed * orderItem.quantity
            const inventoryItem = ingredient.inventory_items
            
            console.log(`      🥘 ${inventoryItem.name}: used ${totalUsed} ${ingredient.unit}`)
            console.log(`         📊 Current inventory: ${inventoryItem.quantity} ${inventoryItem.unit}`)
          })
        }
      })
    })

    console.log('\n✅ Inventory deduction test completed!')
    
  } catch (error) {
    console.error('❌ Error testing inventory deduction:', error)
  }
}

// Run tests
async function runAllTests() {
  await testRealtimeOrderUpdates()
  await testInventoryDeduction()
  process.exit(0)
}

runAllTests()
