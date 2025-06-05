import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Support tickets API called')
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    })

    const supabaseAdmin = createSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'open', 'in_progress', 'resolved', 'closed', or 'all'
    const userType = searchParams.get('userType') // 'student', 'cafeteria', 'admin', or 'all'
    const userId = searchParams.get('userId') // specific user ID
    const limit = parseInt(searchParams.get('limit') || '50')

    console.log('📋 Query parameters:', { status, userType, userId, limit })

    // Get support tickets
    let ticketsQuery = supabaseAdmin
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filters
    if (status && status !== 'all') {
      ticketsQuery = ticketsQuery.eq('status', status)
    }

    if (userType && userType !== 'all') {
      ticketsQuery = ticketsQuery.eq('user_type', userType)
    }

    if (userId) {
      ticketsQuery = ticketsQuery.eq('user_id', userId)
    }

    console.log('🔍 Executing tickets query...')
    const { data: tickets, error: ticketsError } = await ticketsQuery

    if (ticketsError) {
      console.error('❌ Error fetching support tickets:', ticketsError)
      console.error('Error details:', {
        message: ticketsError.message,
        details: ticketsError.details,
        hint: ticketsError.hint,
        code: ticketsError.code
      })
      return NextResponse.json(
        { error: 'Failed to fetch support tickets', details: ticketsError.message },
        { status: 500 }
      )
    }

    console.log('✅ Tickets fetched successfully:', tickets?.length || 0)

    if (!tickets || tickets.length === 0) {
      return NextResponse.json({
        success: true,
        tickets: [],
        total: 0,
        counts: { open: 0, in_progress: 0, resolved: 0, closed: 0 }
      })
    }

    // Get user IDs for batch fetching
    const userIds = [...new Set(tickets.map(ticket => ticket.user_id).filter(Boolean))]

    // Fetch profiles
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, phone')
      .in('id', userIds)

    // Fetch auth users for emails
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const authUsersMap = new Map(authUsers.users.map(user => [user.id, user]))

    // Create lookup map for profiles
    const profilesMap = new Map(profiles?.map(profile => [profile.id, profile]) || [])

    // Get ticket IDs for fetching conversations and messages
    const ticketIds = tickets.map(ticket => ticket.id)

    // Fetch conversations for these tickets
    const { data: conversations } = await supabaseAdmin
      .from('chat_conversations')
      .select('id, ticket_id')
      .in('ticket_id', ticketIds)

    // Create conversation lookup map
    const conversationMap = new Map(conversations?.map(conv => [conv.ticket_id, conv.id]) || [])

    // Fetch all messages for these conversations
    const conversationIds = conversations?.map(conv => conv.id) || []
    const { data: allMessages } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: true })

    // Group messages by conversation ID
    const messagesByConversation = new Map()
    allMessages?.forEach(message => {
      const convId = message.conversation_id
      if (!messagesByConversation.has(convId)) {
        messagesByConversation.set(convId, [])
      }
      messagesByConversation.get(convId).push(message)
    })

    // Process tickets
    const processedTickets = tickets.map(ticket => {
      const profile = profilesMap.get(ticket.user_id)
      const authUser = authUsersMap.get(ticket.user_id)

      // Format time
      const ticketTime = new Date(ticket.created_at)
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - ticketTime.getTime()) / (1000 * 60))

      let timeString = ""
      if (diffInMinutes < 60) {
        timeString = `${diffInMinutes} mins ago`
      } else if (diffInMinutes < 1440) {
        timeString = `${Math.floor(diffInMinutes / 60)} hours ago`
      } else {
        timeString = ticketTime.toLocaleDateString()
      }

      // Determine status color and priority color
      let statusColor = 'gray'
      let priorityColor = 'gray'

      switch (ticket.status?.toLowerCase()) {
        case 'open':
          statusColor = 'red'
          break
        case 'in_progress':
          statusColor = 'yellow'
          break
        case 'resolved':
          statusColor = 'green'
          break
        case 'closed':
          statusColor = 'gray'
          break
      }

      switch (ticket.priority?.toLowerCase()) {
        case 'low':
          priorityColor = 'green'
          break
        case 'medium':
          priorityColor = 'yellow'
          break
        case 'high':
          priorityColor = 'orange'
          break
        case 'urgent':
          priorityColor = 'red'
          break
      }

      // Format user type for display
      let userTypeDisplay = ticket.user_type || 'Unknown'
      switch (ticket.user_type?.toLowerCase()) {
        case 'student':
          userTypeDisplay = 'Student'
          break
        case 'cafeteria':
          userTypeDisplay = 'Cafeteria'
          break
        case 'admin':
          userTypeDisplay = 'Admin'
          break
      }

      // Get conversation and messages for this ticket
      const conversationId = conversationMap.get(ticket.id)
      const messages = conversationId ? messagesByConversation.get(conversationId) || [] : []

      // Convert chat messages to responses format (excluding the initial message which is the description)
      const responses = messages
        .filter(msg => msg.content !== ticket.description) // Exclude the initial ticket description
        .map(msg => {
          // Check if sender is admin by looking up their profile
          const senderProfile = profilesMap.get(msg.sender_id)
          const isAdmin = senderProfile?.role === 'admin' ||
                         msg.sender_id === '156df217-77cc-499a-b0df-d45d0770215c' || // UniEats Administrator
                         msg.sender_id === '634764ad-bb60-464b-bc08-a54a634134cf'    // Test Admin

          return {
            id: msg.id,
            content: msg.content,
            timestamp: msg.created_at,
            isAdmin: isAdmin,
            adminName: isAdmin ? (senderProfile?.full_name || 'Admin Support') : undefined
          }
        })

      return {
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        title: ticket.title,
        description: ticket.description,
        category: ticket.category || 'general_inquiry',
        status: {
          raw: ticket.status,
          label: ticket.status?.charAt(0).toUpperCase() + ticket.status?.slice(1).replace('_', ' ') || 'Unknown',
          color: statusColor
        },
        priority: {
          raw: ticket.priority,
          label: ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1) || 'Medium',
          color: priorityColor
        },
        user: {
          id: ticket.user_id,
          name: profile?.full_name || authUser?.email?.split('@')[0] || 'Unknown User',
          email: authUser?.email || 'No email',
          phone: profile?.phone || 'No phone',
          role: profile?.role || 'unknown',
          type: userTypeDisplay,
          image: "/diverse-group-city.png"
        },
        time: timeString,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
        isUnread: ticket.status === 'open', // Consider open tickets as unread
        assignedTo: ticket.assigned_to,
        resolutionNotes: ticket.resolution,
        lastResponseAt: messages.length > 0 ? messages[messages.length - 1].created_at : ticket.updated_at,
        responseCount: responses.length,
        responses: responses
      }
    })

    // Calculate counts for all statuses
    const counts = {
      open: processedTickets.filter(ticket => ticket.status.raw === 'open').length,
      in_progress: processedTickets.filter(ticket => ticket.status.raw === 'in_progress').length,
      resolved: processedTickets.filter(ticket => ticket.status.raw === 'resolved').length,
      closed: processedTickets.filter(ticket => ticket.status.raw === 'closed').length
    }

    return NextResponse.json({
      success: true,
      tickets: processedTickets,
      total: processedTickets.length,
      counts,
      filters: {
        status: status || 'all',
        userType: userType || 'all',
        userId: userId || null
      }
    })

  } catch (error) {
    console.error('Error in support tickets API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const body = await request.json()

    const { user_id, title, description, category, priority, user_type } = body

    if (!user_id || !title || !description) {
      return NextResponse.json(
        { error: 'User ID, title, and description are required' },
        { status: 400 }
      )
    }

    // Generate a unique ticket number
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

    const ticketData = {
      ticket_number: ticketNumber,
      user_id,
      title,
      description,
      category: category || 'general_inquiry',
      priority: priority || 'medium',
      status: 'open',
      user_type: finalUserType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .insert([ticketData])
      .select()
      .single()

    if (error) {
      console.error('Error creating support ticket:', error)
      return NextResponse.json(
        { error: 'Failed to create support ticket' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      ticket,
      message: 'Support ticket created successfully'
    })

  } catch (error) {
    console.error('Error creating support ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    const body = await request.json()

    const { ticketId, updates } = body

    if (!ticketId || !updates) {
      return NextResponse.json(
        { error: 'Ticket ID and updates are required' },
        { status: 400 }
      )
    }

    // Map common field names to actual database columns
    const mappedUpdates: any = { ...updates }

    // Handle field name mappings
    if (updates.resolution_notes) {
      mappedUpdates.resolution = updates.resolution_notes
      delete mappedUpdates.resolution_notes
    }
    if (updates.is_read !== undefined) {
      // is_read doesn't exist in support_tickets, we'll use status instead
      delete mappedUpdates.is_read
    }
    if (updates.response_count !== undefined) {
      // response_count doesn't exist, remove it
      delete mappedUpdates.response_count
    }
    if (updates.last_response_at !== undefined) {
      // last_response_at doesn't exist, we'll use updated_at
      delete mappedUpdates.last_response_at
    }

    const { error } = await supabaseAdmin
      .from('support_tickets')
      .update({
        ...mappedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)

    if (error) {
      console.error('Error updating support ticket:', error)
      return NextResponse.json(
        { error: 'Failed to update support ticket' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Support ticket updated successfully'
    })

  } catch (error) {
    console.error('Error updating support ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
