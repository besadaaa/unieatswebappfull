import { createSupabaseAdmin } from './supabase'

export interface EmailTemplate {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
}

export interface EmailNotification {
  id?: string
  recipient_email: string
  subject: string
  body: string
  status: 'pending' | 'sent' | 'failed'
  sent_at?: string
  error_message?: string
  template_type?: string
  metadata?: Record<string, any>
}

class EmailService {
  private supabase: any = null

  private getSupabase() {
    if (!this.supabase) {
      // Only create admin client when actually needed and env vars are available
      if (typeof window !== 'undefined') {
        throw new Error('EmailService cannot be used on the client side')
      }
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY not available')
      }
      this.supabase = createSupabaseAdmin()
    }
    return this.supabase
  }

  /**
   * Send email notification and log to database
   */
  async sendEmail(template: EmailTemplate): Promise<{ success: boolean; error?: string }> {
    try {
      // Log email to database first
      const emailLog: Omit<EmailNotification, 'id'> = {
        recipient_email: Array.isArray(template.to) ? template.to.join(', ') : template.to,
        subject: template.subject,
        body: template.html || template.text || '',
        status: 'pending',
        template_type: 'custom',
        metadata: {
          from: template.from || 'noreply@unieats.com',
          timestamp: new Date().toISOString()
        }
      }

      const { data: logEntry, error: logError } = await this.getSupabase()
        .from('email_notifications')
        .insert(emailLog)
        .select()
        .single()

      if (logError) {
        console.error('Failed to log email:', logError)
        return { success: false, error: 'Failed to log email' }
      }

      // For now, we'll simulate sending the email
      // In production, you would integrate with a real email service like:
      // - Supabase Edge Functions with Resend/SendGrid
      // - Direct API calls to email providers
      // - SMTP server

      console.log('📧 Email would be sent:', {
        to: template.to,
        subject: template.subject,
        from: template.from || 'noreply@unieats.com'
      })

      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update status to sent
      await this.getSupabase()
        .from('email_notifications')
        .update({ 
          status: 'sent', 
          sent_at: new Date().toISOString() 
        })
        .eq('id', logEntry.id)

      return { success: true }

    } catch (error) {
      console.error('Email service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<{ success: boolean; error?: string }> {
    const template: EmailTemplate = {
      to: userEmail,
      subject: 'Welcome to UniEats!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Welcome to UniEats, ${userName}!</h1>
          <p>Thank you for joining our university food delivery platform.</p>
          <p>You can now:</p>
          <ul>
            <li>Browse cafeterias and menus</li>
            <li>Place orders for pickup or delivery</li>
            <li>Rate and review your meals</li>
            <li>Track your order history</li>
          </ul>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Best regards,<br>The UniEats Team</p>
        </div>
      `,
      text: `Welcome to UniEats, ${userName}! Thank you for joining our university food delivery platform.`
    }

    return this.sendEmail(template)
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(userEmail: string, orderId: string, orderDetails: any): Promise<{ success: boolean; error?: string }> {
    const template: EmailTemplate = {
      to: userEmail,
      subject: `Order Confirmation - #${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Order Confirmed!</h1>
          <p>Your order #${orderId} has been confirmed.</p>
          <h3>Order Details:</h3>
          <p><strong>Total:</strong> ${orderDetails.total || 'N/A'} EGP</p>
          <p><strong>Estimated Delivery:</strong> ${orderDetails.estimatedDelivery || '30-45 minutes'}</p>
          <p>You will receive updates as your order is prepared and delivered.</p>
          <p>Thank you for choosing UniEats!</p>
        </div>
      `,
      text: `Your order #${orderId} has been confirmed. Total: ${orderDetails.total || 'N/A'} EGP`
    }

    return this.sendEmail(template)
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(userEmail: string, resetLink: string): Promise<{ success: boolean; error?: string }> {
    const template: EmailTemplate = {
      to: userEmail,
      subject: 'Reset Your UniEats Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Password Reset Request</h1>
          <p>You requested to reset your password for your UniEats account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `,
      text: `Reset your UniEats password: ${resetLink}`
    }

    return this.sendEmail(template)
  }

  /**
   * Get email notification history
   */
  async getEmailHistory(limit: number = 50): Promise<EmailNotification[]> {
    try {
      const { data, error } = await this.getSupabase()
        .from('email_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Failed to fetch email history:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Email history error:', error)
      return []
    }
  }

  /**
   * Send bulk emails (for announcements)
   */
  async sendBulkEmail(recipients: string[], subject: string, content: string): Promise<{ success: boolean; sent: number; failed: number }> {
    let sent = 0
    let failed = 0

    for (const recipient of recipients) {
      const result = await this.sendEmail({
        to: recipient,
        subject,
        html: content,
        text: content.replace(/<[^>]*>/g, '') // Strip HTML for text version
      })

      if (result.success) {
        sent++
      } else {
        failed++
      }

      // Small delay to avoid overwhelming the email service
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return { success: true, sent, failed }
  }
}

export const emailService = new EmailService()
export default EmailService
