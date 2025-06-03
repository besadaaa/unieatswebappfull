// Account Verification API Endpoint
import { NextRequest, NextResponse } from 'next/server'
import { 
  submitVerificationRequest, 
  reviewVerificationRequest, 
  getVerificationRequests,
  getUserVerificationStatus,
  getVerificationStatistics
} from '@/lib/account-verification'
import { withRateLimit } from '@/lib/rate-limiting'

async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')

    switch (action) {
      case 'user_status':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          )
        }

        const statusResult = await getUserVerificationStatus(userId)
        return NextResponse.json({
          success: statusResult.success,
          data: statusResult.data,
          error: statusResult.error
        })

      case 'admin_requests':
        const status = searchParams.get('status') as any
        const type = searchParams.get('type') as any
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        const requestsResult = await getVerificationRequests(status, type, limit, offset)
        return NextResponse.json({
          success: requestsResult.success,
          data: requestsResult.data,
          total: requestsResult.total,
          error: requestsResult.error
        })

      case 'statistics':
        const statsResult = await getVerificationStatistics()
        return NextResponse.json({
          success: statsResult.success,
          data: statsResult.data,
          error: statsResult.error
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in verification GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function postHandler(request: NextRequest) {
  try {
    const formData = await request.formData()
    const action = formData.get('action') as string

    switch (action) {
      case 'submit':
        const userId = formData.get('userId') as string
        const type = formData.get('type') as any
        const verificationDataStr = formData.get('verificationData') as string

        if (!userId || !type || !verificationDataStr) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          )
        }

        const verificationData = JSON.parse(verificationDataStr)

        // Get uploaded documents
        const documents: File[] = []
        const fileKeys = Array.from(formData.keys()).filter(key => key.startsWith('document_'))
        for (const key of fileKeys) {
          const file = formData.get(key) as File
          if (file) documents.push(file)
        }

        const submitResult = await submitVerificationRequest(userId, type, verificationData, documents)
        return NextResponse.json({
          success: submitResult.success,
          verification_id: submitResult.verification_id,
          message: submitResult.message,
          next_steps: submitResult.next_steps,
          required_documents: submitResult.required_documents
        })

      case 'review':
        const verificationId = formData.get('verificationId') as string
        const adminId = formData.get('adminId') as string
        const decision = formData.get('decision') as 'approve' | 'reject'
        const rejectionReason = formData.get('rejectionReason') as string

        if (!verificationId || !adminId || !decision) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          )
        }

        if (decision === 'reject' && !rejectionReason) {
          return NextResponse.json(
            { error: 'Rejection reason is required when rejecting' },
            { status: 400 }
          )
        }

        const reviewResult = await reviewVerificationRequest(
          verificationId, 
          adminId, 
          decision, 
          rejectionReason
        )

        return NextResponse.json({
          success: reviewResult.success,
          message: reviewResult.message
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in verification POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit('api')(getHandler)
export const POST = withRateLimit('api')(postHandler)
