import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const body = await request.json()
    const { userId, reason = 'Revoked by admin' } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log('Revoking cafeteria approvals for user:', userId)

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', userId)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (userProfile.role !== 'cafeteria_manager') {
      return NextResponse.json(
        { error: 'User is not a cafeteria manager' },
        { status: 400 }
      )
    }

    // Get all cafeterias owned by this user
    const { data: ownedCafeterias, error: cafeteriaError } = await supabaseAdmin
      .from('cafeterias')
      .select('id, name, approval_status')
      .eq('owner_id', userId)

    if (cafeteriaError) {
      console.error('Error fetching cafeterias:', cafeteriaError)
      return NextResponse.json(
        { error: 'Error fetching user cafeterias' },
        { status: 500 }
      )
    }

    if (!ownedCafeterias || ownedCafeterias.length === 0) {
      return NextResponse.json(
        { error: 'No cafeterias found for this user' },
        { status: 404 }
      )
    }

    const revokedCafeterias = []
    const errors = []

    // Step 1: Suspend user profile (DISABLE LOGIN)
    const { error: suspendError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_active: false, // DISABLE LOGIN
        is_suspended: true, // Mark as suspended
        status: 'suspended',
        suspension_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (suspendError) {
      console.error('Error suspending user:', suspendError)
      return NextResponse.json(
        { error: 'Failed to suspend user' },
        { status: 500 }
      )
    }

    console.log('✅ User suspended - cannot login')

    // Step 2: Revoke approval for all approved cafeterias
    for (const cafeteria of ownedCafeterias) {
      if (cafeteria.approval_status === 'approved') {
        const { error: revokeError } = await supabaseAdmin
          .from('cafeterias')
          .update({
            approval_status: 'rejected', // Use 'rejected' instead of 'revoked'
            is_active: false,
            is_open: false,
            revoked_at: new Date().toISOString(),
            revocation_reason: reason,
            updated_at: new Date().toISOString()
          })
          .eq('id', cafeteria.id)

        if (revokeError) {
          console.error(`Error revoking cafeteria ${cafeteria.id}:`, revokeError)
          errors.push(`Failed to revoke ${cafeteria.name}: ${revokeError.message}`)
        } else {
          revokedCafeterias.push(cafeteria)
          console.log(`Revoked cafeteria: ${cafeteria.name}`)
        }
      }
    }

    // Log the revocation action
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        action: 'cafeteria_approval_revoked',
        entity_type: 'user',
        entity_id: userId,
        details: {
          user_name: userProfile.full_name,
          revoked_cafeterias: revokedCafeterias.map(c => ({ id: c.id, name: c.name })),
          reason,
          revoked_at: new Date().toISOString(),
          revoked_count: revokedCafeterias.length
        }
      })

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Some cafeterias could not be revoked',
          revokedCafeterias,
          errors
        },
        { status: 207 } // Multi-status
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully revoked access for ${userProfile.full_name}. User cannot login and ${revokedCafeterias.length} cafeteria(s) deactivated.`,
      revokedCafeterias: revokedCafeterias.map(c => ({ id: c.id, name: c.name })),
      userSuspended: true,
      canLogin: false
    })

  } catch (error) {
    console.error('Error revoking cafeteria approvals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log('Restoring cafeteria approvals for user:', userId)

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', userId)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (userProfile.role !== 'cafeteria_manager') {
      return NextResponse.json(
        { error: 'User is not a cafeteria manager' },
        { status: 400 }
      )
    }

    // Get all revoked cafeterias owned by this user
    const { data: revokedCafeterias, error: cafeteriaError } = await supabaseAdmin
      .from('cafeterias')
      .select('id, name, approval_status')
      .eq('owner_id', userId)
      .eq('approval_status', 'rejected') // Look for 'rejected' status

    if (cafeteriaError) {
      console.error('Error fetching revoked cafeterias:', cafeteriaError)
      return NextResponse.json(
        { error: 'Error fetching user cafeterias' },
        { status: 500 }
      )
    }

    if (!revokedCafeterias || revokedCafeterias.length === 0) {
      return NextResponse.json(
        { error: 'No revoked cafeterias found for this user' },
        { status: 404 }
      )
    }

    const restoredCafeterias = []
    const errors = []

    // Step 1: Restore user profile (ENABLE LOGIN)
    const { error: restoreError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_active: true, // ENABLE LOGIN
        is_suspended: false, // Remove suspension
        status: 'active',
        suspension_reason: null, // Clear suspension reason
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (restoreError) {
      console.error('Error restoring user:', restoreError)
      return NextResponse.json(
        { error: 'Failed to restore user' },
        { status: 500 }
      )
    }

    console.log('✅ User restored - can login again')

    // Step 2: Restore approval for all revoked cafeterias
    for (const cafeteria of revokedCafeterias) {
      const { error: restoreError } = await supabaseAdmin
        .from('cafeterias')
        .update({
          approval_status: 'approved',
          is_active: true,
          is_open: true,
          revoked_at: null,
          revocation_reason: null,
          restored_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', cafeteria.id)

      if (restoreError) {
        console.error(`Error restoring cafeteria ${cafeteria.id}:`, restoreError)
        errors.push(`Failed to restore ${cafeteria.name}: ${restoreError.message}`)
      } else {
        restoredCafeterias.push(cafeteria)
        console.log(`Restored cafeteria: ${cafeteria.name}`)
      }
    }

    // Log the restoration action
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        action: 'cafeteria_approval_restored',
        entity_type: 'user',
        entity_id: userId,
        details: {
          user_name: userProfile.full_name,
          restored_cafeterias: restoredCafeterias.map(c => ({ id: c.id, name: c.name })),
          restored_at: new Date().toISOString(),
          restored_count: restoredCafeterias.length
        }
      })

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Some cafeterias could not be restored',
          restoredCafeterias,
          errors
        },
        { status: 207 } // Multi-status
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully restored access for ${userProfile.full_name}. User can login and ${restoredCafeterias.length} cafeteria(s) reactivated.`,
      restoredCafeterias: restoredCafeterias.map(c => ({ id: c.id, name: c.name })),
      userRestored: true,
      canLogin: true
    })

  } catch (error) {
    console.error('Error restoring cafeteria approvals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
