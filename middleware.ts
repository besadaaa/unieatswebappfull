import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function middleware(request: NextRequest) {
  // Skip middleware for public routes and static files
  const publicRoutes = ['/', '/about', '/contact', '/signup']
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname)
  const isStaticFile = request.nextUrl.pathname.startsWith('/_next') ||
                      request.nextUrl.pathname.startsWith('/api') ||
                      request.nextUrl.pathname.includes('.')

  if (isPublicRoute || isStaticFile) {
    return NextResponse.next()
  }

  try {
    // Get the session token from cookies
    const token = request.cookies.get('sb-access-token')?.value ||
                  request.cookies.get('supabase-auth-token')?.value

    if (!token) {
      // No token, allow through (will be handled by client-side auth)
      return NextResponse.next()
    }

    // Create Supabase client for server-side
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get user from token
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.next()
    }

    // Check user profile and suspension status
    const { data: profile } = await supabase
      .from('profiles')
      .select('status, role')
      .eq('id', user.id)
      .single()

    if (profile?.status === 'suspended') {
      // Redirect suspended users to a suspension page
      const suspensionUrl = new URL('/suspended', request.url)
      return NextResponse.redirect(suspensionUrl)
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|suspended).*)"],
}
