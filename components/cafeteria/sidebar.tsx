"use client"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"
import {
  BarChart3,
  ChevronLeft,
  Coffee,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart
} from "lucide-react"
import { signOut } from "@/app/actions/auth"
import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"

export function Sidebar() {
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
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/")
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      })
    } catch (error) {
      toast({
        title: "Error logging out",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleNavigation = (path: string) => {
    if (isActive(path)) {
      toast({
        title: `Already on ${path.split("/").pop()}`,
        description: `You are already on the ${path.split("/").pop()} page.`,
      })
    } else {
      router.push(path)
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
          className="ml-auto text-slate-400 hover:text-emerald-500 transition-all duration-300 hover:scale-110 btn-modern"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft size={18} className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {!collapsed && <div className="px-3 py-2 text-xs text-slate-400 uppercase tracking-wider animate-fade-in" style={{ animationDelay: '0.2s' }}>Cafeteria Portal</div>}

      <nav className="flex-1 py-2">
        <ul className="space-y-1 px-2">
          <li className="animate-slide-in-right stagger-1">
            <button
              onClick={() => handleNavigation("/cafeteria/dashboard")}
              className={cn(
                "nav-item flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-300 relative overflow-hidden group",
                isActive("/cafeteria/dashboard")
                  ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 shadow-lg border border-emerald-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5 hover:shadow-lg hover:border-white/10 border border-transparent",
              )}
            >
              <LayoutDashboard size={18} className="relative z-10" />
              {!collapsed && <span className="relative z-10">Dashboard</span>}
              {isActive("/cafeteria/dashboard") && <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse relative z-10"></span>}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </li>
          <li className="animate-slide-in-right stagger-2">
            <button
              onClick={() => handleNavigation("/cafeteria/menu")}
              className={cn(
                "nav-item flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-300 relative overflow-hidden group",
                isActive("/cafeteria/menu")
                  ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 shadow-lg border border-amber-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5 hover:shadow-lg hover:border-white/10 border border-transparent",
              )}
            >
              <Coffee size={18} className="relative z-10" />
              {!collapsed && <span className="relative z-10">Menu</span>}
              {isActive("/cafeteria/menu") && <span className="ml-auto w-2 h-2 rounded-full bg-amber-500 animate-pulse relative z-10"></span>}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </li>
          <li className="animate-slide-in-right stagger-3">
            <button
              onClick={() => handleNavigation("/cafeteria/orders")}
              className={cn(
                "nav-item flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-300 relative overflow-hidden group",
                isActive("/cafeteria/orders")
                  ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 shadow-lg border border-blue-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5 hover:shadow-lg hover:border-white/10 border border-transparent",
              )}
            >
              <ShoppingCart size={18} className="relative z-10" />
              {!collapsed && <span className="relative z-10">Orders</span>}
              {isActive("/cafeteria/orders") && <span className="ml-auto w-2 h-2 rounded-full bg-blue-500 animate-pulse relative z-10"></span>}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </li>
          <li className="animate-slide-in-right stagger-4">
            <button
              onClick={() => handleNavigation("/cafeteria/inventory")}
              className={cn(
                "nav-item flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-300 relative overflow-hidden group",
                isActive("/cafeteria/inventory")
                  ? "bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-400 shadow-lg border border-purple-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5 hover:shadow-lg hover:border-white/10 border border-transparent",
              )}
            >
              <Package size={18} className="relative z-10" />
              {!collapsed && <span className="relative z-10">Inventory</span>}
              {isActive("/cafeteria/inventory") && <span className="ml-auto w-2 h-2 rounded-full bg-purple-500 animate-pulse relative z-10"></span>}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </li>
          <li className="animate-slide-in-right stagger-5">
            <button
              onClick={() => handleNavigation("/cafeteria/analytics")}
              className={cn(
                "nav-item flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-300 relative overflow-hidden group",
                isActive("/cafeteria/analytics")
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 shadow-lg border border-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5 hover:shadow-lg hover:border-white/10 border border-transparent",
              )}
            >
              <BarChart3 size={18} className="relative z-10" />
              {!collapsed && <span className="relative z-10">Analytics</span>}
              {isActive("/cafeteria/analytics") && <span className="ml-auto w-2 h-2 rounded-full bg-cyan-500 animate-pulse relative z-10"></span>}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </li>
          <li className="animate-slide-in-right stagger-6">
            <button
              onClick={() => handleNavigation("/cafeteria/support")}
              className={cn(
                "nav-item flex w-full items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-300 relative overflow-hidden group",
                isActive("/cafeteria/support")
                  ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 shadow-lg border border-green-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5 hover:shadow-lg hover:border-white/10 border border-transparent",
              )}
            >
              <HelpCircle size={18} className="relative z-10" />
              {!collapsed && <span className="relative z-10">Support</span>}
              {isActive("/cafeteria/support") && <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse relative z-10"></span>}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </li>

        </ul>
      </nav>

      <div className="mt-auto p-4 border-t border-white/10">


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
            <div className="text-xs text-slate-500">UniEats Cafeteria v1.0</div>
            <div className="text-xs text-slate-600">© 2025 UniEats</div>
          </div>
        )}
      </div>
    </div>
  )
}
