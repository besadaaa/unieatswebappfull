import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userIds, data = {} } = body
    
    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Action and userIds are required' },
        { status: 400 }
      )
    }
    
    const supabase = createSupabaseAdmin()
    
    let results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }
    
    switch (action) {
      case 'suspend':
        return await handleSuspendUsers(supabase, userIds, results)
        
      case 'unsuspend':
        return await handleUnsuspendUsers(supabase, userIds, results)
        
      case 'delete':
        return await handleDeleteUsers(supabase, userIds, results)
        
      case 'update_role':
        return await handleUpdateRole(supabase, userIds, data.role, results)
        
      case 'send_notification':
        return await handleSendNotification(supabase, userIds, data, results)
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
    
  } catch (error) {
    console.error('Error in bulk actions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleSuspendUsers(supabase: any, userIds: string[], results: any) {
  try {
    console.log('Attempting to suspend users:', userIds)

    // Update user status by setting is_suspended to true
    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_suspended: true,
        updated_at: new Date().toISOString()
      })
      .in('id', userIds)
      .select('id, full_name')

    if (error) {
      console.error('Error suspending users:', error)
      return NextResponse.json({
        error: 'Failed to suspend users',
        details: error.message
      }, { status: 500 })
    }

    console.log('Successfully updated users:', data)
    results.success = data?.length || 0

    return NextResponse.json({
      success: true,
      message: `Successfully suspended ${results.success} users`,
      results
    })

  } catch (error) {
    console.error('Error in suspend users:', error)
    return NextResponse.json({
      error: 'Failed to suspend users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function handleUnsuspendUsers(supabase: any, userIds: string[], results: any) {
  try {
    console.log('Attempting to unsuspend users:', userIds)

    // Reactivate user by setting is_suspended to false
    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_suspended: false,
        updated_at: new Date().toISOString()
      })
      .in('id', userIds)
      .select('id, full_name')

    if (error) {
      console.error('Error unsuspending users:', error)
      return NextResponse.json({
        error: 'Failed to unsuspend users',
        details: error.message
      }, { status: 500 })
    }

    console.log('Successfully updated users:', data)
    results.success = data?.length || 0

    return NextResponse.json({
      success: true,
      message: `Successfully unsuspended ${results.success} users`,
      results
    })

  } catch (error) {
    console.error('Error in unsuspend users:', error)
    return NextResponse.json({
      error: 'Failed to unsuspend users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function handleDeleteUsers(supabase: any, userIds: string[], results: any) {
  try {
    // First get user details for logging
    const { data: usersToDelete } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('id', userIds)
    
    // Delete users (this will cascade to related tables due to foreign key constraints)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .in('id', userIds)
    
    if (error) {
      console.error('Error deleting users:', error)
      return NextResponse.json({ error: 'Failed to delete users' }, { status: 500 })
    }
    
    results.success = usersToDelete?.length || 0
    
    // Log audit trail for each deleted user
    for (const user of usersToDelete || []) {
      await supabase
        .from('audit_logs')
        .insert({
          action: 'user_deleted',
          entity_type: 'user',
          entity_id: user.id,
          details: {
            user_name: user.full_name,
            user_email: user.email,
            user_role: user.role,
            deleted_at: new Date().toISOString()
          }
        })
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${results.success} users`,
      results
    })
    
  } catch (error) {
    console.error('Error in delete users:', error)
    return NextResponse.json({ error: 'Failed to delete users' }, { status: 500 })
  }
}

async function handleUpdateRole(supabase: any, userIds: string[], newRole: string, results: any) {
  try {
    if (!newRole) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 })
    }
    
    // Update user roles
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .in('id', userIds)
      .select('id, full_name, email')
    
    if (error) {
      console.error('Error updating user roles:', error)
      return NextResponse.json({ error: 'Failed to update user roles' }, { status: 500 })
    }
    
    results.success = data?.length || 0
    
    // Log audit trail for each user
    for (const user of data || []) {
      await supabase
        .from('audit_logs')
        .insert({
          action: 'user_role_updated',
          entity_type: 'user',
          entity_id: user.id,
          details: {
            user_name: user.full_name,
            user_email: user.email,
            new_role: newRole,
            updated_at: new Date().toISOString()
          }
        })
      
      // Send notification about role change
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Role Updated',
          message: `Your role has been updated to ${newRole}.`,
          type: 'account_update',
          is_read: false,
          created_at: new Date().toISOString()
        })
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully updated role for ${results.success} users`,
      results
    })
    
  } catch (error) {
    console.error('Error in update role:', error)
    return NextResponse.json({ error: 'Failed to update user roles' }, { status: 500 })
  }
}

async function handleSendNotification(supabase: any, userIds: string[], data: any, results: any) {
  try {
    const { title, message, type = 'admin_message' } = data
    
    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
    }
    
    // Send notifications to all selected users
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString()
    }))
    
    const { data: insertedNotifications, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select()
    
    if (error) {
      console.error('Error sending notifications:', error)
      return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })
    }
    
    results.success = insertedNotifications?.length || 0
    
    // Log audit trail
    await supabase
      .from('audit_logs')
      .insert({
        action: 'bulk_notification_sent',
        entity_type: 'notification',
        details: {
          title,
          message,
          type,
          recipient_count: results.success,
          sent_at: new Date().toISOString()
        }
      })
    
    return NextResponse.json({
      success: true,
      message: `Successfully sent notifications to ${results.success} users`,
      results
    })
    
  } catch (error) {
    console.error('Error in send notification:', error)
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })
  }
}
