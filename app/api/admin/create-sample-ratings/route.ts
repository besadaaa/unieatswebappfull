import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    // Get all cafeterias
    const { data: cafeterias, error: cafeteriasError } = await supabaseAdmin
      .from('cafeterias')
      .select('id, name')

    if (cafeteriasError) {
      return NextResponse.json({ error: 'Failed to fetch cafeterias' }, { status: 500 })
    }

    // Get all menu items
    const { data: menuItems, error: menuItemsError } = await supabaseAdmin
      .from('menu_items')
      .select('id, name, cafeteria_id')

    if (menuItemsError) {
      return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
    }

    // Get all users (for sample ratings)
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .limit(10)

    if (usersError) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const sampleRatings = []
    const sampleMenuItemRatings = []

    // Create sample cafeteria ratings (using the actual table structure)
    cafeterias?.forEach(cafeteria => {
      // Create one aggregated rating per cafeteria
      const overallRating = Number((Math.random() * 1.5 + 3.5).toFixed(1)) // 3.5-5.0
      const totalRatings = Math.floor(Math.random() * 50) + 10 // 10-60 ratings

      sampleRatings.push({
        cafeteria_id: cafeteria.id,
        overall_rating: overallRating,
        total_ratings: totalRatings,
        food_quality: Number((overallRating + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        service: Number((overallRating + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        cleanliness: Number((overallRating + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        value_for_money: Number((overallRating + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        user_id: users?.[0]?.id || null,
        comment: [
          'Great food and service!',
          'Love the variety of options.',
          'Quick service and tasty meals.',
          'Clean environment and friendly staff.',
          'Excellent value for money.',
          'Fresh ingredients and good portions.',
          'Highly recommend this cafeteria!'
        ][Math.floor(Math.random() * 7)]
      })
    })

    // Create sample menu item ratings
    menuItems?.forEach(menuItem => {
      // Create 2-4 ratings per menu item
      const numRatings = Math.floor(Math.random() * 3) + 2
      for (let i = 0; i < numRatings; i++) {
        const user = users?.[Math.floor(Math.random() * users.length)]
        if (user) {
          sampleMenuItemRatings.push({
            user_id: user.id,
            menu_item_id: menuItem.id,
            order_id: null, // We'll set this to null for sample data
            rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
            review_comment: [
              'Delicious!',
              'Perfect portion size.',
              'Great taste and quality.',
              'Would order again.',
              'Fresh and flavorful.',
              'Excellent preparation.',
              'Highly recommended!',
              null, // Some ratings without comments
              null
            ][Math.floor(Math.random() * 9)]
          })
        }
      }
    })

    // Insert cafeteria ratings
    if (sampleRatings.length > 0) {
      const { error: ratingsInsertError } = await supabaseAdmin
        .from('cafeteria_ratings')
        .insert(sampleRatings)

      if (ratingsInsertError) {
        console.error('Error inserting cafeteria ratings:', ratingsInsertError)
      }
    }

    // Insert menu item ratings
    if (sampleMenuItemRatings.length > 0) {
      const { error: menuRatingsInsertError } = await supabaseAdmin
        .from('menu_item_ratings')
        .insert(sampleMenuItemRatings)

      if (menuRatingsInsertError) {
        console.error('Error inserting menu item ratings:', menuRatingsInsertError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sample ratings created successfully',
      data: {
        cafeteriaRatings: sampleRatings.length,
        menuItemRatings: sampleMenuItemRatings.length,
        cafeterias: cafeterias?.length || 0,
        menuItems: menuItems?.length || 0,
        users: users?.length || 0
      }
    })

  } catch (error) {
    console.error('Error creating sample ratings:', error)
    return NextResponse.json(
      { error: 'Failed to create sample ratings' },
      { status: 500 }
    )
  }
}
