import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with proper error handling
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase configuration error' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { report_type, date_range, user_id } = body

    // Validate required fields
    if (!report_type || !date_range || !user_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { report_type, date_range, status: 'generated' }
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
