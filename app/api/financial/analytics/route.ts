// Financial Analytics API Endpoint
import { NextRequest, NextResponse } from 'next/server'
import { getFinancialAnalytics, getCafeteriaFinancialSummary } from '@/lib/financial'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30'
    const cafeteriaId = searchParams.get('cafeteriaId')
    const type = searchParams.get('type') || 'admin' // 'admin' or 'cafeteria'
    
    // Get user from session (in production, you'd validate the JWT token)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (type === 'admin') {
      // Admin financial analytics
      const analytics = await getFinancialAnalytics(timeRange)
      
      if (!analytics) {
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
      }
      
      return NextResponse.json({
        success: true,
        data: analytics,
        timeRange: parseInt(timeRange),
        generatedAt: new Date().toISOString()
      })
      
    } else if (type === 'cafeteria' && cafeteriaId) {
      // Cafeteria financial summary
      const summary = await getCafeteriaFinancialSummary(cafeteriaId, timeRange)
      
      if (!summary) {
        return NextResponse.json({ error: 'Failed to fetch cafeteria summary' }, { status: 500 })
      }
      
      return NextResponse.json({
        success: true,
        data: summary,
        cafeteriaId,
        timeRange: parseInt(timeRange),
        generatedAt: new Date().toISOString()
      })
      
    } else {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Error in financial analytics API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create financial transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, cafeteriaId, userId, orderAmount, paymentMethod } = body
    
    if (!orderId || !cafeteriaId || !userId || !orderAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Import here to avoid circular dependencies
    const { createFinancialTransaction } = await import('@/lib/financial')
    
    const transaction = await createFinancialTransaction(
      orderId,
      cafeteriaId,
      userId,
      orderAmount,
      paymentMethod || 'cash_on_pickup'
    )
    
    if (!transaction) {
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      transaction,
      message: 'Financial transaction created successfully'
    })
    
  } catch (error) {
    console.error('Error creating financial transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Process transaction (mark as completed)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionId, action } = body
    
    if (!transactionId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    if (action === 'process') {
      const { processTransaction } = await import('@/lib/financial')
      const success = await processTransaction(transactionId)
      
      if (!success) {
        return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 })
      }
      
      return NextResponse.json({
        success: true,
        message: 'Transaction processed successfully'
      })
      
    } else if (action === 'refund') {
      // Handle refund logic
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'refunded',
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
      
      if (error) {
        return NextResponse.json({ error: 'Failed to refund transaction' }, { status: 500 })
      }
      
      return NextResponse.json({
        success: true,
        message: 'Transaction refunded successfully'
      })
      
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Error processing transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
