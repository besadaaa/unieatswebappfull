import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const testResults = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: {} as Record<string, any>
  }

  console.log('🧪 Running deployment tests...')

  // Test 1: Environment Variables
  console.log('🔑 Testing environment variables...')
  testResults.tests.environmentVariables = {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
    status: (
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) ? 'PASS' : 'FAIL'
  }

  // Test 2: Supabase Connection
  console.log('🗄️ Testing Supabase connection...')
  try {
    const supabaseAdmin = createSupabaseAdmin()
    
    if (!supabaseAdmin) {
      throw new Error('Failed to create Supabase client')
    }

    // Test basic connection
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1)

    testResults.tests.supabaseConnection = {
      clientCreated: true,
      connectionTest: error ? 'FAIL' : 'PASS',
      error: error?.message || null,
      status: error ? 'FAIL' : 'PASS'
    }
  } catch (error) {
    console.error('Supabase connection error:', error)
    testResults.tests.supabaseConnection = {
      clientCreated: false,
      connectionTest: 'FAIL',
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'FAIL'
    }
  }

  // Test 3: Database Tables Access
  console.log('📊 Testing database table access...')
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const tableTests = {}

    // Test key tables
    const tablesToTest = ['profiles', 'cafeterias', 'orders', 'menu_items', 'inventory_items']
    
    for (const table of tablesToTest) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1)

        tableTests[table] = {
          accessible: !error,
          error: error?.message || null,
          status: error ? 'FAIL' : 'PASS'
        }
      } catch (err) {
        tableTests[table] = {
          accessible: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          status: 'FAIL'
        }
      }
    }

    testResults.tests.databaseTables = {
      ...tableTests,
      status: Object.values(tableTests).every((test: any) => test.status === 'PASS') ? 'PASS' : 'FAIL'
    }
  } catch (error) {
    console.error('Database tables test error:', error)
    testResults.tests.databaseTables = {
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'FAIL'
    }
  }

  // Test 4: Settings Service
  console.log('⚙️ Testing settings service...')
  try {
    const SettingsService = (await import('@/lib/settings-service')).default
    const serviceFeeRate = await SettingsService.getServiceFeeRate()
    const commissionRate = await SettingsService.getCommissionRate()

    testResults.tests.settingsService = {
      serviceFeeRate,
      commissionRate,
      settingsLoaded: typeof serviceFeeRate === 'number' && typeof commissionRate === 'number',
      status: (typeof serviceFeeRate === 'number' && typeof commissionRate === 'number') ? 'PASS' : 'FAIL'
    }
  } catch (error) {
    console.error('Settings service error:', error)
    testResults.tests.settingsService = {
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'FAIL'
    }
  }

  // Test 5: Dynamic Categories
  console.log('📂 Testing dynamic categories...')
  try {
    const SettingsService = (await import('@/lib/settings-service')).default
    const menuCategories = await SettingsService.getMenuCategories()
    const inventoryCategories = await SettingsService.getInventoryCategories()

    testResults.tests.dynamicCategories = {
      menuCategories: Array.isArray(menuCategories) ? menuCategories.length : 0,
      inventoryCategories: Array.isArray(inventoryCategories) ? inventoryCategories.length : 0,
      status: (Array.isArray(menuCategories) && Array.isArray(inventoryCategories)) ? 'PASS' : 'FAIL'
    }
  } catch (error) {
    console.error('Dynamic categories error:', error)
    testResults.tests.dynamicCategories = {
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'FAIL'
    }
  }

  // Test 6: Fee Calculator
  console.log('💰 Testing fee calculator...')
  try {
    const DynamicFeeCalculator = (await import('@/lib/dynamic-fee-calculator')).default
    const fees = await DynamicFeeCalculator.calculateOrderFees(100)

    testResults.tests.feeCalculator = {
      calculationWorking: typeof fees.totalAmount === 'number',
      sampleCalculation: fees,
      status: typeof fees.totalAmount === 'number' ? 'PASS' : 'FAIL'
    }
  } catch (error) {
    console.error('Fee calculator error:', error)
    testResults.tests.feeCalculator = {
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'FAIL'
    }
  }

  // Overall Status
  const allTests = Object.values(testResults.tests)
  const passedTests = allTests.filter((test: any) => test.status === 'PASS').length
  const totalTests = allTests.length

  testResults.summary = {
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests,
    overallStatus: passedTests === totalTests ? 'ALL_PASS' : 'SOME_FAILED',
    successRate: `${Math.round((passedTests / totalTests) * 100)}%`
  }

  console.log('✅ Deployment tests completed')
  console.log(`📊 Results: ${passedTests}/${totalTests} tests passed`)

  return NextResponse.json(testResults, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}

export async function POST() {
  return NextResponse.json({ 
    message: "Use GET method to run deployment tests" 
  }, { status: 405 })
}
