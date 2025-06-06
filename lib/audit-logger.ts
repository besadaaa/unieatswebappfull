import { createSupabaseAdmin } from './supabase'

export interface AuditLogEntry {
  user_id?: string
  user_email?: string
  user_role?: 'student' | 'cafeteria_manager' | 'admin' | 'system'
  action: string
  details?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  category?: 'authentication' | 'user_management' | 'cafeteria_actions' | 'orders' | 'security' | 'system' | 'general'
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, any>
}

export type AuditAction = 
  // Authentication actions
  | 'user_login' | 'user_logout' | 'login_failed' | 'password_reset' | 'account_locked'
  // User management actions
  | 'user_created' | 'user_updated' | 'user_deleted' | 'role_changed' | 'profile_updated'
  // Cafeteria actions
  | 'cafeteria_registered' | 'cafeteria_approved' | 'cafeteria_rejected' | 'menu_item_added' | 'menu_item_updated' | 'menu_item_deleted'
  // Order actions
  | 'order_created' | 'order_updated' | 'order_cancelled' | 'order_completed' | 'payment_processed'
  // Security actions
  | 'unauthorized_access' | 'suspicious_activity' | 'data_breach_attempt' | 'admin_access'
  // System actions
  | 'system_startup' | 'system_shutdown' | 'database_backup' | 'configuration_changed'
  // General actions
  | 'page_viewed' | 'data_exported' | 'report_generated' | 'support_ticket_created'

export class AuditLogger {
  private static instance: AuditLogger
  private supabase: any = null

  private constructor() {}

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  private getSupabase() {
    if (!this.supabase) {
      // Only create admin client when actually needed and env vars are available
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY not available')
      }
      this.supabase = createSupabaseAdmin()
    }
    return this.supabase
  }

  /**
   * Log an audit event
   */
  public async log(entry: AuditLogEntry): Promise<boolean> {
    try {
      const supabase = this.getSupabase()
      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          user_id: entry.user_id || null,
          user_email: entry.user_email || null,
          user_role: entry.user_role || null,
          action: entry.action,
          details: entry.details || null,
          severity: entry.severity || 'low',
          category: entry.category || 'general',
          ip_address: entry.ip_address || null,
          user_agent: entry.user_agent || null,
          metadata: entry.metadata || {},
          created_at: new Date().toISOString()
        }])

      if (error) {
        console.error('Failed to log audit event:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error logging audit event:', error)
      return false
    }
  }

  /**
   * Log authentication events
   */
  public async logAuth(action: AuditAction, userEmail: string, userRole?: string, details?: string, ipAddress?: string): Promise<boolean> {
    return this.log({
      user_email: userEmail,
      user_role: userRole as any,
      action,
      details,
      severity: action.includes('failed') || action.includes('locked') ? 'high' : 'medium',
      category: 'authentication',
      ip_address: ipAddress
    })
  }

  /**
   * Log user management events
   */
  public async logUserManagement(action: AuditAction, adminEmail: string, targetUserEmail: string, details?: string): Promise<boolean> {
    return this.log({
      user_email: adminEmail,
      user_role: 'admin',
      action,
      details: `${details} - Target user: ${targetUserEmail}`,
      severity: 'medium',
      category: 'user_management'
    })
  }

  /**
   * Log cafeteria actions
   */
  public async logCafeteriaAction(action: AuditAction, userEmail: string, userRole: string, details?: string, cafeteriaId?: string): Promise<boolean> {
    return this.log({
      user_email: userEmail,
      user_role: userRole as any,
      action,
      details,
      severity: 'low',
      category: 'cafeteria_actions',
      metadata: { cafeteria_id: cafeteriaId }
    })
  }

  /**
   * Log order events
   */
  public async logOrder(action: AuditAction, userEmail: string, userRole: string, orderId: string, details?: string): Promise<boolean> {
    return this.log({
      user_email: userEmail,
      user_role: userRole as any,
      action,
      details,
      severity: 'low',
      category: 'orders',
      metadata: { order_id: orderId }
    })
  }

  /**
   * Log security events
   */
  public async logSecurity(action: AuditAction, details: string, userEmail?: string, ipAddress?: string, severity: 'medium' | 'high' | 'critical' = 'high'): Promise<boolean> {
    return this.log({
      user_email: userEmail,
      action,
      details,
      severity,
      category: 'security',
      ip_address: ipAddress
    })
  }

  /**
   * Log system events
   */
  public async logSystem(action: AuditAction, details: string, severity: 'low' | 'medium' | 'high' = 'medium'): Promise<boolean> {
    return this.log({
      user_role: 'system',
      action,
      details,
      severity,
      category: 'system'
    })
  }

  /**
   * Log general user activities
   */
  public async logActivity(action: AuditAction, userEmail: string, userRole: string, details?: string, metadata?: Record<string, any>): Promise<boolean> {
    return this.log({
      user_email: userEmail,
      user_role: userRole as any,
      action,
      details,
      severity: 'low',
      category: 'general',
      metadata
    })
  }
}

// Export function to get singleton instance (lazy initialization)
export const getAuditLogger = () => AuditLogger.getInstance()

// Helper function to get client IP address
export function getClientIP(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('remote-addr')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP || remoteAddr || undefined
}

// Helper function to get user agent
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined
}
