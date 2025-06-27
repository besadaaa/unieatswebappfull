import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Update cafeteria operational status
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/cafeteria/status - Request received')

    const body = await request.json()
    const { cafeteria_id, status, message, user_id } = body

    console.log('Request body:', { cafeteria_id, status, message, user_id })

    // Validate required fields
    if (!cafeteria_id || !status) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: cafeteria_id and status' },
        { status: 400 }
      )
    }

    // Validate status values
    const validStatuses = ['open', 'busy', 'closed', 'temporarily_closed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    console.log(`Updating cafeteria ${cafeteria_id} status to ${status}`)

    // Try using the database function first
    let updateResult
    try {
      const { data, error } = await supabase
        .rpc('update_cafeteria_status', {
          cafeteria_id,
          new_status: status,
          status_message: message || '',
          updated_by: user_id
        })

      if (error) {
        console.error('RPC function error:', error)
        throw new Error(`RPC error: ${error.message}`)
      }

      if (!data || !data.success) {
        console.error('RPC function returned error:', data)
        throw new Error(data?.error || 'RPC function failed')
      }

      updateResult = data
      console.log(`Successfully updated cafeteria status via RPC:`, data)
    } catch (rpcError) {
      console.log('RPC failed, trying direct update:', rpcError)

      // Fallback to direct update
      const { data: updateData, error: updateError } = await supabase
        .from('cafeterias')
        .update({
          operational_status: status,
          status_message: message || '',
          status_updated_at: new Date().toISOString(),
          status_updated_by: user_id,
          is_open: ['open', 'busy'].includes(status),
          updated_at: new Date().toISOString()
        })
        .eq('id', cafeteria_id)
        .select()

      if (updateError) {
        console.error('Direct update error:', updateError)
        throw new Error(`Direct update error: ${updateError.message}`)
      }

      updateResult = {
        success: true,
        old_status: 'unknown',
        new_status: status,
        message: 'Status updated successfully (direct update)'
      }

      console.log(`Successfully updated cafeteria status via direct update`)
    }

    return NextResponse.json({
      success: true,
      message: 'Cafeteria status updated successfully',
      data: {
        cafeteria_id,
        old_status: updateResult.old_status,
        new_status: updateResult.new_status,
        status_message: message || '',
        updated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error updating cafeteria status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update cafeteria status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get cafeteria status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cafeteriaId = searchParams.get('cafeteria_id')

    if (!cafeteriaId) {
      return NextResponse.json(
        { error: 'Missing cafeteria_id parameter' },
        { status: 400 }
      )
    }

    // Get current cafeteria status
    const { data: cafeteria, error } = await supabase
      .from('cafeterias')
      .select(`
        id,
        name,
        operational_status,
        status_message,
        status_updated_at,
        is_open,
        is_active
      `)
      .eq('id', cafeteriaId)
      .single()

    if (error) {
      console.error('Error fetching cafeteria status:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    if (!cafeteria) {
      return NextResponse.json(
        { error: 'Cafeteria not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: cafeteria
    })

  } catch (error) {
    console.error('Error fetching cafeteria status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch cafeteria status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get all cafeterias with their status (for mobile app)
export async function PUT(request: NextRequest) {
  try {
    // Get all cafeterias with their current status
    const { data: cafeterias, error } = await supabase
      .from('cafeterias')
      .select(`
        id,
        name,
        operational_status,
        status_message,
        status_updated_at,
        is_open,
        is_active,
        description,
        image_url,
        location,
        rating
      `)
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching cafeterias:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    // Add status display information
    const cafeteriasWithStatus = cafeterias.map(cafeteria => ({
      ...cafeteria,
      status_display: getStatusDisplay(cafeteria.operational_status),
      is_available: cafeteria.operational_status === 'open',
      is_busy: cafeteria.operational_status === 'busy',
      is_closed: ['closed', 'temporarily_closed'].includes(cafeteria.operational_status)
    }))

    return NextResponse.json({
      success: true,
      data: cafeteriasWithStatus,
      count: cafeteriasWithStatus.length
    })

  } catch (error) {
    console.error('Error fetching cafeterias:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch cafeterias',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to get status display information
function getStatusDisplay(status: string) {
  switch (status) {
    case 'open':
      return {
        label: 'Open',
        color: 'green',
        icon: '🟢',
        description: 'Accepting orders'
      }
    case 'busy':
      return {
        label: 'Busy',
        color: 'orange',
        icon: '🟡',
        description: 'High demand - longer wait times'
      }
    case 'closed':
      return {
        label: 'Closed',
        color: 'red',
        icon: '🔴',
        description: 'Not accepting orders'
      }
    case 'temporarily_closed':
      return {
        label: 'Temporarily Closed',
        color: 'red',
        icon: '⏸️',
        description: 'Temporarily not accepting orders'
      }
    default:
      return {
        label: 'Unknown',
        color: 'gray',
        icon: '⚪',
        description: 'Status unknown'
      }
  }
}
