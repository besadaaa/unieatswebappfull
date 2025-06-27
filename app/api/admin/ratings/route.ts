import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching ratings data for admin portal...')

    // Create Supabase admin client
    const supabaseAdmin = createSupabaseAdmin()

    if (!supabaseAdmin) {
      console.error('Failed to create Supabase admin client')
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Fetch all cafeterias
    const { data: cafeterias, error: cafeteriasError } = await supabaseAdmin
      .from('cafeterias')
      .select('id, name, location, description')

    if (cafeteriasError) {
      console.error('Error fetching cafeterias:', cafeteriasError)
      return NextResponse.json({ error: 'Failed to fetch cafeterias' }, { status: 500 })
    }

    console.log('🏢 Fetched cafeterias:', cafeterias?.length)

    // Fetch cafeteria user ratings from cafeteria_user_ratings table (pluralized)
    const { data: cafeteriaUserRatings, error: cafeteriaRatingsError } = await supabaseAdmin
      .from('cafeteria_user_ratings')
      .select(`
        id,
        cafeteria_id,
        user_id,
        rating,
        comment,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (cafeteriaRatingsError) {
      console.error('Error fetching cafeteria user ratings:', cafeteriaRatingsError)
      // Continue with empty ratings if table doesn't exist or has issues
    }

    console.log('⭐ Fetched cafeteria user ratings:', cafeteriaUserRatings?.length || 0)

    // Fetch menu items
    const { data: menuItems, error: menuItemsError } = await supabaseAdmin
      .from('menu_items')
      .select(`
        id,
        name,
        description,
        price,
        category,
        cafeteria_id,
        cafeterias(name)
      `)

    if (menuItemsError) {
      console.error('Error fetching menu items:', menuItemsError)
      return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
    }

    console.log('🍽️ Fetched menu items:', menuItems?.length)

    // Fetch menu item ratings from menu_item_ratings table (pluralized)
    const { data: menuItemRatings, error: menuItemRatingsError } = await supabaseAdmin
      .from('menu_item_ratings')
      .select(`
        id,
        menu_item_id,
        user_id,
        rating,
        review_comment,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (menuItemRatingsError) {
      console.error('Error fetching menu item ratings:', menuItemRatingsError)
      // Continue with empty ratings if table doesn't exist or has issues
    }

    console.log('🌟 Fetched menu item ratings:', menuItemRatings?.length || 0)

    // Fetch user profiles for ratings
    const allUserIds = [
      ...(cafeteriaUserRatings?.map(r => r.user_id) || []),
      ...(menuItemRatings?.map(r => r.user_id) || [])
    ].filter(Boolean)

    const uniqueUserIds = [...new Set(allUserIds)]
    let userProfiles: any[] = []

    if (uniqueUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .in('id', uniqueUserIds)

      if (profilesError) {
        console.error('Error fetching user profiles:', profilesError)
      } else {
        userProfiles = profiles || []
        console.log('👥 Fetched user profiles:', userProfiles.length)
      }
    }

    // Create a map for quick profile lookup
    const profilesMap = new Map(userProfiles.map(p => [p.id, p]))

    // Calculate cafeteria ratings aggregates
    const cafeteriaRatingsMap = new Map()
    
    cafeterias?.forEach(cafeteria => {
      const userRatings = cafeteriaUserRatings?.filter(r => r.cafeteria_id === cafeteria.id) || []
      
      const totalRatings = userRatings.length
      const averageRating = totalRatings > 0 
        ? userRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0

      // Get recent reviews (last 5) - include both cafeteria and menu item reviews
      const cafeteriaReviews = userRatings
        .slice(0, 3)
        .map(rating => {
          const userProfile = profilesMap.get(rating.user_id)
          return {
            id: rating.id,
            user: userProfile?.full_name || 'Anonymous',
            rating: rating.rating,
            comment: rating.comment || '',
            date: new Date(rating.created_at).toLocaleDateString(),
            type: 'cafeteria',
            menuItem: null
          }
        })

      // Get menu item reviews for this cafeteria
      const cafeteriaMenuItems = menuItems?.filter(item => item.cafeteria_id === cafeteria.id) || []
      const cafeteriaMenuItemIds = cafeteriaMenuItems.map(item => item.id)
      const menuItemReviewsForCafeteria = menuItemRatings?.filter(rating =>
        cafeteriaMenuItemIds.includes(rating.menu_item_id)
      ) || []

      const menuItemReviews = menuItemReviewsForCafeteria
        .slice(0, 2)
        .map(rating => {
          const userProfile = profilesMap.get(rating.user_id)
          const menuItem = cafeteriaMenuItems.find(item => item.id === rating.menu_item_id)
          return {
            id: `menu-${rating.id}`,
            user: userProfile?.full_name || 'Anonymous',
            rating: rating.rating,
            comment: rating.review_comment || '',
            date: new Date(rating.created_at).toLocaleDateString(),
            type: 'menu_item',
            menuItem: menuItem?.name || 'Unknown Item'
          }
        })

      // Combine and sort all reviews by date
      const recentReviews = [...cafeteriaReviews, ...menuItemReviews]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)

      cafeteriaRatingsMap.set(cafeteria.id, {
        id: cafeteria.id,
        name: cafeteria.name,
        location: cafeteria.location || 'Unknown Location',
        description: cafeteria.description || '',
        overallRating: Number(averageRating.toFixed(1)),
        totalRatings,
        recentReviews,
        // For now, use overall rating for all categories (can be enhanced later)
        foodQuality: Number(averageRating.toFixed(1)),
        service: Number(averageRating.toFixed(1)),
        cleanliness: Number(averageRating.toFixed(1)),
        valueForMoney: Number(averageRating.toFixed(1))
      })
    })

    // Calculate menu item ratings aggregates
    const menuItemRatingsMap = new Map()
    
    menuItems?.forEach(item => {
      const itemRatings = menuItemRatings?.filter(r => r.menu_item_id === item.id) || []
      
      const totalRatings = itemRatings.length
      const averageRating = totalRatings > 0 
        ? itemRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
        : 0

      if (totalRatings > 0) { // Only include items that have ratings
        menuItemRatingsMap.set(item.id, {
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: item.price,
          category: item.category || 'Other',
          cafeteria: item.cafeterias?.name || 'Unknown Cafeteria',
          cafeteriaId: item.cafeteria_id,
          rating: Number(averageRating.toFixed(1)),
          totalRatings
        })
      }
    })

    const response = {
      success: true,
      data: {
        cafeteriaRatings: Array.from(cafeteriaRatingsMap.values()),
        menuItemRatings: Array.from(menuItemRatingsMap.values()),
        rawData: {
          cafeterias: cafeterias?.length || 0,
          cafeteriaUserRatings: cafeteriaUserRatings?.length || 0,
          menuItems: menuItems?.length || 0,
          menuItemRatings: menuItemRatings?.length || 0
        }
      }
    }

    console.log('📊 Ratings summary:', {
      cafeteriaRatings: response.data.cafeteriaRatings.length,
      menuItemRatings: response.data.menuItemRatings.length,
      rawCafeteriaRatings: cafeteriaUserRatings?.length || 0,
      rawMenuItemRatings: menuItemRatings?.length || 0
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in ratings API:', error)
    return NextResponse.json({
      error: 'An unexpected error occurred: ' + (error as Error).message
    }, { status: 500 })
  }
}
