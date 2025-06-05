"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Bell, CheckCircle, Clock, Search, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
// Removed problematic imports - using API instead

// Define types for our messages
interface Message {
  id: string
  ticketNumber: string
  title: string
  description: string
  category: string
  status: {
    raw: string
    label: string
    color: string
  }
  priority: {
    raw: string
    label: string
    color: string
  }
  user: {
    id: string
    name: string
    email: string
    phone: string
    role: string
    type: string
    image: string
  }
  time: string
  createdAt: string
  updatedAt: string
  isUnread: boolean
  assignedTo?: string
  resolutionNotes?: string
  lastResponseAt?: string
  responseCount: number
  responses?: Response[]
}

interface Response {
  id: string
  content: string
  timestamp: string
  isAdmin: boolean
  adminName?: string
}

export default function CustomerServicePage() {
  const [activeTab, setActiveTab] = useState("all")
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [response, setResponse] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [userTypeFilter, setUserTypeFilter] = useState("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  // Load messages from API
  const loadMessages = async () => {
    try {
      console.log('Loading support tickets from API...')

      // Fetch all support tickets from our API endpoint
      const response = await fetch('/api/support-tickets?status=all&userType=all&limit=100')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch support tickets')
      }

      console.log('Fetched support tickets:', data.total)
      console.log('Tickets by type:', {
        total: data.total,
        student: data.tickets?.filter((t: Message) => t.user.type === 'Student').length || 0,
        cafeteria: data.tickets?.filter((t: Message) => t.user.type === 'Cafeteria').length || 0,
        admin: data.tickets?.filter((t: Message) => t.user.type === 'Admin').length || 0,
      })

      // Add responses array for compatibility
      const ticketsWithResponses = data.tickets?.map((ticket: Message) => ({
        ...ticket,
        responses: ticket.responses || []
      })) || []

      setMessages(ticketsWithResponses)
      setFilteredMessages(ticketsWithResponses)

      toast({
        title: "Support tickets loaded",
        description: `Loaded ${data.total} support tickets`,
      })

    } catch (error: any) {
      console.error("Error loading messages:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load support tickets. Please try again.",
        variant: "destructive",
      })
      setMessages([])
      setFilteredMessages([])
    }
  }

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    toast({
      title: "Refreshing tickets",
      description: "Fetching the latest support tickets...",
    })

    try {
      await loadMessages()
      toast({
        title: "Tickets refreshed",
        description: "Support tickets have been updated with the latest information.",
      })
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "There was an error refreshing your data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadMessages()

    // Set up interval to check for new messages every 30 seconds
    const interval = setInterval(loadMessages, 30000)
    return () => clearInterval(interval)
  }, [])

  // Filter messages based on search query, status, and user type
  useEffect(() => {
    let filtered = messages

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (msg) =>
          msg.title.toLowerCase().includes(query) ||
          msg.description.toLowerCase().includes(query) ||
          msg.user.name.toLowerCase().includes(query) ||
          msg.user.email.toLowerCase().includes(query),
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((msg) => msg.status.raw === statusFilter)
    }

    // Filter by user type
    if (userTypeFilter !== "all") {
      const typeMap: { [key: string]: string } = {
        'cafeteria': 'Cafeteria',
        'student': 'Student',
        'admin': 'Admin'
      }
      filtered = filtered.filter((msg) => msg.user.type === typeMap[userTypeFilter])
    }

    setFilteredMessages(filtered)
  }, [messages, searchQuery, statusFilter, userTypeFilter])

  // Handle sending a response
  const handleSendResponse = async () => {
    if (!selectedMessage || !response.trim()) return

    try {
      // Send message via the support API
      const messageResponse = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_message',
          ticket_id: selectedMessage.id,
          sender_id: '156df217-77cc-499a-b0df-d45d0770215c', // UniEats Administrator ID
          content: response,
          message_type: 'text'
        })
      })

      if (!messageResponse.ok) {
        const errorData = await messageResponse.json()
        console.error('Message response error:', errorData)
        throw new Error(errorData.error || 'Failed to send message')
      }

      // Update ticket status to in_progress via API
      const updateResponse = await fetch('/api/support-tickets', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId: selectedMessage.id,
          updates: {
            status: 'in_progress'
          }
        })
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        console.error('Update response error:', errorData)
        throw new Error(errorData.error || 'Failed to update ticket status')
      }

      // Clear response input
      setResponse("")

      // Reload messages to get the updated data with new response
      const reloadResponse = await fetch('/api/support-tickets?status=all&userType=all&limit=100')
      const reloadData = await reloadResponse.json()

      if (reloadResponse.ok) {
        const ticketsWithResponses = reloadData.tickets?.map((ticket: Message) => ({
          ...ticket,
          responses: ticket.responses || []
        })) || []

        setMessages(ticketsWithResponses)
        setFilteredMessages(ticketsWithResponses)

        // Update selected message
        const updatedSelectedMessage = ticketsWithResponses.find((msg: Message) => msg.id === selectedMessage.id)
        if (updatedSelectedMessage) {
          setSelectedMessage(updatedSelectedMessage)
        }
      }

      // Show success toast
      toast({
        title: "Response sent",
        description: "Your response has been sent successfully.",
      })

      // Scroll to bottom of chat messages
      setTimeout(() => {
        const chatMessages = document.getElementById('chat-messages')
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight
        }
      }, 100)
    } catch (error: any) {
      console.error("Error sending response:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send response. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Mark a message as resolved
  const handleMarkResolved = async () => {
    if (!selectedMessage) return

    try {
      // Update ticket status to resolved via API
      const updateResponse = await fetch('/api/support-tickets', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId: selectedMessage.id,
          updates: {
            status: 'resolved',
            resolution: 'Resolved by admin',
            resolved_at: new Date().toISOString()
          }
        })
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        console.error('Resolve response error:', errorData)
        throw new Error(errorData.error || 'Failed to update ticket status')
      }

      // Update the selected message status
      const updatedMessage = {
        ...selectedMessage,
        status: { ...selectedMessage.status, raw: "resolved", label: "Resolved", color: "green" },
        isUnread: false
      }

      // Update messages in state
      const updatedMessages = messages.map((msg) => (msg.id === selectedMessage.id ? updatedMessage : msg))
      setMessages(updatedMessages)
      setFilteredMessages(filteredMessages.map((msg) => (msg.id === selectedMessage.id ? updatedMessage : msg)))
      setSelectedMessage(updatedMessage)

      // Show success toast
      toast({
        title: "Ticket resolved",
        description: "The ticket has been marked as resolved.",
      })
    } catch (error: any) {
      console.error("Error marking as resolved:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update ticket status. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Get status badge color
  const getStatusBadge = (status: { raw: string; label: string; color: string }) => {
    const colorClass = `bg-${status.color}-500`
    return <Badge className={colorClass}>{status.label}</Badge>
  }

  // Get priority badge color
  const getPriorityBadge = (priority: { raw: string; label: string; color: string }) => {
    const colorClass = `border-${priority.color}-500 text-${priority.color}-500`
    return (
      <Badge variant="outline" className={colorClass}>
        {priority.label}
      </Badge>
    )
  }

  // Get user type badge
  const getUserTypeBadge = (userType: string) => {
    switch (userType.toLowerCase()) {
      case "cafeteria":
        return (
          <Badge className="bg-purple-500 hover:bg-purple-600">
            🏪 Cafeteria
          </Badge>
        )
      case "student":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            🎓 Student
          </Badge>
        )
      case "admin":
        return (
          <Badge className="bg-gray-500 hover:bg-gray-600">
            👨‍💼 Admin
          </Badge>
        )
      default:
        return <Badge variant="outline">❓ {userType}</Badge>
    }
  }

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Customer Service"
        subtitle="Manage support tickets from cafeteria owners and students"
      />

      <div className="flex justify-end items-center mb-8 animate-slide-in-up">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tickets..."
              className="pl-8 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="glass-effect border-white/20 hover:border-emerald-500/50 btn-modern transition-all duration-300"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
          <div className="relative">
            <select
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="relative">
            <select
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
            >
              <option value="all">All Users</option>
              <option value="cafeteria">Cafeteria Owners</option>
              <option value="student">Students</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="md:col-span-1">
          <Card className="modern-card glass-effect hover-lift">
            <CardHeader className="relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl"></div>
              <CardTitle className="text-white relative z-10">Support Tickets</CardTitle>
              <CardDescription className="text-gray-300 relative z-10">
                {filteredMessages.length} ticket{filteredMessages.length !== 1 ? "s" : ""}
              </CardDescription>
              <Tabs defaultValue="all" className="w-full relative z-10" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 glass-effect border-white/20">
                  <TabsTrigger value="all" className="text-white data-[state=active]:bg-blue-500/50">All</TabsTrigger>
                  <TabsTrigger value="cafeteria" className="text-white data-[state=active]:bg-purple-500/50">Cafeteria</TabsTrigger>
                  <TabsTrigger value="student" className="text-white data-[state=active]:bg-green-500/50">Students</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {filteredMessages.length > 0 ? (
                  filteredMessages
                    .filter((msg) => activeTab === "all" || msg.user.type.toLowerCase() === activeTab)
                    .map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-300 glass-effect border border-white/10 hover:border-white/20 ${
                          selectedMessage?.id === message.id ? "bg-white/10 border-blue-500/50" : "hover:bg-white/5"
                        } ${message.isUnread ? "border-l-4 border-blue-500" : ""}`}
                        onClick={() => setSelectedMessage(message)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-medium truncate flex-1 text-white">{message.title}</div>
                          <div className="flex items-center gap-2">
                            {message.isUnread && <span className="h-2 w-2 rounded-full bg-blue-500"></span>}
                            {getStatusBadge(message.status)}
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-300">
                          <div className="flex items-center gap-2">
                            <span>{message.user.name}</span>
                            {getUserTypeBadge(message.user.type)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{message.time}</span>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">No tickets found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Ticket */}
        <div className="md:col-span-2">
          {selectedMessage ? (
            <Card className="modern-card glass-effect hover-lift">
              <CardHeader className="flex flex-row items-start justify-between relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-white">{selectedMessage.title}</CardTitle>
                    {getStatusBadge(selectedMessage.status)}
                    {getPriorityBadge(selectedMessage.priority)}
                  </div>
                  <CardDescription className="flex items-center gap-2 text-gray-300">
                    <span>From: {selectedMessage.user.name}</span>
                    {getUserTypeBadge(selectedMessage.user.type)}
                    <span>•</span>
                    <span>{selectedMessage.time}</span>
                    <span>•</span>
                    <span>#{selectedMessage.ticketNumber}</span>
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkResolved}
                  disabled={selectedMessage.status.raw === "resolved"}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Resolved
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 max-h-[500px] overflow-y-auto" id="chat-messages">
                  {/* Original message */}
                  <div className="flex gap-4">
                    <Avatar>
                      <AvatarImage src={selectedMessage.user.image || "/placeholder.svg"} />
                      <AvatarFallback>{selectedMessage.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="bg-muted p-4 rounded-lg max-w-[80%]">
                        <p>{selectedMessage.description}</p>
                        <div className="text-xs text-muted-foreground mt-1">
                          {selectedMessage.time}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Responses */}
                  {(selectedMessage.responses || [])
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .map((resp) => (
                    <div key={resp.id} className="flex gap-4">
                      {resp.isAdmin ? (
                        <>
                          <div className="flex-1 space-y-2">
                            <div className="bg-primary text-primary-foreground p-4 rounded-lg ml-auto max-w-[80%]">
                              <p>{resp.content}</p>
                              <div className="text-xs text-primary-foreground/70 mt-1">
                                {new Date(resp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <Avatar>
                            <AvatarFallback>AD</AvatarFallback>
                          </Avatar>
                        </>
                      ) : (
                        <>
                          <Avatar>
                            <AvatarImage src={selectedMessage.user.image || "/placeholder.svg"} />
                            <AvatarFallback>{selectedMessage.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="bg-muted p-4 rounded-lg max-w-[80%]">
                              <p>{resp.content}</p>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(resp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Response input */}
                  {selectedMessage.status.raw !== "resolved" && (
                    <div className="pt-4 border-t">
                      <Textarea
                        placeholder="Type your response..."
                        className="mb-2"
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                      />
                      <Button onClick={handleSendResponse} disabled={!response.trim()}>
                        Send Response
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No ticket selected</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Select a ticket from the list to view details and respond to the customer.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
