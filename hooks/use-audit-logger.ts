import { useCallback } from 'react'
import { useUser } from '@/hooks/use-user'

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

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical'
export type AuditCategory = 'authentication' | 'user_management' | 'cafeteria_actions' | 'orders' | 'security' | 'system' | 'general'

interface AuditLogData {
  action: AuditAction
  details?: string
  severity?: AuditSeverity
  category?: AuditCategory
  metadata?: Record<string, any>
}

export function useAuditLogger() {
  const { user } = useUser()

  const logActivity = useCallback(async (data: AuditLogData) => {
    try {
      // Don't log if no user (for system actions, this will be handled differently)
      if (!user && !data.action.startsWith('system_')) {
        return false
      }

      const auditData = {
        action: data.action,
        details: data.details,
        severity: data.severity || getSeverityForAction(data.action),
        category: data.category || getCategoryForAction(data.action),
        user_email: user?.email,
        user_role: user?.role,
        metadata: data.metadata || {}
      }

      const response = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(auditData)
      })

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Failed to log audit activity:', error)
      return false
    }
  }, [user])

  // Convenience methods for specific types of activities
  const logAuth = useCallback((action: AuditAction, details?: string) => {
    return logActivity({
      action,
      details,
      category: 'authentication',
      severity: action.includes('failed') || action.includes('locked') ? 'high' : 'medium'
    })
  }, [logActivity])

  const logUserManagement = useCallback((action: AuditAction, targetUser: string, details?: string) => {
    return logActivity({
      action,
      details: `${details} - Target user: ${targetUser}`,
      category: 'user_management',
      severity: 'medium',
      metadata: { target_user: targetUser }
    })
  }, [logActivity])

  const logCafeteriaAction = useCallback((action: AuditAction, details?: string, cafeteriaId?: string) => {
    return logActivity({
      action,
      details,
      category: 'cafeteria_actions',
      severity: 'low',
      metadata: { cafeteria_id: cafeteriaId }
    })
  }, [logActivity])

  const logOrder = useCallback((action: AuditAction, orderId: string, details?: string, metadata?: Record<string, any>) => {
    return logActivity({
      action,
      details,
      category: 'orders',
      severity: 'low',
      metadata: { order_id: orderId, ...metadata }
    })
  }, [logActivity])

  const logSecurity = useCallback((action: AuditAction, details: string, severity: AuditSeverity = 'high') => {
    return logActivity({
      action,
      details,
      category: 'security',
      severity
    })
  }, [logActivity])

  const logGeneral = useCallback((action: AuditAction, details?: string, metadata?: Record<string, any>) => {
    return logActivity({
      action,
      details,
      category: 'general',
      severity: 'low',
      metadata
    })
  }, [logActivity])

  return {
    logActivity,
    logAuth,
    logUserManagement,
    logCafeteriaAction,
    logOrder,
    logSecurity,
    logGeneral
  }
}

// Helper function to determine default severity based on action
function getSeverityForAction(action: AuditAction): AuditSeverity {
  if (action.includes('failed') || action.includes('locked') || action.includes('unauthorized') || action.includes('suspicious') || action.includes('breach')) {
    return 'high'
  }
  if (action.includes('login') || action.includes('created') || action.includes('updated') || action.includes('deleted') || action.includes('role_changed')) {
    return 'medium'
  }
  return 'low'
}

// Helper function to determine default category based on action
function getCategoryForAction(action: AuditAction): AuditCategory {
  if (action.includes('login') || action.includes('logout') || action.includes('password') || action.includes('locked')) {
    return 'authentication'
  }
  if (action.includes('user_') || action.includes('role_') || action.includes('approved') || action.includes('rejected')) {
    return 'user_management'
  }
  if (action.includes('cafeteria') || action.includes('menu_item')) {
    return 'cafeteria_actions'
  }
  if (action.includes('order') || action.includes('payment')) {
    return 'orders'
  }
  if (action.includes('unauthorized') || action.includes('suspicious') || action.includes('breach') || action.includes('security')) {
    return 'security'
  }
  if (action.includes('system_') || action.includes('database') || action.includes('configuration')) {
    return 'system'
  }
  return 'general'
}

// Helper function to get client IP (for client-side logging)
export function getClientIP(): string {
  // This is a simplified version - in production you might want to use a service
  return 'client-side'
}
