import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { applicationId, emailType, customMessage = '' } = body
    
    if (!applicationId || !emailType) {
      return NextResponse.json(
        { error: 'Application ID and email type are required' },
        { status: 400 }
      )
    }
    
    const supabase = createSupabaseAdmin()
    
    // Get application details
    const { data: application, error: appError } = await supabase
      .from('cafeteria_applications')
      .select(`
        *,
        profiles(full_name, email)
      `)
      .eq('id', applicationId)
      .single()
    
    if (appError || !application) {
      console.error('Error fetching application:', appError)
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }
    
    // Generate email content based on type
    const emailContent = generateEmailContent(emailType, application, customMessage)
    
    // In a real implementation, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Resend
    // - Nodemailer with SMTP

    // For now, we'll simulate sending the email
    
    // Store email information in audit_logs table
    await supabase
      .from('audit_logs')
      .insert({
        action: 'email_sent',
        entity_type: 'cafeteria_application',
        entity_id: applicationId,
        details: {
          email_type: emailType,
          recipient_email: application.profiles?.email,
          recipient_name: application.profiles?.full_name,
          subject: emailContent.subject,
          status: 'sent',
          sent_at: new Date().toISOString(),
          application_name: application.business_name
        }
      })
    
    // Update application status if it's an approval/rejection email
    if (emailType === 'approval') {
      await supabase
        .from('cafeteria_applications')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
      
      // Create cafeteria record
      await createCafeteriaFromApplication(supabase, application)
      
    } else if (emailType === 'rejection') {
      await supabase
        .from('cafeteria_applications')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
    }
    
    // Send notification to mobile app
    await supabase
      .from('notifications')
      .insert({
        user_id: application.user_id,
        title: emailContent.notificationTitle,
        message: emailContent.notificationMessage,
        type: 'application_update',
        is_read: false,
        created_at: new Date().toISOString()
      })
    
    // Log audit trail
    await supabase
      .from('audit_logs')
      .insert({
        action: 'approval_email_sent',
        entity_type: 'cafeteria_application',
        entity_id: applicationId,
        details: {
          email_type: emailType,
          recipient: application.profiles?.email,
          application_name: application.business_name,
          sent_at: new Date().toISOString()
        }
      })
    
    return NextResponse.json({
      success: true,
      message: `${emailType} email sent successfully`,
      emailInfo: {
        recipient: application.profiles?.email,
        subject: emailContent.subject,
        sent_at: new Date().toISOString(),
        type: emailType
      }
    })
    
  } catch (error) {
    console.error('Error sending approval email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateEmailContent(emailType: string, application: any, customMessage: string) {
  const applicantName = application.profiles?.full_name || 'Applicant'
  const businessName = application.business_name || 'Your Business'
  
  switch (emailType) {
    case 'approval':
      return {
        subject: `🎉 Congratulations! Your UniEats Application has been Approved`,
        content: `
Dear ${applicantName},

Congratulations! We are pleased to inform you that your application for "${businessName}" has been approved to join the UniEats platform.

Application Details:
- Business Name: ${businessName}
- Application ID: ${application.id}
- Approved Date: ${new Date().toLocaleDateString()}

Next Steps:
1. You will receive your login credentials shortly
2. Complete your cafeteria profile setup
3. Upload your menu items
4. Start receiving orders!

Our team will contact you within 24 hours to guide you through the onboarding process.

${customMessage ? `\nAdditional Message:\n${customMessage}` : ''}

Welcome to the UniEats family!

Best regards,
The UniEats Team

---
This is an automated message. Please do not reply to this email.
For support, contact us at support@unieats.com
        `,
        notificationTitle: 'Application Approved! 🎉',
        notificationMessage: `Your cafeteria application for "${businessName}" has been approved. Welcome to UniEats!`
      }
      
    case 'rejection':
      return {
        subject: `UniEats Application Update - ${businessName}`,
        content: `
Dear ${applicantName},

Thank you for your interest in joining the UniEats platform. After careful review, we regret to inform you that your application for "${businessName}" has not been approved at this time.

Application Details:
- Business Name: ${businessName}
- Application ID: ${application.id}
- Review Date: ${new Date().toLocaleDateString()}

${customMessage ? `Reason for rejection:\n${customMessage}\n` : ''}

We encourage you to address any concerns and reapply in the future. Our team is available to provide guidance on how to strengthen your application.

For questions or to discuss your application, please contact us at support@unieats.com.

Thank you for your understanding.

Best regards,
The UniEats Team

---
This is an automated message. Please do not reply to this email.
For support, contact us at support@unieats.com
        `,
        notificationTitle: 'Application Update',
        notificationMessage: `Your cafeteria application for "${businessName}" requires attention. Please check your email.`
      }
      
    case 'request_documents':
      return {
        subject: `Additional Documents Required - ${businessName}`,
        content: `
Dear ${applicantName},

Thank you for your application to join UniEats. We are currently reviewing your submission for "${businessName}" and require additional documentation to proceed.

Application Details:
- Business Name: ${businessName}
- Application ID: ${application.id}

Required Documents/Information:
${customMessage || 'Please check your application dashboard for specific requirements.'}

Please submit the requested documents through your application portal or reply to this email with the attachments.

Once we receive the additional information, we will continue processing your application promptly.

If you have any questions, please don't hesitate to contact us at support@unieats.com.

Best regards,
The UniEats Team

---
This is an automated message. Please do not reply to this email.
For support, contact us at support@unieats.com
        `,
        notificationTitle: 'Documents Required',
        notificationMessage: `Additional documents are needed for your "${businessName}" application. Please check your email.`
      }
      
    case 'under_review':
      return {
        subject: `Application Under Review - ${businessName}`,
        content: `
Dear ${applicantName},

Thank you for submitting your application to join UniEats. We have received your application for "${businessName}" and it is currently under review.

Application Details:
- Business Name: ${businessName}
- Application ID: ${application.id}
- Submitted Date: ${new Date(application.created_at).toLocaleDateString()}

Review Process:
- Document verification: In progress
- Business validation: Pending
- Final approval: Pending

Expected timeline: 3-5 business days

We will notify you as soon as the review is complete. In the meantime, if you have any questions or need to update your application, please contact us at support@unieats.com.

${customMessage ? `\nAdditional Information:\n${customMessage}` : ''}

Thank you for your patience.

Best regards,
The UniEats Team

---
This is an automated message. Please do not reply to this email.
For support, contact us at support@unieats.com
        `,
        notificationTitle: 'Application Under Review',
        notificationMessage: `Your "${businessName}" application is being reviewed. We'll update you soon!`
      }
      
    default:
      return {
        subject: `UniEats Application Update - ${businessName}`,
        content: `
Dear ${applicantName},

This is an update regarding your UniEats application for "${businessName}".

${customMessage || 'Please check your application dashboard for more details.'}

If you have any questions, please contact us at support@unieats.com.

Best regards,
The UniEats Team
        `,
        notificationTitle: 'Application Update',
        notificationMessage: `Update available for your "${businessName}" application.`
      }
  }
}

async function createCafeteriaFromApplication(supabase: any, application: any) {
  try {
    // Create cafeteria record from approved application
    const cafeteriaData = {
      name: application.business_name,
      description: application.description || '',
      address: application.address || '',
      phone: application.phone || '',
      email: application.email || '',
      owner_id: application.user_id,
      approval_status: 'approved',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: cafeteria, error } = await supabase
      .from('cafeterias')
      .insert(cafeteriaData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating cafeteria:', error)
      return null
    }
    
    // Update user role to cafeteria_manager
    await supabase
      .from('profiles')
      .update({ role: 'cafeteria_manager' })
      .eq('id', application.user_id)
    
    return cafeteria
    
  } catch (error) {
    console.error('Error in createCafeteriaFromApplication:', error)
    return null
  }
}
