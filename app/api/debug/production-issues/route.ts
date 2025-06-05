import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    issues: {} as Record<string, any>
  }

  console.log('🔍 Debugging production issues...')

  // Test 1: Environment Variables
  console.log('🔑 Testing environment variables...')
  results.issues.environmentVariables = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
    status: (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) ? 'OK' : 'FAIL'
  }

  // Test 2: Supabase Connection
  console.log('🗄️ Testing Supabase connection...')
  try {
    const supabase = createSupabaseAdmin()
    
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    results.issues.supabaseConnection = {
      connected: !connectionError,
      error: connectionError?.message || null,
      status: connectionError ? 'FAIL' : 'OK'
    }
  } catch (error) {
    results.issues.supabaseConnection = {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'FAIL'
    }
  }

  // Test 3: User Management APIs
  console.log('👥 Testing user management...')
  try {
    const supabase = createSupabaseAdmin()

    // Test reading users from auth.users (since email is stored there)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

    // Also test profiles table (without email since it's in auth.users)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .limit(5)

    const authUsers = authData?.users || []
    const combinedError = authError || profilesError

    results.issues.userManagement = {
      canReadUsers: !combinedError,
      authUserCount: authUsers.length,
      profileCount: profiles?.length || 0,
      sampleAuthUser: authUsers[0] ? {
        id: authUsers[0].id,
        email: authUsers[0].email,
        created_at: authUsers[0].created_at
      } : null,
      sampleProfile: profiles?.[0] || null,
      error: combinedError?.message || null,
      status: combinedError ? 'FAIL' : 'OK'
    }
  } catch (error) {
    results.issues.userManagement = {
      canReadUsers: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'FAIL'
    }
  }

  // Test 4: Cafeteria Approvals
  console.log('✅ Testing cafeteria approvals...')
  try {
    const supabase = createSupabaseAdmin()

    // Test reading cafeterias (without status column first)
    const { data: cafeterias, error: cafeteriasError } = await supabase
      .from('cafeterias')
      .select('id, name, owner_id')
      .limit(5)

    // Try to read status column separately to check if it exists
    let statusColumnExists = false
    let pendingCount = 0

    if (!cafeteriasError && cafeterias) {
      const { data: statusTest, error: statusError } = await supabase
        .from('cafeterias')
        .select('status')
        .limit(1)

      statusColumnExists = !statusError

      if (statusColumnExists) {
        const { data: statusData } = await supabase
          .from('cafeterias')
          .select('status')
        pendingCount = statusData?.filter(c => c.status === 'pending').length || 0
      }
    }

    results.issues.cafeteriaApprovals = {
      canReadCafeterias: !cafeteriasError,
      cafeteriaCount: cafeterias?.length || 0,
      statusColumnExists,
      pendingCount,
      sampleCafeteria: cafeterias?.[0] || null,
      error: cafeteriasError?.message || null,
      status: cafeteriasError ? 'FAIL' : 'OK'
    }
  } catch (error) {
    results.issues.cafeteriaApprovals = {
      canReadCafeterias: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'FAIL'
    }
  }

  // Test 5: Analytics Data
  console.log('📊 Testing analytics data...')
  try {
    const supabase = createSupabaseAdmin()
    
    // Test reading orders for analytics
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_amount, status, created_at')
      .limit(10)

    results.issues.analyticsData = {
      canReadOrders: !ordersError,
      orderCount: orders?.length || 0,
      totalRevenue: orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
      error: ordersError?.message || null,
      status: ordersError ? 'FAIL' : 'OK'
    }
  } catch (error) {
    results.issues.analyticsData = {
      canReadOrders: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'FAIL'
    }
  }

  // Test 6: Menu Items
  console.log('🍽️ Testing menu items...')
  try {
    const supabase = createSupabaseAdmin()
    
    // Test reading menu items
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, name, price, category, cafeteria_id')
      .limit(10)

    results.issues.menuItems = {
      canReadMenuItems: !menuError,
      menuItemCount: menuItems?.length || 0,
      sampleItem: menuItems?.[0] || null,
      error: menuError?.message || null,
      status: menuError ? 'FAIL' : 'OK'
    }
  } catch (error) {
    results.issues.menuItems = {
      canReadMenuItems: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'FAIL'
    }
  }

  // Test 7: Settings Service
  console.log('⚙️ Testing settings service...')
  try {
    const SettingsService = (await import('@/lib/settings-service')).default
    const serviceFeeRate = await SettingsService.getServiceFeeRate()
    const menuCategories = await SettingsService.getMenuCategories()

    results.issues.settingsService = {
      serviceFeeRate,
      menuCategoriesCount: Array.isArray(menuCategories) ? menuCategories.length : 0,
      settingsWorking: typeof serviceFeeRate === 'number',
      status: typeof serviceFeeRate === 'number' ? 'OK' : 'FAIL'
    }
  } catch (error) {
    results.issues.settingsService = {
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'FAIL'
    }
  }

  // Overall Status
  const allIssues = Object.values(results.issues)
  const failedIssues = allIssues.filter((issue: any) => issue.status === 'FAIL')
  
  results.summary = {
    totalTests: allIssues.length,
    failedTests: failedIssues.length,
    passedTests: allIssues.length - failedIssues.length,
    overallStatus: failedIssues.length === 0 ? 'ALL_OK' : 'ISSUES_FOUND',
    criticalIssues: failedIssues.map((issue: any, index: number) => 
      Object.keys(results.issues)[allIssues.indexOf(issue)]
    )
  }

  console.log('✅ Production issues debug completed')
  console.log(`📊 Results: ${results.summary.passedTests}/${results.summary.totalTests} tests passed`)

  return NextResponse.json(results, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}
