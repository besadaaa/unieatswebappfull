# Audit Logging System

This document explains how to use the comprehensive audit logging system implemented in the UniEats application.

## Overview

The audit logging system tracks all user activities, system events, and security incidents across the application. It provides:

- **Real-time logging** of user activities
- **Categorized events** for easy filtering
- **Severity levels** for prioritization
- **Comprehensive search** and filtering capabilities
- **Role-based access** to audit logs

## Database Schema

The `audit_logs` table contains the following columns:

```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to profiles.id)
- user_email: TEXT
- user_role: TEXT (student, cafeteria_manager, admin, system, security)
- action: TEXT (The action performed)
- details: TEXT (Additional details about the action)
- severity: TEXT (low, medium, high, critical)
- category: TEXT (authentication, user_management, cafeteria_actions, orders, security, system, general)
- ip_address: INET
- user_agent: TEXT
- metadata: JSONB (Additional structured data)
- created_at: TIMESTAMP WITH TIME ZONE
```

## Usage

### 1. Server-Side Logging (API Routes)

```typescript
import { auditLogger, getClientIP, getUserAgent } from '@/lib/audit-logger'

// Basic logging
await auditLogger.log({
  action: 'user_login',
  details: 'User logged in successfully',
  severity: 'medium',
  category: 'authentication',
  user_email: 'user@example.com',
  user_role: 'student',
  ip_address: getClientIP(request),
  user_agent: getUserAgent(request)
})

// Convenience methods
await auditLogger.logAuth('user_login', 'User logged in successfully')
await auditLogger.logOrder('order_created', 'ORD-123', 'New order placed')
await auditLogger.logSecurity('unauthorized_access', 'Failed login attempt', 'high')
```

### 2. Client-Side Logging (React Components)

```typescript
import { useAuditLogger } from '@/hooks/use-audit-logger'

function MyComponent() {
  const { logActivity, logAuth, logOrder } = useAuditLogger()

  const handleLogin = async () => {
    // ... login logic
    await logAuth('user_login', 'User logged in via web interface')
  }

  const handleOrderCreation = async (orderId: string) => {
    // ... order creation logic
    await logOrder('order_created', orderId, 'Order created successfully', {
      total_amount: 25.50,
      items_count: 3
    })
  }

  return (
    // ... component JSX
  )
}
```

## Action Types

### Authentication Actions
- `user_login` - User successfully logged in
- `user_logout` - User logged out
- `login_failed` - Failed login attempt
- `password_reset` - Password reset requested
- `account_locked` - Account locked due to security

### User Management Actions
- `user_created` - New user account created
- `user_updated` - User profile updated
- `user_deleted` - User account deleted
- `role_changed` - User role modified
- `profile_updated` - User profile information updated

### Cafeteria Actions
- `cafeteria_registered` - New cafeteria registered
- `cafeteria_approved` - Cafeteria application approved
- `cafeteria_rejected` - Cafeteria application rejected
- `menu_item_added` - New menu item added
- `menu_item_updated` - Menu item modified
- `menu_item_deleted` - Menu item removed

### Order Actions
- `order_created` - New order placed
- `order_updated` - Order status updated
- `order_cancelled` - Order cancelled
- `order_completed` - Order completed
- `payment_processed` - Payment processed

### Security Actions
- `unauthorized_access` - Unauthorized access attempt
- `suspicious_activity` - Suspicious user activity detected
- `data_breach_attempt` - Potential data breach attempt
- `admin_access` - Admin panel accessed

### System Actions
- `system_startup` - System/service started
- `system_shutdown` - System/service stopped
- `database_backup` - Database backup performed
- `configuration_changed` - System configuration modified

### General Actions
- `page_viewed` - Page or resource accessed
- `data_exported` - Data exported or downloaded
- `report_generated` - Report generated
- `support_ticket_created` - Support ticket created

## Severity Levels

- **Low**: Routine activities (page views, profile updates)
- **Medium**: Important actions (login, order creation, user management)
- **High**: Security-related events (failed logins, unauthorized access)
- **Critical**: Severe security incidents (data breaches, system compromises)

## Categories

- **authentication**: Login/logout activities
- **user_management**: User account operations
- **cafeteria_actions**: Cafeteria-related activities
- **orders**: Order processing activities
- **security**: Security-related events
- **system**: System-level operations
- **general**: General application activities

## Viewing Audit Logs

### Admin Dashboard
Access audit logs through the admin dashboard at `/admin/audit-logs`

### Filtering Options
- **By Category**: Filter by event category
- **By User Role**: Filter by user type (student, cafeteria_manager, admin, system)
- **By Severity**: Filter by severity level
- **By Date**: Filter by time period (today, yesterday, this week, this month)
- **Search**: Search across actions, details, and user emails

### API Access
```typescript
// Get audit logs via API
const response = await fetch('/api/audit-logs?category=security&severity=high&limit=50')
const data = await response.json()
```

## Best Practices

1. **Log Important Actions**: Always log authentication, user management, and security events
2. **Include Context**: Provide meaningful details and metadata
3. **Use Appropriate Severity**: Match severity to the importance of the action
4. **Protect Sensitive Data**: Don't log passwords or sensitive personal information
5. **Regular Monitoring**: Review audit logs regularly for security incidents
6. **Retention Policy**: Implement appropriate log retention policies

## Security Considerations

- Audit logs are stored securely in the database
- Access to audit logs is restricted to admin users
- IP addresses and user agents are logged for security analysis
- Failed access attempts are automatically logged
- Suspicious activities trigger high-severity alerts

## Integration Examples

### Login Page
```typescript
// Log successful login
await auditLogger.logAuth('user_login', `User ${email} logged in successfully`)

// Log failed login
await auditLogger.logSecurity('login_failed', `Failed login attempt for ${email}`, 'high')
```

### Order Processing
```typescript
// Log order creation
await auditLogger.logOrder('order_created', orderId, `Order created for ${total} EGP`, {
  total_amount: total,
  items_count: items.length,
  cafeteria_id: cafeteriaId
})
```

### Admin Actions
```typescript
// Log user role change
await auditLogger.logUserManagement('role_changed', targetUserEmail, 
  `Role changed from ${oldRole} to ${newRole}`)
```

This audit logging system provides comprehensive tracking of all activities within the UniEats application, ensuring security, compliance, and operational visibility.
