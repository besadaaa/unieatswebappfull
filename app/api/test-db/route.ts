import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('id, name, ingredients, allergens, nutrition_info, preparation_time')
      .limit(5)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: `Found ${data?.length || 0} menu items`
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Database connection failed' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // This is for testing only - in production, you'd want to restrict this
    const { data, error } = await supabase.rpc('exec_sql', { sql: query })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Query execution failed' 
    }, { status: 500 })
  }
}
