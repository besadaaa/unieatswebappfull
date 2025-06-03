import { supabase } from './supabase'

// Student messages interface for type safety
export interface StudentMessage {
  id: string;
  userId: string;
  userName: string;
  userType: string;
  userAvatar: string;
  subject: string;
  content: string;
  timestamp: string;
  status: string;
  priority: string;
  responses: MessageResponse[];
  unread: boolean;
}

export interface MessageResponse {
  id: string;
  content: string;
  timestamp: string;
  isAdmin: boolean;
  adminName?: string;
}

// This function is deprecated - all data now comes from Supabase
export function initializeStudentMessages() {
  // No longer needed - all data comes from Supabase
  console.log("initializeStudentMessages is deprecated - using Supabase instead")
}

// API service functions using Supabase
export async function fetchStudentMessages(): Promise<StudentMessage[]> {
  try {
    const { data, error } = await supabase
      .from('student_messages')
      .select(`
        *,
        responses:message_responses(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching student messages:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching student messages:', error)
    return []
  }
}

export async function addMessageResponse(messageId: string, response: Omit<MessageResponse, 'id'>): Promise<void> {
  try {
    const { error } = await supabase
      .from('message_responses')
      .insert([{
        message_id: messageId,
        content: response.content,
        is_admin: response.isAdmin,
        admin_name: response.adminName
      }])

    if (error) {
      console.error('Error adding message response:', error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('Error adding message response:', error)
    throw error
  }
}

export async function updateMessageStatus(messageId: string, status: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('support_tickets')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)

    if (error) {
      console.error('Error updating message status:', error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('Error updating message status:', error)
    throw error
  }
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('support_tickets')
      .update({
        status: 'resolved',
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)

    if (error) {
      console.error('Error marking message as read:', error)
      throw new Error(error.message)
    }
  } catch (error) {
    console.error('Error marking message as read:', error)
    throw error
  }
}
