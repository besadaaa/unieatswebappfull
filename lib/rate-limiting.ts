// API Rate Limiting System
import { NextRequest } from 'next/server'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: NextRequest) => string
  onLimitReached?: (req: NextRequest, identifier: string) => void
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

// In-memory store for rate limiting (in production, use Redis)
class MemoryStore {
  private store = new Map<string, { count: number; resetTime: number }>()

  get(key: string): { count: number; resetTime: number } | undefined {
    const data = this.store.get(key)
    if (data && Date.now() > data.resetTime) {
      this.store.delete(key)
      return undefined
    }
    return data
  }

  set(key: string, value: { count: number; resetTime: number }): void {
    this.store.set(key, value)
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now()
    const existing = this.get(key)
    
    if (existing) {
      existing.count++
      this.store.set(key, existing)
      return existing
    } else {
      const newData = { count: 1, resetTime: now + windowMs }
      this.store.set(key, newData)
      return newData
    }
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, data] of this.store.entries()) {
      if (now > data.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

const store = new MemoryStore()

// Cleanup expired entries every 5 minutes
setInterval(() => store.cleanup(), 5 * 60 * 1000)

// Default rate limit configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  
  // General API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
  
  // File upload endpoints
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
  },
  
  // Search endpoints
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 searches per minute
  },
  
  // Order creation
  orders: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 orders per minute
  },
  
  // Admin endpoints
  admin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 requests per minute for admins
  },
  
  // Public endpoints (menu viewing, etc.)
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 300, // 300 requests per minute
  }
}

// Main rate limiting function
export const rateLimit = (config: RateLimitConfig) => {
  return (req: NextRequest): RateLimitResult => {
    try {
      // Generate identifier for the request
      const identifier = config.keyGenerator ? config.keyGenerator(req) : getDefaultIdentifier(req)
      
      // Get current count and increment
      const data = store.increment(identifier, config.windowMs)
      
      // Check if limit exceeded
      const isLimited = data.count > config.maxRequests
      
      if (isLimited && config.onLimitReached) {
        config.onLimitReached(req, identifier)
      }
      
      return {
        success: !isLimited,
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - data.count),
        resetTime: data.resetTime,
        retryAfter: isLimited ? Math.ceil((data.resetTime - Date.now()) / 1000) : undefined
      }
    } catch (error) {
      console.error('Rate limiting error:', error)
      // On error, allow the request to proceed
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs
      }
    }
  }
}

// Create rate limiter for specific endpoint type
export const createRateLimiter = (type: keyof typeof RATE_LIMIT_CONFIGS, customConfig?: Partial<RateLimitConfig>) => {
  const baseConfig = RATE_LIMIT_CONFIGS[type]
  const config: RateLimitConfig = {
    ...baseConfig,
    ...customConfig,
    keyGenerator: customConfig?.keyGenerator || ((req) => getIdentifierForType(req, type))
  }
  
  return rateLimit(config)
}

// Get default identifier (IP address)
const getDefaultIdentifier = (req: NextRequest): string => {
  // Try to get real IP from headers (for proxied requests)
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  // Fallback to connection IP
  return req.ip || 'unknown'
}

// Get identifier based on endpoint type
const getIdentifierForType = (req: NextRequest, type: keyof typeof RATE_LIMIT_CONFIGS): string => {
  const baseIdentifier = getDefaultIdentifier(req)
  
  // For authenticated endpoints, try to include user ID
  if (['auth', 'orders', 'admin'].includes(type)) {
    const userId = getUserIdFromRequest(req)
    if (userId) {
      return `${type}:user:${userId}`
    }
  }
  
  return `${type}:ip:${baseIdentifier}`
}

// Extract user ID from request (from JWT token or session)
const getUserIdFromRequest = (req: NextRequest): string | null => {
  try {
    // Try to get from Authorization header
    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // In a real implementation, you would decode and verify the JWT
      // For now, we'll extract from a custom header or cookie
      const userId = req.headers.get('x-user-id')
      return userId
    }
    
    // Try to get from cookie
    const userCookie = req.cookies.get('user-id')
    if (userCookie) {
      return userCookie.value
    }
    
    return null
  } catch (error) {
    return null
  }
}

