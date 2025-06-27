// Client-side email utilities that don't require admin access
export interface EmailRequest {
  recipients: string[]
  subject: string
  content: string
  type?: 'bulk' | 'single'
}

export interface EmailResponse {
  success: boolean
  sent?: number
  failed?: number
  total?: number
  error?: string
}

/**
 * Send emails via API (client-safe)
 */
export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  content: string
): Promise<EmailResponse> {
  try {
    const response = await fetch('/api/admin/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients,
        subject,
        content,
        type: 'bulk'
      })
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to send emails'
      }
    }

    return {
      success: true,
      sent: result.sent,
      failed: result.failed,
      total: result.total
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

/**
 * Send single email via API
 */
export async function sendSingleEmail(
  recipient: string,
  subject: string,
  content: string
): Promise<EmailResponse> {
  return sendBulkEmail([recipient], subject, content)
}

/**
 * Get email history via API
 */
export async function getEmailHistory(limit: number = 50) {
  try {
    const response = await fetch(`/api/admin/send-email?limit=${limit}`)
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch email history')
    }

    return result.emails || []

  } catch (error) {
    console.error('Failed to fetch email history:', error)
    return []
  }
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate multiple email addresses
 */
export function validateEmails(emails: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = []
  const invalid: string[] = []

  emails.forEach(email => {
    if (isValidEmail(email)) {
      valid.push(email)
    } else {
      invalid.push(email)
    }
  })

  return { valid, invalid }
}
