import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    const supabaseAdmin = createSupabaseAdmin()

    if (action === 'fix_menu_items_mobile_format') {
      console.log('Fixing menu items for mobile app compatibility...')

      // Get all menu items
      const { data: menuItems, error: fetchError } = await supabaseAdmin
        .from('menu_items')
        .select('*')

      if (fetchError) {
        console.error('Error fetching menu items:', fetchError)
        return NextResponse.json({
          success: false,
          error: fetchError.message
        }, { status: 500 })
      }

      let updatedCount = 0
      let errorCount = 0

      // Process each menu item
      for (const item of menuItems || []) {
        try {
          // Prepare mobile-compatible data
          const updates: any = {}

          // Ensure ingredients is always an array
          if (!item.ingredients || !Array.isArray(item.ingredients)) {
            updates.ingredients = ['Fresh ingredients', 'Quality sourced']
          }

          // Ensure nutrition_info is always a proper object with numbers
          if (!item.nutrition_info || typeof item.nutrition_info !== 'object') {
            updates.nutrition_info = {
              calories: 350,
              protein: 15,
              carbs: 45,
              fat: 12,
              fiber: 5,
              sugar: 8
            }
          } else {
            // Fix existing nutrition_info to ensure all values are numbers
            const nutrition = { ...item.nutrition_info }
            
            // Convert string numbers to actual numbers
            Object.keys(nutrition).forEach(key => {
              if (typeof nutrition[key] === 'string' && !isNaN(Number(nutrition[key]))) {
                nutrition[key] = Number(nutrition[key])
              }
            })

            // Ensure all required fields exist
            const requiredFields = {
              calories: 350,
              protein: 15,
              carbs: 45,
              fat: 12,
              fiber: 5,
              sugar: 8
            }

            Object.entries(requiredFields).forEach(([key, defaultValue]) => {
              if (nutrition[key] === undefined || nutrition[key] === null) {
                nutrition[key] = defaultValue
              }
            })

            updates.nutrition_info = nutrition
          }

          // Ensure customization_options is always an array
          if (!item.customization_options || !Array.isArray(item.customization_options)) {
            updates.customization_options = []
          }

          // Ensure allergens is always an array
          if (!item.allergens || !Array.isArray(item.allergens)) {
            updates.allergens = []
          }

          // Ensure preparation_time is always a number
          if (!item.preparation_time || typeof item.preparation_time !== 'number') {
            updates.preparation_time = 15
          }

          // Ensure price is a proper decimal
          if (typeof item.price === 'string') {
            updates.price = parseFloat(item.price)
          }

          // Ensure rating is a proper number
          if (!item.rating || typeof item.rating !== 'number') {
            updates.rating = 0
          }

          // Ensure total_ratings is a proper number
          if (!item.total_ratings || typeof item.total_ratings !== 'number') {
            updates.total_ratings = 0
          }

          // Only update if there are changes
          if (Object.keys(updates).length > 0) {
            console.log(`Updating menu item: ${item.name}`, updates)

            const { error: updateError } = await supabaseAdmin
              .from('menu_items')
              .update(updates)
              .eq('id', item.id)

            if (updateError) {
              console.error(`Error updating menu item ${item.id}:`, updateError)
              errorCount++
            } else {
              updatedCount++
            }
          }

        } catch (error) {
          console.error(`Error processing menu item ${item.id}:`, error)
          errorCount++
        }
      }

      return NextResponse.json({
        success: true,
        message: `Mobile compatibility fix completed. Updated ${updatedCount} menu items.`,
        details: {
          totalItems: menuItems?.length || 0,
          updatedCount,
          errorCount
        }
      })
    }

    if (action === 'validate_mobile_format') {
      console.log('Validating menu items mobile format...')

      // Get all menu items and check their format
      const { data: menuItems, error: fetchError } = await supabaseAdmin
        .from('menu_items')
        .select('*')

      if (fetchError) {
        console.error('Error fetching menu items:', fetchError)
        return NextResponse.json({
          success: false,
          error: fetchError.message
        }, { status: 500 })
      }

      const validationResults = menuItems?.map(item => {
        const issues = []

        // Check ingredients
        if (!item.ingredients || !Array.isArray(item.ingredients)) {
          issues.push('ingredients: not an array')
        }

        // Check nutrition_info
        if (!item.nutrition_info || typeof item.nutrition_info !== 'object') {
          issues.push('nutrition_info: not an object')
        } else {
          const nutrition = item.nutrition_info
          const requiredFields = ['calories', 'protein', 'carbs', 'fat']
          
          requiredFields.forEach(field => {
            if (nutrition[field] === undefined || nutrition[field] === null) {
              issues.push(`nutrition_info.${field}: missing`)
            } else if (typeof nutrition[field] === 'string' && !isNaN(Number(nutrition[field]))) {
              issues.push(`nutrition_info.${field}: string instead of number`)
            }
          })
        }

        // Check customization_options
        if (!item.customization_options || !Array.isArray(item.customization_options)) {
          issues.push('customization_options: not an array')
        }

        // Check allergens
        if (!item.allergens || !Array.isArray(item.allergens)) {
          issues.push('allergens: not an array')
        }

        // Check preparation_time
        if (!item.preparation_time || typeof item.preparation_time !== 'number') {
          issues.push('preparation_time: not a number')
        }

        return {
          id: item.id,
          name: item.name,
          issues: issues,
          isValid: issues.length === 0
        }
      }) || []

      const validItems = validationResults.filter(item => item.isValid)
      const invalidItems = validationResults.filter(item => !item.isValid)

      return NextResponse.json({
        success: true,
        summary: {
          totalItems: validationResults.length,
          validItems: validItems.length,
          invalidItems: invalidItems.length
        },
        invalidItems: invalidItems.map(item => ({
          name: item.name,
          issues: item.issues
        }))
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: fix_menu_items_mobile_format or validate_mobile_format'
    }, { status: 400 })

  } catch (error: any) {
    console.error('Error in mobile compatibility API:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Mobile Compatibility Fix API',
    actions: [
      'POST with action: "fix_menu_items_mobile_format" - Fix all menu items for mobile app compatibility',
      'POST with action: "validate_mobile_format" - Validate menu items format for mobile app'
    ],
    mobileRequirements: {
      ingredients: 'Array of strings',
      nutrition_info: 'Object with numeric values for calories, protein, carbs, fat',
      customization_options: 'Array of objects',
      allergens: 'Array of strings',
      preparation_time: 'Number (minutes)',
      price: 'Number (decimal)',
      rating: 'Number (0-5)',
      total_ratings: 'Number (count)'
    }
  })
}
