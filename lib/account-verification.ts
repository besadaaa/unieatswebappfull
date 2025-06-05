// Account Verification System
import { supabase } from './supabase'
import { createSystemNotification, logUserActivity } from './financial'

export interface VerificationRequest {
  id: string
  user_id: string
  type: 'email' | 'phone' | 'student_id' | 'cafeteria_license' | 'identity'
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  verification_data: any
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string
  rejection_reason?: string
  expires_at?: string
}

export interface DocumentUpload {
  id: string
  verification_request_id: string
  document_type: 'student_id_card' | 'business_license' | 'identity_card' | 'phone_bill' | 'other'
  file_url: string
  file_name: string
  uploaded_at: string
}

export interface VerificationResult {
  success: boolean
  verification_id?: string
  message: string
  next_steps?: string[]
  required_documents?: string[]
}

// Submit verification request
export const submitVerificationRequest = async (
  userId: string,
  type: VerificationRequest['type'],
  verificationData: any,
  documents?: File[]
): Promise<VerificationResult> => {
  try {
    // Check if user already has a pending verification of this type
    const { data: existingRequest } = await supabase
      .from('verification_requests')
      .select('id, status')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return {
        success: false,
        message: `You already have a pending ${type} verification request`,
        verification_id: existingRequest.id
      }
    }

    // Create verification request
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days expiry

    const { data: verificationRequest, error: requestError } = await supabase
      .from('verification_requests')
      .insert([{
        user_id: userId,
        type,
        status: 'pending',
        verification_data: verificationData,
        expires_at: expiresAt.toISOString()
      }])
      .select()
      .single()

    if (requestError) throw requestError

    // Upload documents if provided
    if (documents && documents.length > 0) {
      await uploadVerificationDocuments(verificationRequest.id, documents)
    }

    // Create notification for admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    for (const admin of admins || []) {
      await createSystemNotification(
        admin.id,
        'alert',
        'New Verification Request',
        `New ${type} verification request submitted`,
        {
          verification_id: verificationRequest.id,
          user_id: userId,
          type
        },
        'medium'
      )
    }

    // Log the submission
    await logUserActivity(
      userId,
      'verification_submitted',
      'verification_request',
      verificationRequest.id,
      { type, data: verificationData }
    )

    return {
      success: true,
      verification_id: verificationRequest.id,
      message: 'Verification request submitted successfully',
      next_steps: getNextSteps(type)
    }
  } catch (error) {
    console.error('Error submitting verification request:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Review verification request (admin function)
export const reviewVerificationRequest = async (
  verificationId: string,
  adminId: string,
  decision: 'approve' | 'reject',
  rejectionReason?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Get verification request
    const { data: request, error: requestError } = await supabase
      .from('verification_requests')
      .select(`
        *,
        profiles(email, full_name)
      `)
      .eq('id', verificationId)
      .single()

    if (requestError || !request) {
      throw new Error('Verification request not found')
    }

    if (request.status !== 'pending') {
      throw new Error('Verification request has already been reviewed')
    }

    // Update verification request
    const { error: updateError } = await supabase
      .from('verification_requests')
      .update({
        status: decision === 'approve' ? 'approved' : 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        rejection_reason: decision === 'reject' ? rejectionReason : null
      })
      .eq('id', verificationId)

    if (updateError) throw updateError

    // Update user profile based on verification type
    if (decision === 'approve') {
      await updateUserProfileOnApproval(request)
    }

    // Notify user
    const notificationTitle = decision === 'approve' 
      ? `${request.type} Verification Approved`
      : `${request.type} Verification Rejected`
    
    const notificationMessage = decision === 'approve'
      ? `Your ${request.type} verification has been approved`
      : `Your ${request.type} verification was rejected. Reason: ${rejectionReason}`

    await createSystemNotification(
      request.user_id,
      decision === 'approve' ? 'system' : 'alert',
      notificationTitle,
      notificationMessage,
      {
        verification_id: verificationId,
        type: request.type,
        decision,
        rejection_reason: rejectionReason
      },
      decision === 'approve' ? 'medium' : 'high'
    )

    // Log the review
    await logUserActivity(
      adminId,
      'verification_reviewed',
      'verification_request',
      verificationId,
      {
        decision,
        user_id: request.user_id,
        type: request.type,
        rejection_reason: rejectionReason
      }
    )

    return {
      success: true,
      message: `Verification request ${decision}d successfully`
    }
  } catch (error) {
    console.error('Error reviewing verification request:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Get verification requests for admin review
export const getVerificationRequests = async (
  status?: VerificationRequest['status'],
  type?: VerificationRequest['type'],
  limit: number = 50,
  offset: number = 0
) => {
  try {
    let query = supabase
      .from('verification_requests')
      .select(`
        *,
        profiles(email, full_name, role),
        document_uploads(*)
      `)
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (type) {
      query = query.eq('type', type)
    }

    const { data: requests, error } = await query

    if (error) throw error

    return {
      success: true,
      data: requests || [],
      total: requests?.length || 0
    }
  } catch (error) {
    console.error('Error getting verification requests:', error)
    return {
      success: false,
      data: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get user's verification status
export const getUserVerificationStatus = async (userId: string) => {
  try {
    const { data: requests, error } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })

    if (error) throw error

    const verificationStatus = {
      email: getLatestVerificationStatus(requests || [], 'email'),
      phone: getLatestVerificationStatus(requests || [], 'phone'),
      student_id: getLatestVerificationStatus(requests || [], 'student_id'),
      cafeteria_license: getLatestVerificationStatus(requests || [], 'cafeteria_license'),
      identity: getLatestVerificationStatus(requests || [], 'identity'),
      overall_verified: false
    }

    // Determine overall verification status
    verificationStatus.overall_verified = Object.values(verificationStatus)
      .filter(status => status !== false) // Exclude overall_verified itself
      .some(status => status === 'approved')

    return {
      success: true,
      data: verificationStatus
    }
  } catch (error) {
    console.error('Error getting user verification status:', error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Upload verification documents
const uploadVerificationDocuments = async (
  verificationRequestId: string,
  documents: File[]
): Promise<void> => {
  for (const document of documents) {
    try {
      // Upload file to Supabase storage
      const fileName = `${verificationRequestId}/${Date.now()}_${document.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, document)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(fileName)

      // Save document record
      await supabase
        .from('document_uploads')
        .insert([{
          verification_request_id: verificationRequestId,
          document_type: getDocumentType(document.name),
          file_url: urlData.publicUrl,
          file_name: document.name
        }])
    } catch (error) {
      console.error('Error uploading verification document:', error)
    }
  }
}

// Update user profile on verification approval
const updateUserProfileOnApproval = async (request: any): Promise<void> => {
  try {
    const updates: any = {}

    switch (request.type) {
      case 'email':
        updates.email_verified = true
        break
      case 'phone':
        updates.phone_verified = true
        if (request.verification_data.phone) {
          updates.phone = request.verification_data.phone
        }
        break
      case 'student_id':
        updates.student_id_verified = true
        if (request.verification_data.student_id) {
          updates.student_id = request.verification_data.student_id
        }
        break
      case 'identity':
        updates.identity_verified = true
        break
      case 'cafeteria_license':
        updates.business_verified = true
        // If this is a cafeteria verification, update cafeteria status
        if (request.verification_data.cafeteria_id) {
          await supabase
            .from('cafeterias')
            .update({
              approval_status: 'approved',
              approved_at: new Date().toISOString(),
              approved_by: request.reviewed_by
            })
            .eq('id', request.verification_data.cafeteria_id)
        }
        break
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('profiles')
        .update(updates)
        .eq('id', request.user_id)
    }
  } catch (error) {
    console.error('Error updating user profile on approval:', error)
  }
}

// Helper functions
const getLatestVerificationStatus = (
  requests: VerificationRequest[],
  type: VerificationRequest['type']
): string | null => {
  const typeRequests = requests.filter(r => r.type === type)
  if (typeRequests.length === 0) return null
  
  const latest = typeRequests[0] // Already sorted by submitted_at desc
  return latest.status
}

const getDocumentType = (fileName: string): DocumentUpload['document_type'] => {
  const lowerName = fileName.toLowerCase()
  
  if (lowerName.includes('student') || lowerName.includes('id')) {
    return 'student_id_card'
  }
  if (lowerName.includes('license') || lowerName.includes('business')) {
    return 'business_license'
  }
  if (lowerName.includes('identity') || lowerName.includes('national')) {
    return 'identity_card'
  }
  if (lowerName.includes('phone') || lowerName.includes('bill')) {
    return 'phone_bill'
  }
  
  return 'other'
}

const getNextSteps = (type: VerificationRequest['type']): string[] => {
  const commonSteps = [
    'Your request is being reviewed by our team',
    'You will receive a notification once the review is complete',
    'Review typically takes 1-3 business days'
  ]

  const typeSpecificSteps: Record<string, string[]> = {
    email: [
      'Check your email for a verification link',
      ...commonSteps
    ],
    phone: [
      'You may receive a verification SMS',
      ...commonSteps
    ],
    student_id: [
      'Ensure your student ID document is clear and readable',
      ...commonSteps
    ],
    cafeteria_license: [
      'Ensure all business documents are valid and up-to-date',
      'Your cafeteria will be activated once approved',
      ...commonSteps
    ],
    identity: [
      'Ensure your identity document is clear and readable',
      ...commonSteps
    ]
  }

  return typeSpecificSteps[type] || commonSteps
}

// Auto-expire old verification requests
export const expireOldVerificationRequests = async (): Promise<void> => {
  try {
    const now = new Date().toISOString()
    
    const { error } = await supabase
      .from('verification_requests')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', now)

    if (error) throw error
  } catch (error) {
    console.error('Error expiring old verification requests:', error)
  }
}

// Get verification statistics for admin dashboard
export const getVerificationStatistics = async () => {
  try {
    const { data: requests, error } = await supabase
      .from('verification_requests')
      .select('type, status, submitted_at')

    if (error) throw error

    const stats = {
      total: requests?.length || 0,
      pending: requests?.filter(r => r.status === 'pending').length || 0,
      approved: requests?.filter(r => r.status === 'approved').length || 0,
      rejected: requests?.filter(r => r.status === 'rejected').length || 0,
      expired: requests?.filter(r => r.status === 'expired').length || 0,
      by_type: {} as Record<string, number>,
      recent_activity: requests?.filter(r => {
        const submittedDate = new Date(r.submitted_at)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return submittedDate >= weekAgo
      }).length || 0
    }

    // Count by type
    requests?.forEach(request => {
      stats.by_type[request.type] = (stats.by_type[request.type] || 0) + 1
    })

    return {
      success: true,
      data: stats
    }
  } catch (error) {
    console.error('Error getting verification statistics:', error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
