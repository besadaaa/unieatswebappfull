"use client"

import { useState, useEffect } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Calendar, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { PageHeader } from "@/components/admin/page-header"

// Types for audit log data
interface AuditLog {
  id: string
  timestamp: string
  user: {
    role: string
    email: string
    roleClass: string
  }
  action: string
  details: string
  severity: {
    level: string
    class: string
  }
  ipAddress: string
}

export default function AuditLogs() {
  const [activeTab, setActiveTab] = useState("all-logs")
  const [dateFilter, setDateFilter] = useState("all-dates")
  const [userFilter, setUserFilter] = useState("all-users")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const { toast } = useToast()

  // Helper function to get role class
  const getRoleClass = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return "bg-purple-500/20 text-purple-500"
      case 'cafeteria_manager':
      case 'cafeteria':
        return "bg-blue-500/20 text-blue-500"
      case 'student':
        return "bg-green-500/20 text-green-500"
      case 'system':
        return "bg-gray-500/20 text-gray-300"
      case 'security':
        return "bg-red-500/20 text-red-500"
      default:
        return "bg-gray-500/20 text-gray-300"
    }
  }

  // Helper function to get severity class
  const getSeverityClass = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'low':
        return "bg-green-500/20 text-green-500"
      case 'medium':
        return "bg-yellow-500/20 text-yellow-500"
      case 'high':
        return "bg-orange-500/20 text-orange-500"
      case 'critical':
        return "bg-red-500/20 text-red-500"
      default:
        return "bg-gray-500/20 text-gray-300"
    }
  }

  // Helper function to format action names
  const formatAction = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Load audit logs from API
  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        setLoading(true)

        // Build query parameters
        const params = new URLSearchParams()

        // Map activeTab to category
        if (activeTab !== "all-logs") {
          switch (activeTab) {
            case "critical":
              params.set('severity', 'critical')
              break
            case "security":
              params.set('category', 'security')
              break
            case "user-management":
              params.set('category', 'user_management')
              break
            case "cafeteria-actions":
              params.set('category', 'cafeteria_actions')
              break
          }
        }

        // Apply user role filter
        if (userFilter !== "all-users") {
          const roleMap: Record<string, string> = {
            'admin': 'admin',
            'cafeteria': 'cafeteria_manager',
            'student': 'student',
            'system': 'system',
            'security': 'security'
          }
          params.set('userRole', roleMap[userFilter] || userFilter)
        }

        // Apply date filter
        if (dateFilter !== "all-dates") {
          params.set('dateFilter', dateFilter)
        }

        // Add search query if present
        if (searchQuery) {
          params.set('search', searchQuery)
        }

        const response = await fetch(`/api/audit-logs?${params.toString()}`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch audit logs')
        }

        // Format logs for the UI
        const formattedLogs: AuditLog[] = data.logs?.map((log: any) => ({
          id: log.id,
          timestamp: new Date(log.created_at).toLocaleString(),
          user: {
            role: log.user_role === 'cafeteria_manager' ? 'Cafeteria Manager' :
                  log.user_role === 'system' ? 'System' :
                  log.user_role?.charAt(0).toUpperCase() + log.user_role?.slice(1) || 'Unknown',
            email: log.user_email || 'System',
            roleClass: getRoleClass(log.user_role)
          },
          action: formatAction(log.action),
          details: log.details || '',
          severity: {
            level: log.severity?.charAt(0).toUpperCase() + log.severity?.slice(1) || 'Low',
            class: getSeverityClass(log.severity)
          },
          ipAddress: log.ip_address?.toString() || 'N/A'
        })) || []

        setAuditLogs(formattedLogs)

      } catch (error) {
        console.error('Error loading audit logs:', error)
        toast({
          title: "Error",
          description: "Failed to load audit logs. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadAuditLogs()
  }, [activeTab, dateFilter, userFilter, searchQuery])

  // Use auditLogs directly since filtering is done server-side
  const filteredLogs = auditLogs

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading audit logs...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Audit Logs"
        subtitle="Monitor system activities and security events"
      />

      <Card className="modern-card glass-effect hover-lift">
        <CardContent className="p-8 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-2xl"></div>

            <div className="flex flex-col md:flex-row gap-4 mb-8 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  placeholder="Search logs..."
                  className="pl-10 glass-effect border-white/20 hover:border-blue-500/50 focus:border-blue-500/50 btn-modern transition-all duration-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-[#0f1424] border-gray-700">
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateFilter === "all-dates"
                        ? "All Dates"
                        : dateFilter === "today"
                          ? "Today"
                          : dateFilter === "yesterday"
                            ? "Yesterday"
                            : dateFilter === "this-week"
                              ? "This Week"
                              : dateFilter === "this-month"
                                ? "This Month"
                                : "Custom"}
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
                  <DropdownMenuContent className="bg-[#1a1f36] border-gray-700">
                    <DropdownMenuItem
                      className="hover:bg-[#0f1424] cursor-pointer"
                      onClick={() => setDateFilter("all-dates")}
                    >
                      All Dates
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="hover:bg-[#0f1424] cursor-pointer"
                      onClick={() => setDateFilter("today")}
                    >
                      Today
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="hover:bg-[#0f1424] cursor-pointer"
                      onClick={() => setDateFilter("yesterday")}
                    >
                      Yesterday
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="hover:bg-[#0f1424] cursor-pointer"
                      onClick={() => setDateFilter("this-week")}
                    >
                      This Week
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="hover:bg-[#0f1424] cursor-pointer"
                      onClick={() => setDateFilter("this-month")}
                    >
                      This Month
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-[#0f1424] border-gray-700">
                      <User className="mr-2 h-4 w-4" />
                      {userFilter === "all-users"
                        ? "All Users"
                        : userFilter === "admin"
                          ? "Admin Users"
                          : userFilter === "cafeteria"
                            ? "Cafeteria Managers"
                            : userFilter === "student"
                              ? "Students"
                              : userFilter === "system"
                                ? "System"
                                : "Security"}
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
                  <DropdownMenuContent className="bg-[#1a1f36] border-gray-700">
                    <DropdownMenuItem
                      className="hover:bg-[#0f1424] cursor-pointer"
                      onClick={() => setUserFilter("all-users")}
                    >
                      All Users
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="hover:bg-[#0f1424] cursor-pointer"
                      onClick={() => setUserFilter("admin")}
                    >
                      Admin Users
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="hover:bg-[#0f1424] cursor-pointer"
                      onClick={() => setUserFilter("cafeteria")}
                    >
                      Cafeteria Managers
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="hover:bg-[#0f1424] cursor-pointer"
                      onClick={() => setUserFilter("student")}
                    >
                      Students
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="hover:bg-[#0f1424] cursor-pointer"
                      onClick={() => setUserFilter("system")}
                    >
                      System
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="hover:bg-[#0f1424] cursor-pointer"
                      onClick={() => setUserFilter("security")}
                    >
                      Security
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="mb-8 animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
              <Tabs defaultValue="all-logs" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="glass-effect border border-white/20 p-1 h-auto rounded-xl">
                  <TabsTrigger
                    value="all-logs"
                    className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5"
                  >
                    All Logs
                  </TabsTrigger>
                  <TabsTrigger
                    value="critical"
                    className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5"
                  >
                    Critical
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5"
                  >
                    Security
                  </TabsTrigger>
                  <TabsTrigger
                    value="user-management"
                    className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5"
                  >
                    User Management
                  </TabsTrigger>
                  <TabsTrigger
                    value="cafeteria-actions"
                    className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5"
                  >
                    Cafeteria Actions
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Audit Log Entries</h3>
              <div className="text-sm text-gray-400 mb-4">
                Showing {filteredLogs.length} {filteredLogs.length === 1 ? "log" : "logs"}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Timestamp</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Action</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Details</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Severity</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 px-4 text-center text-gray-400">
                        No audit logs found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-800">
                        <td className="py-4 px-4">{log.timestamp}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 ${log.user.roleClass} rounded-full text-xs`}>
                              {log.user.role}
                            </span>
                            <span>{log.user.email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">{log.action}</td>
                        <td className="py-4 px-4">{log.details}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 ${log.severity.class} rounded-full text-xs`}>
                            {log.severity.level}
                          </span>
                        </td>
                        <td className="py-4 px-4">{log.ipAddress}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
