# 🚀 Deployment Troubleshooting Guide

## 🔍 Common Issues When Functions Work Locally But Not in Production

### 1. 🔑 Environment Variables (Most Common Issue)

**Problem**: Environment variables not properly set in Vercel
**Solution**: 

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add ALL these variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://lqtnaxvqkoynaziiinqh.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxdG5heHZxa295bmF6aWlpbnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1ODUzMjcsImV4cCI6MjA2MzE2MTMyN30.MEMp-4fuLCMKaW-E_g56vsYFNKqzrftjhYfD_w1u0PA
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxdG5heHZxa295bmF6aWlpbnFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzU4NTMyNywiZXhwIjoyMDYzMTYxMzI3fQ.k-YSUdKGIJcsys8Dh5GeITXIhJiy-_CkYS223vqX55Q
   ```
3. **Set Environment**: Production, Preview, Development (all three)
4. **Redeploy** after adding variables

### 2. 🌐 API Routes Issues

**Problem**: API routes returning 404 or 500 errors
**Symptoms**: 
- `/api/*` routes not working
- Functions work locally but fail in production

**Solutions**:

#### A. Check API Route Structure
```typescript
// ✅ CORRECT: app/api/example/route.ts
export async function GET() {
  return Response.json({ message: "Hello" })
}

// ❌ WRONG: pages/api/example.js (old structure)
```

#### B. Fix Import Paths
```typescript
// ✅ CORRECT: Use absolute imports
import { createSupabaseAdmin } from '@/lib/supabase'

// ❌ WRONG: Relative imports that break in production
import { createSupabaseAdmin } from '../../../lib/supabase'
```

### 3. 🗄️ Database Connection Issues

**Problem**: Supabase connection fails in production
**Symptoms**:
- "supabaseUrl or supabaseKey required" errors
- Database queries timeout
- Authentication failures

**Solutions**:

#### A. Verify Supabase Configuration
```typescript
// Check if environment variables are loaded
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Has Service Key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
```

#### B. Add Error Handling
```typescript
// Add to all API routes
try {
  const supabase = createSupabaseAdmin()
  if (!supabase) {
    throw new Error('Failed to initialize Supabase client')
  }
  // ... rest of code
} catch (error) {
  console.error('Supabase error:', error)
  return Response.json({ error: 'Database connection failed' }, { status: 500 })
}
```

### 4. 🔒 CORS and Security Issues

**Problem**: Cross-origin requests blocked
**Solutions**:

#### A. Add CORS Headers to API Routes
```typescript
export async function GET() {
  const response = Response.json({ data: "example" })
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}
```

### 5. 📦 Build and Bundle Issues

**Problem**: Code that works in development breaks in production build
**Solutions**:

#### A. Test Production Build Locally
```bash
npm run build
npm start
```

#### B. Check for Dynamic Imports
```typescript
// ✅ CORRECT: Proper dynamic import
const { realtimeSync } = await import('@/lib/realtime-sync')

// ❌ WRONG: Import that might fail in production
import { realtimeSync } from '@/lib/realtime-sync'
```

### 6. 🔄 Caching Issues

**Problem**: Old cached versions causing issues
**Solutions**:

#### A. Clear Vercel Cache
1. Go to Vercel Dashboard
2. Deployments → Click on latest deployment
3. Click "Redeploy" → Check "Use existing Build Cache" = OFF

#### B. Add Cache Headers
```typescript
export async function GET() {
  const response = Response.json({ data: "example" })
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  return response
}
```

### 7. 🐛 Debugging Production Issues

#### A. Add Comprehensive Logging
```typescript
export async function POST(request: Request) {
  console.log('🚀 API Route called:', request.url)
  console.log('📝 Method:', request.method)
  console.log('🔑 Has Supabase URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  
  try {
    // Your code here
    console.log('✅ Success')
    return Response.json({ success: true })
  } catch (error) {
    console.error('❌ Error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

#### B. Check Vercel Function Logs
1. Go to Vercel Dashboard
2. Functions tab
3. Click on failing function
4. Check logs for errors

### 8. 🔧 Quick Fixes Checklist

- [ ] ✅ Environment variables added to Vercel
- [ ] ✅ All API routes use `app/api/*/route.ts` structure
- [ ] ✅ Absolute imports used (`@/lib/...`)
- [ ] ✅ Error handling added to all API routes
- [ ] ✅ CORS headers added if needed
- [ ] ✅ Production build tested locally
- [ ] ✅ Vercel cache cleared
- [ ] ✅ Function logs checked
- [ ] ✅ Database connection verified
- [ ] ✅ Authentication working

### 9. 🆘 Emergency Fixes

If nothing else works:

#### A. Rollback to Working Version
```bash
# In Vercel Dashboard
Deployments → Find last working deployment → Promote to Production
```

#### B. Minimal Test Deployment
Create a simple test API route:
```typescript
// app/api/test/route.ts
export async function GET() {
  return Response.json({ 
    message: "API working",
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  })
}
```

### 10. 📞 Getting Help

If issues persist:
1. **Check Vercel Status**: https://vercel-status.com/
2. **Supabase Status**: https://status.supabase.com/
3. **Share Error Logs**: Copy exact error messages from Vercel function logs
4. **Test Specific Routes**: Identify which specific functions are failing

---

## 🎯 Most Likely Solutions for Your Case:

1. **Environment Variables** - 90% chance this is the issue
2. **API Route Structure** - Check if using correct App Router structure
3. **Import Paths** - Ensure all imports use absolute paths
4. **Supabase Connection** - Verify service role key is set correctly

Try these in order and your deployment should work! 🚀
