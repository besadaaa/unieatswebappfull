import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, getCurrentUser } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'

    const supabaseAdmin = createSupabaseAdmin()

    // Get cafeteria ratings data
    const { data: ratings, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        rating,
        review_comment,
        created_at,
        cafeterias!orders_cafeteria_id_fkey(name, location),
        profiles!orders_user_id_fkey(full_name, email)
      `)
      .not('rating', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching ratings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch ratings data' },
        { status: 500 }
      )
    }

    if (!ratings || ratings.length === 0) {
      return NextResponse.json(
        { error: 'No ratings data found' },
        { status: 404 }
      )
    }

    // Format data for export
    const exportData = ratings.map(rating => ({
      'Order ID': rating.id,
      'Cafeteria Name': rating.cafeterias?.name || 'Unknown',
      'Cafeteria Location': rating.cafeterias?.location || 'Unknown',
      'Customer Name': rating.profiles?.full_name || 'Anonymous',
      'Customer Email': rating.profiles?.email || 'N/A',
      'Rating': rating.rating,
      'Review Comment': rating.review_comment || 'No comment',
      'Date': new Date(rating.created_at).toLocaleDateString(),
      'Time': new Date(rating.created_at).toLocaleTimeString()
    }))

    if (format === 'csv') {
      // Generate CSV
      const headers = Object.keys(exportData[0])
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value
          }).join(',')
        )
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="cafeteria_ratings_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else {
      // Return JSON for other formats
      return NextResponse.json({
        success: true,
        data: exportData,
        total: exportData.length,
        exported_at: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
