import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const cafeteriaId = searchParams.get('cafeteriaId')

    if (!cafeteriaId) {
      return NextResponse.json({ error: 'Cafeteria ID is required' }, { status: 400 })
    }

    // Get menu items for the cafeteria
    const { data: menuItems, error } = await supabaseAdmin
      .from('menu_items')
      .select('id, name, price, category, is_available')
      .eq('cafeteria_id', cafeteriaId)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching menu items:', error)
      return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      items: menuItems || [],
      count: menuItems?.length || 0,
      cafeteriaId
    })

  } catch (error) {
    console.error('Error in menu items API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
