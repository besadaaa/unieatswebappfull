import { NextResponse } from 'next/server'

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      api: 'healthy',
      environment: 'unknown',
      database: 'unknown'
    }
  }

  // Check environment variables
  try {
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

    if (hasSupabaseUrl && hasAnonKey && hasServiceKey) {
      health.checks.environment = 'healthy'
    } else {
      health.checks.environment = 'unhealthy'
      health.status = 'unhealthy'
    }
  } catch (error) {
    health.checks.environment = 'error'
    health.status = 'unhealthy'
  }

  // Quick database check
  try {
    const { createSupabaseAdmin } = await import('@/lib/supabase')
    const supabase = createSupabaseAdmin()
    
    const { error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) {
      health.checks.database = 'unhealthy'
      health.status = 'unhealthy'
    } else {
      health.checks.database = 'healthy'
    }
  } catch (error) {
    health.checks.database = 'error'
    health.status = 'unhealthy'
  }

  const statusCode = health.status === 'healthy' ? 200 : 503

  return NextResponse.json(health, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}
