import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipients, subject, content, type = 'bulk' } = body

    // Validate input
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'Recipients array is required' },
        { status: 400 }
      )
    }

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      )
    }

    // Validate recipients are email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = recipients.filter((email: string) => !emailRegex.test(email))
    
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      )
    }

    console.log('📧 Sending bulk email to:', recipients.length, 'recipients')

    // Send bulk email
    const result = await emailService.sendBulkEmail(recipients, subject, content)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Email sent successfully`,
        sent: result.sent,
        failed: result.failed,
        total: recipients.length
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to send emails' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve email history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const history = await emailService.getEmailHistory(limit)

    return NextResponse.json({
      success: true,
      emails: history,
      total: history.length
    })

  } catch (error) {
    console.error('Email history API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
