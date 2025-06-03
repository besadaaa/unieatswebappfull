import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

// GET - Fetch chat conversations and messages
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const userId = searchParams.get('userId')
    const userType = searchParams.get('userType') // 'student', 'cafeteria', 'admin'
    const status = searchParams.get('status') // 'open', 'closed', 'all'

    if (conversationId) {
      // Fetch specific conversation with messages
      const { data: conversation, error: convError } = await supabaseAdmin
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (convError) {
        console.error('Error fetching conversation:', convError)
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      // Fetch messages for this conversation
      const { data: messages, error: msgError } = await supabaseAdmin
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgError) {
        console.error('Error fetching messages:', msgError)
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
      }

      // Get user info for message senders
      const senderIds = [...new Set(messages?.map(msg => msg.sender_id).filter(Boolean))] || []
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, role')
        .in('id', senderIds)

      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
      const authUsersMap = new Map(authUsers.users.map(user => [user.id, user]))
      const profilesMap = new Map(profiles?.map(profile => [profile.id, profile]) || [])

      // Process messages
      const processedMessages = messages?.map(msg => {
        const profile = profilesMap.get(msg.sender_id)
        const authUser = authUsersMap.get(msg.sender_id)
        
        return {
          id: msg.id,
          conversationId: msg.conversation_id,
          senderId: msg.sender_id,
          senderName: profile?.full_name || authUser?.email?.split('@')[0] || 'Unknown',
          senderRole: profile?.role || 'unknown',
          messageType: msg.message_type || 'text',
          content: msg.content,
          fileUrl: msg.file_url,
          fileName: msg.file_name,
          fileSize: msg.file_size,
          isRead: msg.is_read,
          createdAt: msg.created_at,
          isAdmin: profile?.role === 'admin'
        }
      }) || []

      return NextResponse.json({
        success: true,
        conversation,
        messages: processedMessages
      })

    } else {
      // Fetch all conversations (for admin dashboard)
      let query = supabaseAdmin
        .from('chat_conversations')
        .select('*')
        .order('updated_at', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      if (userType && userType !== 'all') {
        query = query.eq('user_type', userType)
      }

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data: conversations, error } = await query

      if (error) {
        console.error('Error fetching conversations:', error)
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
      }

      // Get user info for conversations
      const userIds = [...new Set(conversations?.map(conv => conv.user_id).filter(Boolean))] || []
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, role, phone')
        .in('id', userIds)

      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
      const authUsersMap = new Map(authUsers.users.map(user => [user.id, user]))
      const profilesMap = new Map(profiles?.map(profile => [profile.id, profile]) || [])

      // Process conversations
      const processedConversations = conversations?.map(conv => {
        const profile = profilesMap.get(conv.user_id)
        const authUser = authUsersMap.get(conv.user_id)

        return {
          id: conv.id,
          userId: conv.user_id,
          userName: profile?.full_name || authUser?.email?.split('@')[0] || 'Unknown User',
          userEmail: authUser?.email || 'No email',
          userType: conv.user_type || profile?.role || 'unknown',
          supportAgentId: conv.support_agent_id,
          subject: conv.subject,
          status: conv.status || 'open',
          priority: conv.priority || 'medium',
          category: conv.category || 'general',
          orderId: conv.order_id,
          ticketId: conv.ticket_id,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
          closedAt: conv.closed_at,
          rating: conv.rating,
          feedback: conv.feedback
        }
      }) || []

      return NextResponse.json({
        success: true,
        conversations: processedConversations,
        total: processedConversations.length
      })
    }

  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new conversation or send message
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const body = await request.json()
    const { action, ...data } = body

    if (action === 'create_conversation') {
      const { user_id, subject, category, priority, user_type, order_id, ticket_id } = data

      if (!user_id || !subject) {
        return NextResponse.json(
          { error: 'User ID and subject are required' },
          { status: 400 }
        )
      }

      // Create conversation
      const { data: conversation, error } = await supabaseAdmin
        .from('chat_conversations')
        .insert({
          user_id,
          subject,
          category: category || 'general',
          priority: priority || 'medium',
          user_type: user_type || 'student',
          status: 'open',
          order_id,
          ticket_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating conversation:', error)
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        conversation,
        message: 'Conversation created successfully'
      })

    } else if (action === 'send_message') {
      const { conversation_id, sender_id, content, message_type, file_url, file_name, file_size } = data

      if (!conversation_id || !sender_id || !content) {
        return NextResponse.json(
          { error: 'Conversation ID, sender ID, and content are required' },
          { status: 400 }
        )
      }

      // Create message
      const { data: message, error: msgError } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          conversation_id,
          sender_id,
          content,
          message_type: message_type || 'text',
          file_url,
          file_name,
          file_size,
          is_read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (msgError) {
        console.error('Error creating message:', msgError)
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
      }

      // Update conversation updated_at
      await supabaseAdmin
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation_id)

      return NextResponse.json({
        success: true,
        message,
        message: 'Message sent successfully'
      })

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in chat POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update conversation status
export async function PATCH(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const body = await request.json()
    const { conversationId, updates } = body

    if (!conversationId || !updates) {
      return NextResponse.json(
        { error: 'Conversation ID and updates are required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('chat_conversations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        ...(updates.status === 'closed' && { closed_at: new Date().toISOString() })
      })
      .eq('id', conversationId)

    if (error) {
      console.error('Error updating conversation:', error)
      return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation updated successfully'
    })

  } catch (error) {
    console.error('Error updating conversation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
