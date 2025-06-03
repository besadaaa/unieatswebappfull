"use client"

import type React from "react"

import { useState, useEffect } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Clock, Send } from "lucide-react"
import { getCurrentUser } from "@/lib/supabase"

interface Message {
  id: string
  userId: string
  userName: string
  userType: "cafeteria"
  userAvatar?: string
  subject: string
  content: string
  timestamp: string
  status: "new" | "in-progress" | "resolved"
  priority: "low" | "medium" | "high"
  responses: Response[]
  unread: boolean
}

interface Response {
  id: string
  content: string
  timestamp: string
  isAdmin: boolean
  adminName?: string
}

export default function CafeteriaSupport() {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [tickets, setTickets] = useState<Message[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Message | null>(null)
  const [selectedTicketDetails, setSelectedTicketDetails] = useState<any>(null)
  const [reply, setReply] = useState("")
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Load user and tickets from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Get current user
        const currentUser = await getCurrentUser()
        setUser(currentUser)

        if (currentUser) {
          // Load user's tickets via API
          const ticketsResponse = await fetch('/api/support', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'get_user_tickets',
              user_id: currentUser.id
            })
          })

          const ticketsData = await ticketsResponse.json()

          if (ticketsResponse.ok && ticketsData.success) {
            const formattedTickets = ticketsData.tickets.map((ticket: any) => ({
              id: ticket.id,
              userId: ticket.user_id,
              userName: currentUser.full_name || currentUser.email?.split('@')[0] || 'User',
              userType: "cafeteria" as const,
              subject: ticket.title,
              content: ticket.description,
              timestamp: ticket.created_at,
              status: ticket.status as "new" | "in-progress" | "resolved",
              priority: ticket.priority as "low" | "medium" | "high",
              responses: [],
              unread: ticket.status === 'open'
            }))

            setTickets(formattedTickets)
          }
        }
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load support tickets.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Fetch ticket details with messages
  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/support?ticket_id=${ticketId}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setSelectedTicketDetails(data)
      } else {
        console.error('Failed to fetch ticket details:', data.error)
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error)
    }
  }

  // Handle ticket selection
  const handleTicketSelect = async (ticket: Message) => {
    setSelectedTicket(ticket)
    await fetchTicketDetails(ticket.id)
  }

  // Submit a new support ticket
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a ticket.",
        variant: "destructive",
      })
      return
    }

    try {
      // Submit ticket via API
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_support_request',
          user_id: user.id,
          title: subject,
          description: message,
          category: 'general_inquiry',
          priority: priority,
          user_type: 'cafeteria',
          platform: 'web'
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Reset form
        setSubject("")
        setMessage("")
        setPriority("medium")

        // Reload tickets via API
        const ticketsResponse = await fetch('/api/support', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'get_user_tickets',
            user_id: user.id
          })
        })

        const ticketsData = await ticketsResponse.json()

        if (ticketsResponse.ok && ticketsData.success) {
          const formattedTickets = ticketsData.tickets.map((ticket: any) => ({
            id: ticket.id,
            userId: ticket.user_id,
            userName: user.full_name || user.email?.split('@')[0] || 'User',
            userType: "cafeteria" as const,
            subject: ticket.title,
            content: ticket.description,
            timestamp: ticket.created_at,
            status: ticket.status as "new" | "in-progress" | "resolved",
            priority: ticket.priority as "low" | "medium" | "high",
            responses: [],
            unread: ticket.status === 'open'
          }))

          setTickets(formattedTickets)
        }

        // Show success message
        toast({
          title: "Ticket submitted",
          description: "Your support ticket has been submitted successfully.",
        })
      } else {
        throw new Error(data.error || "Failed to submit ticket")
      }
    } catch (error: any) {
      console.error("Error submitting ticket:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit ticket. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Send a reply to an existing ticket
  const handleSendReply = async () => {
    if (!selectedTicket || !reply.trim() || !user) return

    try {
      // Send message via API
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_message',
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          content: reply,
          message_type: 'text'
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Clear reply input
        setReply("")

        // Refresh ticket details to show the new message
        await fetchTicketDetails(selectedTicket.id)

        // Show success toast
        toast({
          title: "Reply sent",
          description: "Your reply has been sent successfully.",
        })
      } else {
        throw new Error(data.error || "Failed to send reply")
      }
    } catch (error: any) {
      console.error("Error sending reply:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send reply. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-500">New</Badge>
      case "in-progress":
        return <Badge className="bg-yellow-500">In Progress</Badge>
      case "resolved":
        return <Badge className="bg-green-500">Resolved</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  // Auto-refresh ticket details to check for new admin replies
  useEffect(() => {
    if (!selectedTicket) return

    const refreshTicketDetails = () => {
      fetchTicketDetails(selectedTicket.id)
    }

    // Refresh immediately and then every 30 seconds
    refreshTicketDetails()
    const interval = setInterval(refreshTicketDetails, 30000)
    return () => clearInterval(interval)
  }, [selectedTicket])

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>My Support Tickets</CardTitle>
              <CardDescription>
                {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedTicket?.id === ticket.id ? "bg-muted" : "hover:bg-muted/50"
                      } ${ticket.hasUnreadMessages ? "border-l-4 border-blue-500" : ""}`}
                      onClick={() => handleTicketSelect(ticket)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium truncate flex-1">{ticket.subject}</div>
                        <div className="flex items-center gap-2">
                          {ticket.hasUnreadMessages && (
                            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                          )}
                          {getStatusBadge(ticket.status)}
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <div>
                          {ticket.messageCount || 0} message{(ticket.messageCount || 0) !== 1 ? "s" : ""}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(ticket.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">No tickets yet</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* New Ticket Form */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Create New Ticket</CardTitle>
              <CardDescription>Submit a new support request</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-1">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-1">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue in detail"
                    rows={4}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Submit Ticket
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Selected Ticket */}
        <div className="md:col-span-2">
          {selectedTicket ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle>{selectedTicket.subject}</CardTitle>
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <CardDescription>Created on {new Date(selectedTicket.timestamp).toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Messages from conversation */}
                  {selectedTicketDetails?.messages?.map((message: any, index: number) => (
                    <div key={message.id} className="flex gap-4">
                      {message.sender_id === user?.id ? (
                        // User message
                        <>
                          <Avatar>
                            <AvatarFallback>CM</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="bg-primary text-primary-foreground p-4 rounded-lg">
                              <p>{message.content}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              You • {new Date(message.created_at).toLocaleString()}
                            </p>
                          </div>
                        </>
                      ) : (
                        // Admin message
                        <>
                          <Avatar>
                            <AvatarFallback>AD</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="bg-muted p-4 rounded-lg">
                              <p>{message.content}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Admin • {new Date(message.created_at).toLocaleString()}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )) || (
                    // Fallback to show original ticket content if no messages loaded yet
                    <div className="flex gap-4">
                      <Avatar>
                        <AvatarFallback>CM</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="bg-muted p-4 rounded-lg">
                          <p>{selectedTicket.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          You • {new Date(selectedTicket.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Reply input */}
                  {selectedTicket.status !== "resolved" && (
                    <div className="pt-4 border-t">
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Type your reply..."
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          className="flex-1"
                        />
                        <Button onClick={handleSendReply} disabled={!reply.trim()} className="self-end">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <h3 className="text-lg font-medium mb-2">No ticket selected</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Select a ticket from the list to view details or create a new support ticket.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