// Middleware wrapper for Next.js API routes
export const withRateLimit = (
  type: keyof typeof RATE_LIMIT_CONFIGS,
  customConfig?: Partial<RateLimitConfig>
) => {
  const rateLimiter = createRateLimiter(type, customConfig)
  
  return (handler: (req: NextRequest) => Promise<Response>) => {
    return async (req: NextRequest): Promise<Response> => {
      const result = rateLimiter(req)
      
      if (!result.success) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: `Too many requests. Try again in ${result.retryAfter} seconds.`,
            retryAfter: result.retryAfter
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
              'Retry-After': result.retryAfter?.toString() || '60'
            }
          }
        )
      }
      
      // Add rate limit headers to successful responses
      const response = await handler(req)
      
      // Clone response to add headers
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      })
      
      newResponse.headers.set('X-RateLimit-Limit', result.limit.toString())
      newResponse.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      newResponse.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString())
      
      return newResponse
    }
  }
}

// Advanced rate limiting with different tiers
export const createTieredRateLimiter = (
  tiers: Record<string, RateLimitConfig>,
  tierSelector: (req: NextRequest) => string
) => {
  const limiters = Object.fromEntries(
    Object.entries(tiers).map(([tier, config]) => [tier, rateLimit(config)])
  )
  
  return (req: NextRequest): RateLimitResult => {
    const tier = tierSelector(req)
    const limiter = limiters[tier] || limiters['default']
    
    if (!limiter) {
      throw new Error(`No rate limiter found for tier: ${tier}`)
    }
    
    return limiter(req)
  }
}

// User tier-based rate limiting
export const createUserTierRateLimiter = () => {
  return createTieredRateLimiter(
    {
      admin: {
        windowMs: 60 * 1000,
        maxRequests: 1000, // 1000 requests per minute for admins
      },
      cafeteria_manager: {
        windowMs: 60 * 1000,
        maxRequests: 500, // 500 requests per minute for cafeteria managers
      },
      student: {
        windowMs: 60 * 1000,
        maxRequests: 100, // 100 requests per minute for students
      },
      anonymous: {
        windowMs: 60 * 1000,
        maxRequests: 50, // 50 requests per minute for anonymous users
      },
      default: {
        windowMs: 60 * 1000,
        maxRequests: 100,
      }
    },
    (req) => getUserTierFromRequest(req)
  )
}

// Get user tier from request
const getUserTierFromRequest = (req: NextRequest): string => {
  try {
    // Try to get user role from headers or JWT
    const userRole = req.headers.get('x-user-role')
    if (userRole) {
      return userRole
    }
    
    // If no user info, treat as anonymous
    const userId = getUserIdFromRequest(req)
    return userId ? 'student' : 'anonymous' // Default to student if authenticated
  } catch (error) {
    return 'anonymous'
  }
}

// Rate limiting statistics
export const getRateLimitStats = (): {
  totalKeys: number
  activeWindows: number
  topConsumers: Array<{ key: string; count: number; resetTime: number }>
} => {
  const now = Date.now()
  const activeEntries = Array.from(store['store'].entries())
    .filter(([_, data]) => now <= data.resetTime)
  
  const topConsumers = activeEntries
    .sort(([_, a], [__, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([key, data]) => ({ key, ...data }))
  
  return {
    totalKeys: store['store'].size,
    activeWindows: activeEntries.length,
    topConsumers
  }
}

// Clear rate limit for specific identifier (admin function)
export const clearRateLimit = (identifier: string): boolean => {
  try {
    store['store'].delete(identifier)
    return true
  } catch (error) {
    console.error('Error clearing rate limit:', error)
    return false
  }
}

// Whitelist certain IPs or users from rate limiting
export const createWhitelistRateLimiter = (
  baseConfig: RateLimitConfig,
  whitelist: string[]
) => {
  const baseLimiter = rateLimit(baseConfig)
  
  return (req: NextRequest): RateLimitResult => {
    const identifier = getDefaultIdentifier(req)
    const userId = getUserIdFromRequest(req)
    
    // Check if IP or user is whitelisted
    if (whitelist.includes(identifier) || (userId && whitelist.includes(userId))) {
      return {
        success: true,
        limit: baseConfig.maxRequests,
        remaining: baseConfig.maxRequests,
        resetTime: Date.now() + baseConfig.windowMs
      }
    }
    
    return baseLimiter(req)
  }
}
