import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Debug: Checking cafeteria status and approval fields...')
    
    const supabaseAdmin = createSupabaseAdmin()
    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
    // Get all cafeterias with all relevant fields
    const { data: cafeterias, error: cafeteriaError } = await supabaseAdmin
      .from('cafeterias')
      .select('id, name, owner_id, is_active, approval_status, operational_status, created_at')
      .order('created_at', { ascending: false })

    if (cafeteriaError) {
      console.error('Error fetching cafeterias:', cafeteriaError)
      return NextResponse.json({ error: 'Failed to fetch cafeterias' }, { status: 500 })
    }

    // Get all cafeteria applications
    const { data: applications, error: applicationsError } = await supabaseAdmin
      .from('cafeteria_applications')
      .select('id, business_name, status, email, created_at, reviewed_at')
      .order('created_at', { ascending: false })

    if (applicationsError) {
      console.error('Error fetching applications:', applicationsError)
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    }

    // Count cafeterias by status
    const statusCounts = {
      total: cafeterias?.length || 0,
      active: cafeterias?.filter(c => c.is_active === true).length || 0,
      approved: cafeterias?.filter(c => c.approval_status === 'approved').length || 0,
      activeAndApproved: cafeterias?.filter(c => c.is_active === true && c.approval_status === 'approved').length || 0,
      operational: cafeterias?.filter(c => c.operational_status === 'open').length || 0
    }

    // Count applications by status
    const applicationCounts = {
      total: applications?.length || 0,
      pending: applications?.filter(a => a.status === 'pending').length || 0,
      approved: applications?.filter(a => a.status === 'approved').length || 0,
      rejected: applications?.filter(a => a.status === 'rejected').length || 0
    }

    console.log('✅ Debug results:', {
      cafeteriaStatusCounts: statusCounts,
      applicationStatusCounts: applicationCounts
    })

    return NextResponse.json({
      success: true,
      cafeterias: cafeterias || [],
      applications: applications || [],
      statusCounts,
      applicationCounts,
      summary: {
        message: `Found ${statusCounts.total} cafeterias total, ${statusCounts.activeAndApproved} active & approved`,
        dashboardWillShow: statusCounts.activeAndApproved,
        recentApprovals: applications?.filter(a => a.status === 'approved').slice(0, 5) || []
      }
    })

  } catch (error) {
    console.error('Error in cafeteria status debug:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
