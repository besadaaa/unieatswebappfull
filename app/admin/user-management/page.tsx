"use client"

import type React from "react"


import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, UserPlus, Mail, Pencil, Trash, Download, UserX, UserCheck, MoreHorizontal, FileSpreadsheet } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/admin/page-header"

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  cafeteria: string
  lastActive: string
  image: string
  full_name?: string
  phone?: string
  theme?: string
  notification_enabled?: boolean
  email_confirmed_at?: string
  last_sign_in_at?: string
}

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRevocationDialog, setShowRevocationDialog] = useState(false)
  const [revocationData, setRevocationData] = useState<{
    user: User | null,
    cafeterias: Array<{id: string, name: string}>,
    canDelete: boolean
  }>({ user: null, cafeterias: [], canDelete: false })
  const [showBulkActionsDialog, setShowBulkActionsDialog] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)
  const [bulkAction, setBulkAction] = useState<'suspend' | 'unsuspend' | 'delete' | 'update_role' | ''>('')

  // Form state for adding/editing users
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    status: "active",
    cafeteria: "",
    phone: "",
  })

  const [loading, setLoading] = useState(true)

  // Real user data from Supabase
  const [users, setUsers] = useState<User[]>([])

  // Load users from API
  const loadUsers = async () => {
    try {
      setLoading(true)

      // Fetch users from our API endpoint
      const response = await fetch('/api/users')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }

      // Format users for the UI with better name handling
      const formattedUsers = data.users?.map((user: any) => {
        // Better name extraction logic
        let displayName = 'Unknown User'
        if (user.full_name && user.full_name.trim()) {
          displayName = user.full_name.trim()
        } else if (user.email) {
          // Extract name from email (before @)
          const emailName = user.email.split('@')[0]
          displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1).replace(/[._]/g, ' ')
        }

        return {
          id: user.id,
          name: displayName,
          email: user.email || 'No email',
          role: user.role === 'cafeteria_manager' ? 'Cafeteria Owner' :
                user.role === 'admin' ? 'Admin' :
                user.role === 'student' ? 'Student' : user.role || 'No role',
          status: user.email_confirmed_at ? 'Active' : 'Pending',
          cafeteria: '-', // We'll need to add cafeteria lookup later
          lastActive: user.last_sign_in_at ?
            new Date(user.last_sign_in_at).toLocaleDateString() :
            user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Never',
          image: "/diverse-group-city.png",
          // Additional fields for detailed view
          full_name: user.full_name || displayName,
          phone: user.phone,
          theme: user.theme,
          notification_enabled: user.notification_enabled,
          email_confirmed_at: user.email_confirmed_at,
          last_sign_in_at: user.last_sign_in_at,
        }
      }) || []

      setUsers(formattedUsers)

      console.log(`Loaded ${formattedUsers.length} users (${data.auth_users_count} auth users, ${data.profiles_count} profiles)`)

    } catch (error: any) {
      console.error('Error loading users:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Handle checkbox selection
  const handleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId))
    } else {
      setSelectedUsers([...selectedUsers, userId])
    }
  }

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id))
    }
    setSelectAll(!selectAll)
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Search initiated",
      description: `Searching for: ${searchQuery}`,
    })
  }

  // Filter users based on search query and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  // Handle adding a new user
  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields including password.",
        variant: "destructive",
      })
      return
    }

    // Show loading state
    toast({
      title: "Adding user",
      description: "Please wait while we create the new user account...",
    })

    try {
      // Create user using the API endpoint
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.name,
          role: formData.role,
          phone: formData.phone || null,
          status: formData.status
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      // Reload users from API
      await loadUsers()

      setShowAddUserDialog(false)
      resetForm()

      toast({
        title: "User added successfully",
        description: `${formData.name} has been added as a ${formData.role}.`,
      })

    } catch (error: any) {
      console.error('Error adding user:', error)
      toast({
        title: "Error adding user",
        description: error.message || "There was a problem creating the user. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle editing a user
  const handleEditUser = async () => {
    if (!currentUser || !formData.name) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    // Show loading state
    toast({
      title: "Updating user",
      description: "Please wait while we update the user information...",
    })

    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          updates: {
            full_name: formData.name,
            role: formData.role,
            phone: formData.phone || null
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user')
      }

      // Reload users from API to get fresh data
      await loadUsers()

      setShowEditUserDialog(false)
      resetForm()

      toast({
        title: "User updated successfully",
        description: `${formData.name}'s information has been updated.`,
      })
    } catch (error: any) {
      console.error('Error updating user:', error)
      toast({
        title: "Error updating user",
        description: error.message || "There was a problem updating the user. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle deleting a user
  const handleDeleteUser = async (force = false) => {
    if (!currentUser) return

    // Show loading state
    toast({
      title: "Deleting user",
      description: `Removing ${currentUser.name} from the system...`,
    })

    try {
      const url = force
        ? `/api/users?userId=${currentUser.id}&force=true`
        : `/api/users?userId=${currentUser.id}`

      const response = await fetch(url, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 403) {
          // Admin deletion blocked
          toast({
            title: "Cannot delete admin",
            description: data.message || "Admin users cannot be deleted for security reasons.",
            variant: "destructive",
          })
          setShowDeleteDialog(false)
          return
        }

        if (response.status === 409 && data.requiresRevocation) {
          // Cafeteria owner with active cafeterias
          setRevocationData({
            user: currentUser,
            cafeterias: data.cafeterias || [],
            canDelete: false
          })
          setShowDeleteDialog(false)
          setShowRevocationDialog(true)
          return
        }

        throw new Error(data.error || 'Failed to delete user')
      }

      // Success - reload users and close dialog
      await loadUsers()
      setShowDeleteDialog(false)

      toast({
        title: "User deleted successfully",
        description: data.message || `${currentUser.name} has been removed from the system.`,
      })
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast({
        title: "Error deleting user",
        description: error.message || "There was a problem deleting the user. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle revoking cafeteria approvals
  const handleRevokeCafeterias = async () => {
    if (!revocationData.user) return

    try {
      toast({
        title: "Revoking cafeteria approvals",
        description: "Please wait while we revoke the cafeteria approvals...",
      })

      const response = await fetch('/api/admin/revoke-cafeteria', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: revocationData.user.id,
          reason: 'Revoked to allow user deletion'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke cafeteria approvals')
      }

      toast({
        title: "Cafeteria approvals revoked",
        description: `Successfully revoked ${data.revokedCafeterias?.length || 0} cafeteria(s). You can now delete the user.`,
      })

      // Update the revocation data to allow deletion
      setRevocationData(prev => ({ ...prev, canDelete: true }))

    } catch (error: any) {
      console.error('Error revoking cafeterias:', error)
      toast({
        title: "Error revoking cafeterias",
        description: error.message || "Failed to revoke cafeteria approvals. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle restoring cafeteria approvals
  const handleRestoreCafeterias = async () => {
    if (!revocationData.user) return

    try {
      toast({
        title: "Restoring cafeteria approvals",
        description: "Please wait while we restore the cafeteria approvals...",
      })

      const response = await fetch('/api/admin/revoke-cafeteria', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: revocationData.user.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to restore cafeteria approvals')
      }

      toast({
        title: "Cafeteria approvals restored",
        description: `Successfully restored ${data.restoredCafeterias?.length || 0} cafeteria(s).`,
      })

      // Close the dialog and refresh users
      setShowRevocationDialog(false)
      setRevocationData({ user: null, cafeterias: [], canDelete: false })
      await loadUsers()

    } catch (error: any) {
      console.error('Error restoring cafeterias:', error)
      toast({
        title: "Error restoring cafeterias",
        description: error.message || "Failed to restore cafeteria approvals. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to delete.",
        variant: "destructive",
      })
      return
    }

    // Show loading state
    toast({
      title: "Deleting users",
      description: `Removing ${selectedUsers.length} user(s) from the system...`,
    })

    // Simulate API call
    setTimeout(() => {
      try {
        const updatedUsers = users.filter((user) => !selectedUsers.includes(user.id))
        setUsers(updatedUsers)
        setSelectedUsers([])
        setSelectAll(false)

        toast({
          title: "Users deleted successfully",
          description: `${selectedUsers.length} user(s) have been removed from the system.`,
        })
      } catch (error) {
        toast({
          title: "Error deleting users",
          description: "There was a problem deleting the users. Please try again.",
          variant: "destructive",
        })
      }
    }, 1500)
  }

  // Handle sending email
  const handleSendEmail = (user: User) => {
    // Show loading state
    toast({
      title: "Sending email",
      description: `Sending email to ${user.email}...`,
    })

    // Simulate API call
    setTimeout(() => {
      try {
        toast({
          title: "Email sent",
          description: `An email has been sent to ${user.email}.`,
        })
      } catch (error) {
        toast({
          title: "Error sending email",
          description: "There was a problem sending the email. Please try again.",
          variant: "destructive",
        })
      }
    }, 1200)
  }

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "student",
      status: "active",
      cafeteria: "",
      phone: "",
    })
  }

  // Open edit dialog with user data
  const openEditDialog = (user: User) => {
    setCurrentUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Don't pre-fill password
      role: user.role === 'Cafeteria Owner' ? 'cafeteria_manager' :
            user.role === 'Admin' ? 'admin' :
            user.role === 'Student' ? 'student' : user.role,
      status: user.status,
      cafeteria: user.cafeteria === "-" ? "" : user.cafeteria,
      phone: user.phone || "",
    })
    setShowEditUserDialog(true)
  }

  // Open delete dialog
  const openDeleteDialog = (user: User) => {
    setCurrentUser(user)
    setShowDeleteDialog(true)
  }

  // Handle bulk suspend/unsuspend users
  const handleBulkSuspendUnsuspend = async (action: 'suspend' | 'unsuspend') => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select users to perform bulk actions.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsBulkProcessing(true)

      const response = await fetch('/api/admin/users/bulk-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userIds: selectedUsers
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Bulk action failed')
      }

      toast({
        title: `Bulk ${action} successful`,
        description: result.message,
      })

      // Refresh users list
      await loadUsers()
      setSelectedUsers([])
      setSelectAll(false)

    } catch (error) {
      console.error(`Bulk ${action} error:`, error)
      toast({
        title: `Bulk ${action} failed`,
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsBulkProcessing(false)
    }
  }

  // Handle export users with real Supabase integration
  const handleExportUsers = async (format: 'csv' | 'excel' = 'csv') => {
    try {
      setIsExporting(true)

      toast({
        title: "Preparing export",
        description: `Generating ${format.toUpperCase()} file of user data...`,
      })

      const response = await fetch(`/api/admin/users/export?format=${format}&includeInactive=true`)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Get the blob from response
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Export successful",
        description: `User data exported to ${format.toUpperCase()} successfully.`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export failed",
        description: "There was an error exporting user data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading users...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="User Management"
        subtitle="Manage users and cafeteria owners across the platform"
      />

      <Card className="modern-card glass-effect hover-lift">
        <CardContent className="p-8 relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 animate-slide-in-up">
            <div className="mt-4 md:mt-0 animate-slide-in-right">
              <Button
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white btn-modern shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => setShowAddUserDialog(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-full blur-2xl"></div>

            <div className="flex flex-col md:flex-row gap-4 mb-8 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative flex-1">
                <form onSubmit={handleSearch}>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <Input
                    placeholder="Search users..."
                    className="pl-10 glass-effect border-white/20 hover:border-blue-500/50 focus:border-blue-500/50 btn-modern transition-all duration-300"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
              </div>

              <div className="flex gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="glass-effect border-white/20 hover:border-emerald-500/50 btn-modern transition-all duration-300">
                      All Roles
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="ml-2"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setRoleFilter("all")}>All Roles</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRoleFilter("Admin")}>Admin</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRoleFilter("Cafeteria Owner")}>
                      Cafeteria Owner
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setRoleFilter("User")}>User</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-[#0f1424] border-gray-700">
                      All Status
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="ml-2"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Status</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("Active")}>Active</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("Inactive")}>Inactive</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="py-3 px-4 font-medium text-gray-400 w-10">
                      <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Cafeteria</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Last Active</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-800">
                      <td className="py-4 px-4">
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleSelectUser(user.id)}
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                            <Image src={user.image || "/placeholder.svg"} alt={user.name} width={32} height={32} />
                          </div>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">{user.email}</td>
                      <td className="py-4 px-4">{user.role}</td>
                      <td className="py-4 px-4">{user.status}</td>
                      <td className="py-4 px-4">{user.cafeteria}</td>
                      <td className="py-4 px-4">{user.lastActive}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSendEmail(user)}>
                            <Mail size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(user)}>
                            <Pencil size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
              <div>
                Showing {filteredUsers.length} of {users.length} users
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#0f1424] border-gray-700 text-orange-500"
                  onClick={() => handleBulkSuspendUnsuspend('suspend')}
                  disabled={selectedUsers.length === 0 || isBulkProcessing}
                >
                  <UserX size={16} className="mr-2" />
                  Suspend Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#0f1424] border-gray-700 text-green-500"
                  onClick={() => handleBulkSuspendUnsuspend('unsuspend')}
                  disabled={selectedUsers.length === 0 || isBulkProcessing}
                >
                  <UserCheck size={16} className="mr-2" />
                  Unsuspend Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#0f1424] border-gray-700 text-red-500"
                  onClick={handleBulkDelete}
                  disabled={selectedUsers.length === 0}
                >
                  <Trash size={16} className="mr-2" />
                  Delete Selected
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-[#0f1424] border-gray-700"
                      disabled={isExporting}
                    >
                      <Download size={16} className="mr-2" />
                      {isExporting ? 'Exporting...' : 'Export Users'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExportUsers('csv')}>
                      <Download size={16} className="mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportUsers('excel')}>
                      <FileSpreadsheet size={16} className="mr-2" />
                      Export as Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="bg-[#1a1f36] border-gray-700">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account in the system.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter full name"
                className="bg-[#0f1424] border-gray-700"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                className="bg-[#0f1424] border-gray-700"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                className="bg-[#0f1424] border-gray-700"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger id="role" className="bg-[#0f1424] border-gray-700">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cafeteria_manager">Cafeteria Manager</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status" className="bg-[#0f1424] border-gray-700">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === "cafeteria_manager" && (
              <div className="grid gap-2">
                <Label htmlFor="cafeteria">Cafeteria</Label>
                <Input
                  id="cafeteria"
                  placeholder="Enter cafeteria name"
                  className="bg-[#0f1424] border-gray-700"
                  value={formData.cafeteria}
                  onChange={(e) => setFormData({ ...formData, cafeteria: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddUserDialog(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
              onClick={handleAddUser}
              disabled={!formData.name || !formData.email || !formData.password}
            >
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="bg-[#1a1f36] border-gray-700">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                placeholder="Enter full name"
                className="bg-[#0f1424] border-gray-700"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="Enter email address"
                className="bg-[#0f1424] border-gray-700"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger id="edit-role" className="bg-[#0f1424] border-gray-700">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Cafeteria Owner">Cafeteria Owner</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="edit-status" className="bg-[#0f1424] border-gray-700">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === "Cafeteria Owner" && (
              <div className="grid gap-2">
                <Label htmlFor="edit-cafeteria">Cafeteria</Label>
                <Input
                  id="edit-cafeteria"
                  placeholder="Enter cafeteria name"
                  className="bg-[#0f1424] border-gray-700"
                  value={formData.cafeteria}
                  onChange={(e) => setFormData({ ...formData, cafeteria: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditUserDialog(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
              onClick={handleEditUser}
              disabled={!formData.name || !formData.email}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#1a1f36] border-gray-700">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleDeleteUser()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cafeteria Revocation Dialog */}
      <Dialog open={showRevocationDialog} onOpenChange={setShowRevocationDialog}>
        <DialogContent className="bg-[#1a1f36] border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-orange-400">Cannot Delete Cafeteria Owner</DialogTitle>
            <DialogDescription className="text-gray-300">
              This user owns active cafeterias that must be revoked first.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4">
              <h4 className="font-medium text-white mb-2">Active Cafeterias:</h4>
              <ul className="space-y-1">
                {revocationData.cafeterias.map((cafeteria) => (
                  <li key={cafeteria.id} className="text-sm text-gray-300 bg-gray-800 px-3 py-1 rounded">
                    {cafeteria.name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-200">
                <strong>Note:</strong> Revoking cafeteria approvals will temporarily disable these cafeterias.
                You can restore them later if needed.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col space-y-2">
            {!revocationData.canDelete ? (
              <>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    onClick={() => setShowRevocationDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRevokeCafeterias}
                    className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
                  >
                    Revoke Cafeterias
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center text-green-400 text-sm mb-2">
                  ✅ Cafeterias revoked. You can now delete the user or restore the cafeterias.
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    onClick={handleRestoreCafeterias}
                    variant="outline"
                    className="flex-1"
                  >
                    Restore Cafeterias
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRevocationDialog(false)
                      setCurrentUser(revocationData.user)
                      handleDeleteUser(true)
                    }}
                    variant="destructive"
                    className="flex-1"
                  >
                    Delete User
                  </Button>
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
