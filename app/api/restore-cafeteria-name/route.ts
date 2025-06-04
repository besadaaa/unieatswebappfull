import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔧 Restoring cafeteria name to "EUI Cafeteria"...')
    
    const supabaseAdmin = createSupabaseAdmin()
    
    // Update only the cafeteria name and location
    const { data: updatedCafeteria, error: updateError } = await supabaseAdmin
      .from('cafeterias')
      .update({
        name: 'EUI Cafeteria',
        location: 'EUI Main Campus, Ground Floor',
        description: 'The official cafeteria of the European University Institute, offering a diverse menu of international cuisine and local specialties.'
      })
      .eq('id', 'c6000000-0000-0000-0000-000000000006')
      .select()

    if (updateError) {
      console.error('Error updating cafeteria:', updateError)
      return NextResponse.json({ error: 'Failed to update cafeteria' }, { status: 500 })
    }

    console.log('✅ Cafeteria name restored successfully:', updatedCafeteria)

    return NextResponse.json({
      success: true,
      message: 'Cafeteria name restored to "EUI Cafeteria"',
      data: updatedCafeteria
    })

  } catch (error) {
    console.error('Restore cafeteria name API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
