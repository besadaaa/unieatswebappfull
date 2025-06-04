import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    const supabaseAdmin = createSupabaseAdmin()

    if (action === 'cleanup_duplicate_cafeterias') {
      console.log('Starting cafeteria duplicate cleanup...')

      // Get all cafeterias grouped by name and owner_id
      const { data: cafeterias, error: fetchError } = await supabaseAdmin
        .from('cafeterias')
        .select('id, name, owner_id, created_at')
        .order('created_at', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      // Group by name + owner_id to find duplicates
      const groupedCafeterias = new Map<string, any[]>()
      
      cafeterias?.forEach(cafeteria => {
        const key = `${cafeteria.name}_${cafeteria.owner_id}`
        if (!groupedCafeterias.has(key)) {
          groupedCafeterias.set(key, [])
        }
        groupedCafeterias.get(key)!.push(cafeteria)
      })

      let duplicatesRemoved = 0
      const duplicateGroups: any[] = []

      // Process each group
      for (const [key, group] of groupedCafeterias) {
        if (group.length > 1) {
          // Keep the first (oldest) one, remove the rest
          const [keepCafeteria, ...duplicates] = group
          duplicateGroups.push({
            name: keepCafeteria.name,
            owner_id: keepCafeteria.owner_id,
            kept: keepCafeteria.id,
            removed: duplicates.map(d => d.id)
          })

          // Remove duplicates
          for (const duplicate of duplicates) {
            console.log(`Removing duplicate cafeteria: ${duplicate.name} (${duplicate.id})`)
            
            const { error: deleteError } = await supabaseAdmin
              .from('cafeterias')
              .delete()
              .eq('id', duplicate.id)

            if (deleteError) {
              console.error(`Error deleting cafeteria ${duplicate.id}:`, deleteError)
            } else {
              duplicatesRemoved++
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Cleanup completed. Removed ${duplicatesRemoved} duplicate cafeterias.`,
        duplicatesRemoved,
        duplicateGroups
      })
    }

    if (action === 'cleanup_duplicate_applications') {
      console.log('Starting application duplicate cleanup...')

      // Get all applications grouped by email and business_name
      const { data: applications, error: fetchError } = await supabaseAdmin
        .from('cafeteria_applications')
        .select('id, contact_email, business_name, status, submitted_at')
        .order('submitted_at', { ascending: true })

      if (fetchError) {
        throw fetchError
      }

      // Group by email + business_name to find duplicates
      const groupedApplications = new Map<string, any[]>()
      
      applications?.forEach(application => {
        const key = `${application.contact_email}_${application.business_name}`
        if (!groupedApplications.has(key)) {
          groupedApplications.set(key, [])
        }
        groupedApplications.get(key)!.push(application)
      })

      let duplicatesRemoved = 0
      const duplicateGroups: any[] = []

      // Process each group
      for (const [key, group] of groupedApplications) {
        if (group.length > 1) {
          // Keep the first (oldest) one, remove the rest
          const [keepApplication, ...duplicates] = group
          duplicateGroups.push({
            email: keepApplication.contact_email,
            business_name: keepApplication.business_name,
            kept: keepApplication.id,
            removed: duplicates.map(d => d.id)
          })

          // Remove duplicates
          for (const duplicate of duplicates) {
            console.log(`Removing duplicate application: ${duplicate.business_name} (${duplicate.id})`)
            
            const { error: deleteError } = await supabaseAdmin
              .from('cafeteria_applications')
              .delete()
              .eq('id', duplicate.id)

            if (deleteError) {
              console.error(`Error deleting application ${duplicate.id}:`, deleteError)
            } else {
              duplicatesRemoved++
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Cleanup completed. Removed ${duplicatesRemoved} duplicate applications.`,
        duplicatesRemoved,
        duplicateGroups
      })
    }

    if (action === 'add_unique_constraints') {
      console.log('Adding unique constraints to prevent future duplicates...')

      try {
        // Add unique constraint to cafeterias table (name + owner_id)
        await supabaseAdmin.rpc('execute_sql', {
          sql: `
            ALTER TABLE cafeterias 
            ADD CONSTRAINT unique_cafeteria_per_owner 
            UNIQUE (name, owner_id);
          `
        })

        // Add unique constraint to cafeteria_applications table (contact_email + business_name)
        await supabaseAdmin.rpc('execute_sql', {
          sql: `
            ALTER TABLE cafeteria_applications 
            ADD CONSTRAINT unique_application_per_email 
            UNIQUE (contact_email, business_name);
          `
        })

        return NextResponse.json({
          success: true,
          message: 'Unique constraints added successfully to prevent future duplicates.'
        })

      } catch (error: any) {
        // Constraints might already exist
        if (error.message?.includes('already exists')) {
          return NextResponse.json({
            success: true,
            message: 'Unique constraints already exist.'
          })
        }
        throw error
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: cleanup_duplicate_cafeterias, cleanup_duplicate_applications, or add_unique_constraints'
    }, { status: 400 })

  } catch (error: any) {
    console.error('Error in cleanup API:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Duplicate Cleanup API',
    actions: [
      'POST with action: "cleanup_duplicate_cafeterias" - Remove duplicate cafeterias',
      'POST with action: "cleanup_duplicate_applications" - Remove duplicate applications', 
      'POST with action: "add_unique_constraints" - Add database constraints to prevent duplicates'
    ]
  })
}
