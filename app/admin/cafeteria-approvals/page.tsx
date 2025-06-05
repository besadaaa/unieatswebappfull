"use client"

import { useState, useEffect } from "react"

import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Check, X, ChevronRight, MapPin, User, Mail, Phone, Globe, Clock, AlertTriangle, Send } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { PageHeader } from "@/components/admin/page-header"

// Define cafeteria application type
type CafeteriaApplication = {
  id: string
  name: string
  location: string
  status: "pending" | "approved" | "rejected"
  owner: string
  email: string
  phone: string
  website: string
  submittedDate: string
  description: string
  businessLicense?: string
  contactPhone?: string
}

export default function CafeteriaApprovals() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [viewDetailsId, setViewDetailsId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    id: string
    action: "approve" | "reject"
  } | null>(null)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [selectedApplicationForEmail, setSelectedApplicationForEmail] = useState<string | null>(null)
  const [emailType, setEmailType] = useState<'approval' | 'rejection' | 'request_documents' | 'under_review'>('approval')
  const [customEmailMessage, setCustomEmailMessage] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [loading, setLoading] = useState(true)

  // Real cafeteria applications data from Supabase
  const [cafeteriaApplications, setCafeteriaApplications] = useState<CafeteriaApplication[]>([])

  // Load cafeteria applications from Supabase
  useEffect(() => {
    const loadCafeteriaApplications = async () => {
      try {
        setLoading(true)

        // Fetch cafeteria applications
        const { data: applications, error } = await supabase
          .from('cafeteria_applications')
          .select('*')
          .order('submitted_at', { ascending: false })

        if (error) {
          console.error('Error fetching cafeterias:', error)
          toast({
            title: "Error",
            description: "Failed to load cafeteria applications. Please try again.",
            variant: "destructive",
          })
          return
        }

        // Format applications for the UI
        const formattedApplications = applications?.map((application: any) => ({
          id: application.id,
          name: application.business_name || 'Unknown Business',
          location: application.location || 'Location not specified',
          status: application.status || 'pending',
          owner: application.owner_name || 'Unknown Owner',
          email: application.contact_email || 'No email',
          phone: application.contact_phone || 'No phone',
          website: application.website || 'No website',
          submittedDate: application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : 'Unknown',
          description: application.description || 'No description provided',
        })) || []

        setCafeteriaApplications(formattedApplications)
      } catch (error) {
        console.error('Error loading cafeteria applications:', error)
        toast({
          title: "Error",
          description: "Failed to load cafeteria applications. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadCafeteriaApplications()
  }, [])

  // Filter applications based on active tab and search query
  const filteredApplications = cafeteriaApplications.filter((app) => {
    const matchesTab = activeTab === "all" || app.status === activeTab
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.location.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  // Get counts for tabs
  const counts = {
    all: cafeteriaApplications.length,
    pending: cafeteriaApplications.filter((app) => app.status === "pending").length,
    approved: cafeteriaApplications.filter((app) => app.status === "approved").length,
    rejected: cafeteriaApplications.filter((app) => app.status === "rejected").length,
  }

  // Handle approve action
  const handleApprove = async (id: string) => {
    try {
      // Update status via API
      const response = await fetch('/api/cafeteria-applications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: id,
          status: 'approved',
          reviewNotes: 'Application approved by admin'
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve application')
      }

      // Update local state
      setCafeteriaApplications((prev) => prev.map((app) => (app.id === id ? { ...app, status: "approved" } : app)))

      toast({
        title: "Cafeteria Approved",
        description: "The cafeteria application has been approved successfully.",
        variant: "default",
      })
    } catch (error: any) {
      console.error('Error approving cafeteria:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to approve cafeteria. Please try again.",
        variant: "destructive",
      })
    }
    setConfirmAction(null)
  }

  // Handle reject action
  const handleReject = async (id: string) => {
    try {
      // Update status via API
      const response = await fetch('/api/cafeteria-applications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: id,
          status: 'rejected',
          reviewNotes: 'Application rejected by admin'
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject application')
      }

      // Update local state
      setCafeteriaApplications((prev) => prev.map((app) => (app.id === id ? { ...app, status: "rejected" } : app)))

      toast({
        title: "Cafeteria Rejected",
        description: "The cafeteria application has been rejected.",
        variant: "destructive",
      })
    } catch (error: any) {
      console.error('Error rejecting cafeteria:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to reject cafeteria. Please try again.",
        variant: "destructive",
      })
    }
    setConfirmAction(null)
  }

  // Get details of a specific application
  const getApplicationDetails = (id: string) => {
    return cafeteriaApplications.find((app) => app.id === id)
  }

  // Handle send email
  const handleSendEmail = async () => {
    if (!selectedApplicationForEmail) return

    try {
      setIsSendingEmail(true)

      const response = await fetch('/api/admin/cafeteria-approvals/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: selectedApplicationForEmail,
          emailType,
          customMessage: customEmailMessage
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email')
      }

      toast({
        title: "Email sent successfully",
        description: `${emailType} email has been sent to the applicant.`,
      })

      // Close dialog and reset state
      setShowEmailDialog(false)
      setSelectedApplicationForEmail(null)
      setCustomEmailMessage('')
      setEmailType('approval')

    } catch (error: any) {
      console.error('Error sending email:', error)
      toast({
        title: "Failed to send email",
        description: error.message || "There was an error sending the email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Open email dialog
  const openEmailDialog = (applicationId: string, type: 'approval' | 'rejection' | 'request_documents' | 'under_review') => {
    setSelectedApplicationForEmail(applicationId)
    setEmailType(type)
    setShowEmailDialog(true)
  }

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-500"
      case "approved":
        return "bg-green-500/20 text-green-500"
      case "rejected":
        return "bg-red-500/20 text-red-500"
      default:
        return "bg-gray-500/20 text-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading cafeteria applications...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Cafeteria Applications"
        subtitle="Review and manage cafeteria applications for UniEats platform"
      />

      <Card className="modern-card glass-effect hover-lift">
        <CardContent className="p-8 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl"></div>

            <div className="relative mb-8 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Search cafeterias..."
                className="pl-10 glass-effect border-white/20 hover:border-emerald-500/50 focus:border-emerald-500/50 btn-modern transition-all duration-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex justify-center mb-8 animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
              <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-auto">
                <TabsList className="glass-effect border border-white/20 p-1 h-auto rounded-xl">
                  <TabsTrigger
                    value="all"
                    className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5"
                  >
                    All ({counts.all})
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5"
                  >
                    Pending ({counts.pending})
                  </TabsTrigger>
                  <TabsTrigger
                    value="approved"
                    className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5"
                  >
                    Approved ({counts.approved})
                  </TabsTrigger>
                  <TabsTrigger
                    value="rejected"
                    className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5"
                  >
                    Rejected ({counts.rejected})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredApplications.length > 0 ? (
                filteredApplications.map((application) => (
                  <Card key={application.id} className="bg-[#0f1424] border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
                          <User size={24} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium">{application.name}</h3>
                          <div className="flex items-center text-sm text-gray-400">
                            <MapPin size={14} className="mr-1" />
                            {application.location}
                          </div>
                        </div>
                        <div className="ml-auto">
                          <span
                            className={`px-2 py-1 ${getStatusBadge(application.status)} rounded-full text-xs capitalize`}
                          >
                            {application.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User size={16} className="text-gray-400" />
                          <span className="text-gray-400">Owner:</span>
                          <span>{application.owner}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={16} className="text-gray-400" />
                          <span className="text-gray-400">Email:</span>
                          <span>{application.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={16} className="text-gray-400" />
                          <span className="text-gray-400">Phone:</span>
                          <span>{application.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Globe size={16} className="text-gray-400" />
                          <span className="text-gray-400">Website:</span>
                          <span>{application.website}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock size={16} className="text-gray-400" />
                          <span className="text-gray-400">Submitted:</span>
                          <span>{application.submittedDate}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Description</h4>
                        <p className="text-sm text-gray-400">{application.description}</p>
                      </div>

                      <div className="flex gap-2">
                        {application.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              className="bg-[#0f1424] border-gray-700 text-red-500"
                              onClick={() => setConfirmAction({ id: application.id, action: "reject" })}
                            >
                              <X size={16} className="mr-2" />
                              Reject
                            </Button>
                            <Button
                              className="bg-yellow-500 hover:bg-yellow-600 text-black"
                              onClick={() => setConfirmAction({ id: application.id, action: "approve" })}
                            >
                              <Check size={16} className="mr-2" />
                              Approve
                            </Button>
                          </>
                        )}
                        {application.status === "approved" && (
                          <Button
                            variant="outline"
                            className="bg-[#0f1424] border-gray-700 text-red-500"
                            onClick={() => setConfirmAction({ id: application.id, action: "reject" })}
                          >
                            <X size={16} className="mr-2" />
                            Revoke Approval
                          </Button>
                        )}
                        {application.status === "rejected" && (
                          <Button
                            className="bg-yellow-500 hover:bg-yellow-600 text-black"
                            onClick={() => setConfirmAction({ id: application.id, action: "approve" })}
                          >
                            <Check size={16} className="mr-2" />
                            Reconsider
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="bg-[#0f1424] border-gray-700 text-blue-500"
                          onClick={() => openEmailDialog(application.id, application.status === 'approved' ? 'approval' : application.status === 'rejected' ? 'rejection' : 'under_review')}
                        >
                          <Send size={16} className="mr-2" />
                          Send Email
                        </Button>
                        <Button
                          variant="outline"
                          className="ml-auto bg-[#0f1424] border-gray-700"
                          onClick={() => setViewDetailsId(application.id)}
                        >
                          View Details
                          <ChevronRight size={16} className="ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center p-8 text-center">
                  <Search size={48} className="text-gray-500 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No applications found</h3>
                  <p className="text-gray-400">
                    No cafeteria applications match your current filters. Try adjusting your search or filter criteria.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="bg-[#1a1f36] border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>{confirmAction?.action === "approve" ? "Approve Cafeteria" : "Reject Cafeteria"}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {confirmAction?.action === "approve"
                ? "Are you sure you want to approve this cafeteria? This will grant them access to the UniEats platform."
                : "Are you sure you want to reject this cafeteria? You can reconsider this decision later."}
            </DialogDescription>
          </DialogHeader>

          {confirmAction && (
            <div className="p-4 bg-[#0f1424] rounded-md mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="font-medium">{getApplicationDetails(confirmAction.id)?.name}</h4>
                  <p className="text-sm text-gray-400">{getApplicationDetails(confirmAction.id)?.location}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-end">
            <DialogClose asChild>
              <Button variant="outline" className="bg-[#0f1424] border-gray-700">
                Cancel
              </Button>
            </DialogClose>
            {confirmAction?.action === "approve" ? (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleApprove(confirmAction.id)}
              >
                <Check size={16} className="mr-2" />
                Confirm Approval
              </Button>
            ) : (
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleReject(confirmAction.id)}>
                <X size={16} className="mr-2" />
                Confirm Rejection
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewDetailsId} onOpenChange={(open) => !open && setViewDetailsId(null)}>
        <DialogContent className="bg-[#1a1f36] border-gray-700 text-white max-w-3xl">
          {viewDetailsId && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Cafeteria Application Details</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className="md:col-span-1">
                  <div className="rounded-lg overflow-hidden bg-[#0f1424] aspect-square relative flex items-center justify-center">
                    <User size={64} className="text-gray-400" />
                  </div>

                  <div className="mt-4 bg-[#0f1424] p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Status</h3>
                    <div
                      className={`px-3 py-2 ${getStatusBadge(getApplicationDetails(viewDetailsId)?.status || "pending")} rounded-md text-center capitalize font-medium`}
                    >
                      {getApplicationDetails(viewDetailsId)?.status}
                    </div>

                    {getApplicationDetails(viewDetailsId)?.status === "rejected" && (
                      <div className="mt-4 flex items-start gap-2 text-sm text-red-400">
                        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                        <p>This application has been rejected. You can reconsider this decision if needed.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="bg-[#0f1424] p-4 rounded-lg mb-4">
                    <h3 className="font-medium mb-3">{getApplicationDetails(viewDetailsId)?.name}</h3>
                    <div className="flex items-center text-sm text-gray-400 mb-4">
                      <MapPin size={14} className="mr-1" />
                      {getApplicationDetails(viewDetailsId)?.location}
                    </div>

                    <h4 className="text-sm font-medium mb-2">Description</h4>
                    <p className="text-sm text-gray-400 mb-4">{getApplicationDetails(viewDetailsId)?.description}</p>

                    <h4 className="text-sm font-medium mb-2">Contact Information</h4>
                    <div className="grid gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User size={16} className="text-gray-400" />
                        <span className="text-gray-400">Owner:</span>
                        <span>{getApplicationDetails(viewDetailsId)?.owner}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={16} className="text-gray-400" />
                        <span className="text-gray-400">Email:</span>
                        <span>{getApplicationDetails(viewDetailsId)?.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={16} className="text-gray-400" />
                        <span className="text-gray-400">Phone:</span>
                        <span>{getApplicationDetails(viewDetailsId)?.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Globe size={16} className="text-gray-400" />
                        <span className="text-gray-400">Website:</span>
                        <span>{getApplicationDetails(viewDetailsId)?.website}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-gray-400">Submitted:</span>
                        <span>{getApplicationDetails(viewDetailsId)?.submittedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <DialogClose asChild>
                      <Button variant="outline" className="bg-[#0f1424] border-gray-700">
                        Close
                      </Button>
                    </DialogClose>

                    {getApplicationDetails(viewDetailsId)?.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          className="bg-[#0f1424] border-gray-700 text-red-500"
                          onClick={() => {
                            setViewDetailsId(null)
                            setConfirmAction({ id: viewDetailsId, action: "reject" })
                          }}
                        >
                          <X size={16} className="mr-2" />
                          Reject
                        </Button>
                        <Button
                          className="bg-yellow-500 hover:bg-yellow-600 text-black"
                          onClick={() => {
                            setViewDetailsId(null)
                            setConfirmAction({ id: viewDetailsId, action: "approve" })
                          }}
                        >
                          <Check size={16} className="mr-2" />
                          Approve
                        </Button>
                      </>
                    )}

                    {getApplicationDetails(viewDetailsId)?.status === "approved" && (
                      <Button
                        variant="outline"
                        className="bg-[#0f1424] border-gray-700 text-red-500"
                        onClick={() => {
                          setViewDetailsId(null)
                          setConfirmAction({ id: viewDetailsId, action: "reject" })
                        }}
                      >
                        <X size={16} className="mr-2" />
                        Revoke Approval
                      </Button>
                    )}

                    {getApplicationDetails(viewDetailsId)?.status === "rejected" && (
                      <Button
                        className="bg-yellow-500 hover:bg-yellow-600 text-black"
                        onClick={() => {
                          setViewDetailsId(null)
                          setConfirmAction({ id: viewDetailsId, action: "approve" })
                        }}
                      >
                        <Check size={16} className="mr-2" />
                        Reconsider
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="bg-[#1a1f36] border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Email to Applicant</DialogTitle>
            <DialogDescription className="text-gray-400">
              Send an email notification to the cafeteria applicant regarding their application status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email Type</label>
              <select
                value={emailType}
                onChange={(e) => setEmailType(e.target.value as any)}
                className="w-full p-2 bg-[#0f1424] border border-gray-700 rounded-md text-white"
              >
                <option value="approval">Approval Email</option>
                <option value="rejection">Rejection Email</option>
                <option value="request_documents">Request Additional Documents</option>
                <option value="under_review">Under Review Notification</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Custom Message (Optional)</label>
              <textarea
                value={customEmailMessage}
                onChange={(e) => setCustomEmailMessage(e.target.value)}
                placeholder="Add any additional message or specific requirements..."
                className="w-full p-3 bg-[#0f1424] border border-gray-700 rounded-md text-white min-h-[100px] resize-none"
              />
            </div>

            {selectedApplicationForEmail && (
              <div className="bg-[#0f1424] p-4 rounded-md">
                <h4 className="font-medium mb-2">Recipient Information</h4>
                <div className="text-sm text-gray-400">
                  <p><strong>Business:</strong> {getApplicationDetails(selectedApplicationForEmail)?.name}</p>
                  <p><strong>Owner:</strong> {getApplicationDetails(selectedApplicationForEmail)?.owner}</p>
                  <p><strong>Email:</strong> {getApplicationDetails(selectedApplicationForEmail)?.email}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <DialogClose asChild>
              <Button variant="outline" className="bg-[#0f1424] border-gray-700">
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSendEmail}
              disabled={isSendingEmail}
            >
              <Send size={16} className="mr-2" />
              {isSendingEmail ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
