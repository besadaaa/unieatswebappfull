"use client"

import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"
import {
  BarChart3,
  ChevronLeft,
  ClipboardList,
  Coffee,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldAlert,
  Users,
  Star,
  User,
  Bell
} from "lucide-react"
import { signOut } from "@/app/actions/auth"
import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if the screen is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setCollapsed(true)
      }
    }

    // Initial check
    checkIfMobile()

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const isActive = (path: string) => {
    if (pathname === path) return true
    if (path !== "/admin/dashboard" && pathname.startsWith(`${path}/`)) return true
    return false
  }

  const handleNavigation = (path: string) => {
    if (pathname === path) {
      // Only show toast if exactly on the same path
      toast({
        title: `Already on ${path.split("/").pop()}`,
        description: `You are already on the ${path.split("/").pop()} page.`,
      })
      return
    }

    // Use router.push for client-side navigation instead of window.location.href
    router.push(path)
  }

  const handleLogout = async () => {
    try {
      // Call the signOut function and get the redirect path
      const result = await signOut()
      // Use the router to navigate to the redirect path
      if (result?.redirectTo) {
        router.push(result.redirectTo)
      }
    } catch (error) {
      console.error("Logout error:", error)
      // Fallback to direct navigation if there's an error
      router.push("/")
    }
  }

  return (
    <div
      className={`${
        collapsed ? "w-[70px]" : "w-[195px]"
      } glass-effect border-r border-white/10 flex flex-col h-screen sticky top-0 transition-all duration-500 ease-out animate-slide-in-left relative z-20`}
    >
      <div className="p-4 flex items-center gap-2 border-b border-white/10">
        <div className="w-6 h-6 flex items-center justify-center">
          <Image src="/logo.png" alt="UniEats Logo" width={24} height={24} className="object-contain" />
        </div>
        {!collapsed && <span className="font-bold gradient-text">UniEats</span>}
        <button
          className="ml-auto text-slate-400 hover:text-orange-500 transition-all duration-300 hover:scale-110 btn-modern"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft size={18} className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {!collapsed && <div className="px-3 py-2 text-xs text-slate-400 uppercase tracking-wider animate-fade-in" style={{ animationDelay: '0.2s' }}>Admin Portal</div>}

      <nav className="flex-1 py-2">
        <ul className="space-y-1 px-2">
          <li className="animate-slide-in-right stagger-1">
            <button
              onClick={() => handleNavigation("/admin/dashboard")}
              className={cn(
                "nav-item flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-300 relative overflow-hidden group",
                isActive("/admin/dashboard")
                  ? "bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 shadow-lg border border-orange-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5 hover:shadow-lg hover:border-white/10 border border-transparent",
              )}
            >
              <LayoutDashboard size={18} className="relative z-10" />
              {!collapsed && <span className="relative z-10">Dashboard</span>}
              {isActive("/admin/dashboard") && <span className="ml-auto w-2 h-2 rounded-full bg-orange-500 animate-pulse relative z-10"></span>}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </li>
          <li className="animate-slide-in-right stagger-2">
            <button
              onClick={() => handleNavigation("/admin/user-management")}
              className={cn(
                "nav-item flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-300 relative overflow-hidden group",
                isActive("/admin/user-management")
                  ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 shadow-lg border border-blue-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5 hover:shadow-lg hover:border-white/10 border border-transparent",
              )}
            >
              <Users size={18} className="relative z-10" />
              {!collapsed && <span className="relative z-10">User Management</span>}
              {isActive("/admin/user-management") && <span className="ml-auto w-2 h-2 rounded-full bg-blue-500 animate-pulse relative z-10"></span>}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </li>
          <li className="animate-slide-in-right stagger-3">
            <button
              onClick={() => handleNavigation("/admin/cafeteria-approvals")}
              className={cn(
                "nav-item flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-300 relative overflow-hidden group",
                isActive("/admin/cafeteria-approvals")
                  ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 shadow-lg border border-emerald-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5 hover:shadow-lg hover:border-white/10 border border-transparent",
              )}
              aria-label="Cafeteria Approvals"
              aria-current={isActive("/admin/cafeteria-approvals") ? "page" : undefined}
            >
              <Coffee size={18} aria-hidden="true" className="relative z-10" />
              {!collapsed && <span className="relative z-10 whitespace-nowrap">Approvals</span>}
              {isActive("/admin/cafeteria-approvals") && (
                <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse relative z-10"></span>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </li>
          <li className="animate-slide-in-right stagger-4">
            <button
              onClick={() => handleNavigation("/admin/cafeteria-ratings")}
              className={cn(
                "nav-item flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-300 relative overflow-hidden group",
                isActive("/admin/cafeteria-ratings")
                  ? "bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-400 shadow-lg border border-pink-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5 hover:shadow-lg hover:border-white/10 border border-transparent",
              )}
            >
              <Star size={18} className="relative z-10" />
              {!collapsed && <span className="relative z-10">Cafeteria Ratings</span>}
              {isActive("/admin/cafeteria-ratings") && <span className="ml-auto w-2 h-2 rounded-full bg-pink-500 animate-pulse relative z-10"></span>}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </li>
          <li className="animate-slide-in-right stagger-5">
            <button
              onClick={() => handleNavigation("/admin/order-insights")}
              className={cn(
                "nav-item flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-300 relative overflow-hidden group",
                isActive("/admin/order-insights")
                  ? "bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-400 shadow-lg border border-purple-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5 hover:shadow-lg hover:border-white/10 border border-transparent",
              )}
            >
              <ClipboardList size={18} className="relative z-10" />
              {!collapsed && <span className="relative z-10">Order Insights</span>}
              {isActive("/admin/order-insights") && <span className="ml-auto w-2 h-2 rounded-full bg-purple-500 animate-pulse relative z-10"></span>}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </li>
          <li className="animate-slide-in-right stagger-6">
            <button
              onClick={() => handleNavigation("/admin/analytics")}
              className={cn(
                "nav-item flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-300 relative overflow-hidden group",
                isActive("/admin/analytics")
                  ? "bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-400 shadow-lg border border-teal-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5 hover:shadow-lg hover:border-white/10 border border-transparent",
              )}
            >
              <BarChart3 size={18} className="relative z-10" />
              {!collapsed && <span className="relative z-10">Analytics</span>}
              {isActive("/admin/analytics") && <span className="ml-auto w-2 h-2 rounded-full bg-teal-500 animate-pulse relative z-10"></span>}
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </li>
          <li className="animate-slide-in-right stagger-7">
            <button
              onClick={() => handleNavigation("/admin/customer-service")}
              className={cn(
                "nav-item flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-300 relative overflow-hidden group",
                isActive("/admin/customer-service")
                  ? "bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-indigo-400 shadow-lg border border-indigo-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5 hover:shadow-lg hover:border-white/10 border border-transparent",
              )}
            >
              <HelpCircle size={18} className="relative z-10" />
              {!collapsed && <span className="relative z-10">Customer Service</span>}
              {isActive("/admin/customer-service") && <span className="ml-auto w-2 h-2 rounded-full bg-indigo-500 animate-pulse relative z-10"></span>}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </li>
          <li className="animate-slide-in-right stagger-8">
            <button
              onClick={() => handleNavigation("/admin/audit-logs")}
              className={cn(
                "nav-item flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-300 relative overflow-hidden group",
                isActive("/admin/audit-logs")
                  ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 shadow-lg border border-yellow-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5 hover:shadow-lg hover:border-white/10 border border-transparent",
              )}
            >
              <ShieldAlert size={18} className="relative z-10" />
              {!collapsed && <span className="relative z-10">Audit Logs</span>}
              {isActive("/admin/audit-logs") && <span className="ml-auto w-2 h-2 rounded-full bg-yellow-500 animate-pulse relative z-10"></span>}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </li>


          <li className="animate-slide-in-right stagger-9">
            <button
              onClick={() => handleNavigation("/admin/reports")}
              className={cn(
                "nav-item flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-300 relative overflow-hidden group",
                isActive("/admin/reports")
                  ? "bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-400 shadow-lg border border-violet-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5 hover:shadow-lg hover:border-white/10 border border-transparent",
              )}
            >
              <FileText size={18} className="relative z-10" />
              {!collapsed && <span className="relative z-10">Reports</span>}
              {isActive("/admin/reports") && <span className="ml-auto w-2 h-2 rounded-full bg-violet-500 animate-pulse relative z-10"></span>}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </li>

        </ul>
      </nav>

      <div className="mt-auto p-4 border-t border-white/10">
        {/* Profile and Notification Icons */}
        <div className="flex items-center gap-2 mb-4">
          {/* Notification Icon */}
          <button
            onClick={() => handleNavigation("/admin/notifications")}
            className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-300 relative group"
            title="Notifications"
          >
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">3</span>
          </button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-300 group"
                title="Profile & Settings"
              >
                <User size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-slate-700">
              <DropdownMenuItem
                onClick={() => handleNavigation("/admin/profile")}
                className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
              >
                <User size={16} className="mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleNavigation("/admin/settings")}
                className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
              >
                <Settings size={16} className="mr-2" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <button
          onClick={handleLogout}
          className="nav-item flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-300 relative overflow-hidden group text-red-400 hover:text-white hover:bg-red-500/10 hover:shadow-lg hover:border-red-500/30 border border-transparent"
        >
          <LogOut size={18} className="relative z-10" />
          {!collapsed && <span className="relative z-10">Logout</span>}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
        {!collapsed && (
          <div className="mt-4 px-3 space-y-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs text-slate-400">System online</span>
            </div>
            <div className="text-xs text-slate-500">UniEats Admin v1.0</div>
            <div className="text-xs text-slate-600">© 2025 UniEats</div>
          </div>
        )}
      </div>
    </div>
  )
}
