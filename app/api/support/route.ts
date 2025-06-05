import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

// Unified support system that integrates support_tickets, chat_conversations, and chat_messages
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const body = await request.json()
    const { action, ...data } = body

    if (action === 'create_support_request') {
      // This creates both a support ticket and a chat conversation
      const {
        user_id,
        title,
        description,
        category,
        priority,
        user_type,
        order_id,
        platform = 'web' // 'web' or 'mobile'
      } = data

      if (!user_id || !title || !description) {
        return NextResponse.json(
          { error: 'User ID, title, and description are required' },
          { status: 400 }
      )
      }

      // Generate ticket number
      const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

      // Get user role if user_type not provided
      let finalUserType = user_type
      if (!finalUserType) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', user_id)
          .single()

        if (profile?.role === 'cafeteria_manager') {
          finalUserType = 'cafeteria'
        } else if (profile?.role === 'admin') {
          finalUserType = 'admin'
        } else {
          finalUserType = 'student'
        }
      }

      // 1. Create support ticket
      const { data: ticket, error: ticketError } = await supabaseAdmin
        .from('support_tickets')
        .insert({
          ticket_number: ticketNumber,
          user_id,
          title,
          description,
          category: category || 'general_inquiry',
          priority: priority || 'medium',
          status: 'open',
          user_type: finalUserType,
          order_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (ticketError) {
        console.error('Error creating support ticket:', ticketError)
        return NextResponse.json({ error: 'Failed to create support ticket' }, { status: 500 })
      }

      // 2. Create chat conversation linked to the ticket
      const { data: conversation, error: convError } = await supabaseAdmin
        .from('chat_conversations')
        .insert({
          user_id,
          subject: title,
          category: category || 'general_inquiry',
          priority: priority || 'medium',
          user_type: finalUserType,
          status: 'open',
          order_id,
          ticket_id: ticket.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (convError) {
        console.error('Error creating conversation:', convError)
        // Don't fail the whole operation, ticket is still created
      }

      // 3. Create initial message in the conversation
      if (conversation) {
        const { error: msgError } = await supabaseAdmin
          .from('chat_messages')
          .insert({
            conversation_id: conversation.id,
            sender_id: user_id,
            content: description,
            message_type: 'text',
            is_read: false,
            created_at: new Date().toISOString()
          })

        if (msgError) {
          console.error('Error creating initial message:', msgError)
        }
      }

      return NextResponse.json({
        success: true,
        ticket,
        conversation,
        ticketNumber,
        message: 'Support request created successfully'
      })

    } else if (action === 'send_message') {
      // Send a message in an existing conversation
      const { ticket_id, conversation_id, sender_id, content, message_type, file_url } = data

      console.log('📨 Send message request:', { ticket_id, conversation_id, sender_id, content: content?.substring(0, 50) + '...' })

      if (!sender_id || !content) {
        return NextResponse.json(
          { error: 'Sender ID and content are required' },
          { status: 400 }
        )
      }

      let finalConversationId = conversation_id

      // If no conversation_id but ticket_id provided, find the conversation
      if (!finalConversationId && ticket_id) {
        console.log('🔍 Looking for conversation for ticket:', ticket_id)
        const { data: conv, error: convFindError } = await supabaseAdmin
          .from('chat_conversations')
          .select('id')
          .eq('ticket_id', ticket_id)
          .single()

        if (convFindError) {
          console.log('⚠️ No existing conversation found:', convFindError.message)
        } else {
          console.log('✅ Found existing conversation:', conv?.id)
        }

        finalConversationId = conv?.id

        // If no conversation exists for this ticket, create one
        if (!finalConversationId) {
          console.log('🆕 No conversation found for ticket, creating one...')

          // Get ticket details to create conversation
          console.log('📋 Fetching ticket details for:', ticket_id)
          const { data: ticket, error: ticketError } = await supabaseAdmin
            .from('support_tickets')
            .select('*')
            .eq('id', ticket_id)
            .single()

          if (ticketError) {
            console.error('❌ Error fetching ticket:', ticketError)
          } else {
            console.log('✅ Ticket found:', ticket?.title)
          }

          if (ticket) {
            const { data: newConv, error: convError } = await supabaseAdmin
              .from('chat_conversations')
              .insert({
                user_id: ticket.user_id,
                subject: ticket.title,
                category: ticket.category || 'general_inquiry',
                priority: ticket.priority || 'medium',
                user_type: ticket.user_type,
                status: ticket.status,
                order_id: ticket.order_id,
                ticket_id: ticket.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single()

            if (!convError && newConv) {
              finalConversationId = newConv.id
              console.log('Created new conversation:', finalConversationId)

              // Create initial message with ticket description
              await supabaseAdmin
                .from('chat_messages')
                .insert({
                  conversation_id: finalConversationId,
                  sender_id: ticket.user_id,
                  content: ticket.description,
                  message_type: 'text',
                  is_read: false,
                  created_at: ticket.created_at
                })
            } else {
              console.error('Error creating conversation:', convError)
            }
          }
        }
      }

      if (!finalConversationId) {
        console.error('❌ Final conversation ID is null')
        console.error('Debug info:', { ticket_id, conversation_id, sender_id })
        return NextResponse.json(
          { error: 'Could not find or create conversation for this ticket' },
          { status: 400 }
        )
      }

      console.log('✅ Using conversation ID:', finalConversationId)

      // Create message
      const { data: message, error: msgError } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          conversation_id: finalConversationId,
          sender_id,
          content,
          message_type: message_type || 'text',
          file_url,
          is_read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (msgError) {
        console.error('Error creating message:', msgError)
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
      }

      // Update conversation and ticket timestamps
      await supabaseAdmin
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', finalConversationId)

      if (ticket_id) {
        await supabaseAdmin
          .from('support_tickets')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', ticket_id)
      }

      return NextResponse.json({
        success: true,
        message,
        message: 'Message sent successfully'
      })

    } else if (action === 'get_user_tickets') {
      // Get all tickets and conversations for a specific user (for mobile app)
      const { user_id } = data

      if (!user_id) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
      }

      // Get user's tickets
      const { data: tickets, error: ticketsError } = await supabaseAdmin
        .from('support_tickets')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })

      if (ticketsError) {
        console.error('Error fetching user tickets:', ticketsError)
        return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
      }

      // Get conversations for these tickets
      const ticketIds = tickets?.map(t => t.id) || []
      const { data: conversations } = await supabaseAdmin
        .from('chat_conversations')
        .select('*')
        .in('ticket_id', ticketIds)

      // Get recent messages for each conversation
      const conversationIds = conversations?.map(c => c.id) || []
      const { data: recentMessages } = await supabaseAdmin
        .from('chat_messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false })

      // Combine the data
      const ticketsWithConversations = tickets?.map(ticket => {
        const conversation = conversations?.find(c => c.ticket_id === ticket.id)
        const messages = recentMessages?.filter(m => m.conversation_id === conversation?.id) || []

        return {
          ...ticket,
          conversation,
          messageCount: messages.length,
          lastMessage: messages[0] || null,
          hasUnreadMessages: messages.some(m => !m.is_read && m.sender_id !== user_id)
        }
      }) || []

      return NextResponse.json({
        success: true,
        tickets: ticketsWithConversations,
        total: ticketsWithConversations.length
      })

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in support API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get support data for admin or user
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const ticket_id = searchParams.get('ticket_id')
    const conversation_id = searchParams.get('conversation_id')

    if (ticket_id) {
      // Get specific ticket with conversation and messages
      const { data: ticket, error: ticketError } = await supabaseAdmin
        .from('support_tickets')
        .select('*')
        .eq('id', ticket_id)
        .single()

      if (ticketError) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
      }

      // Get conversation
      const { data: conversation } = await supabaseAdmin
        .from('chat_conversations')
        .select('*')
        .eq('ticket_id', ticket_id)
        .single()

      // Get messages
      let messages = []
      if (conversation) {
        const { data: msgs } = await supabaseAdmin
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true })

        messages = msgs || []
      }

      return NextResponse.json({
        success: true,
        ticket,
        conversation,
        messages
      })
    }

    // Default: return summary for admin dashboard
    const { data: ticketCounts } = await supabaseAdmin
      .from('support_tickets')
      .select('status')

    const counts = {
      open: ticketCounts?.filter(t => t.status === 'open').length || 0,
      in_progress: ticketCounts?.filter(t => t.status === 'in_progress').length || 0,
      resolved: ticketCounts?.filter(t => t.status === 'resolved').length || 0,
      closed: ticketCounts?.filter(t => t.status === 'closed').length || 0
    }

    return NextResponse.json({
      success: true,
      counts,
      total: ticketCounts?.length || 0
    })

  } catch (error) {
    console.error('Error in support GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
