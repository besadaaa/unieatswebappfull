"use client"
import { useState, useEffect, useRef } from "react"
import {
  Bell,
  Menu,
  X,
  Search,
  ChevronDown,
  LayoutDashboard,
  Coffee,
  ShoppingCart,
  Package,
  HelpCircle,
  User,
  Settings,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "@/components/theme-context"
import { useRouter, usePathname } from "next/navigation"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { MobileNotificationsPanel } from "@/components/mobile-notifications-panel"
import { useMediaQuery } from "@/hooks/use-media-query"
import { announce, registerKeyboardShortcut } from "@/lib/accessibility"
import { getCurrentUser } from "@/lib/supabase"

export function CafeteriaHeader() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationCount, setNotificationCount] = useState(0)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isMobileNotificationsOpen, setIsMobileNotificationsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useMediaQuery("(max-width: 768px)")
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load user data from Supabase
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (currentUser) {
          setUser({
            name: currentUser.full_name || currentUser.email?.split('@')[0] || 'User',
            email: currentUser.email,
            image: currentUser.avatar_url || "/placeholder-user.jpg",
            role: currentUser.role
          })
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  // Register keyboard shortcuts
  useEffect(() => {
    // Keyboard shortcuts cleanup functions
    const cleanupFunctions = [
      // Press / to focus search
      registerKeyboardShortcut(
        "/",
        () => {
          searchInputRef.current?.focus()
        },
        { description: "Focus search" },
      ),

      // Removed 'n' shortcut for notifications to avoid accidental triggers

      // Press Escape to close notifications on desktop
      registerKeyboardShortcut("Escape", () => {
        if (isNotificationsOpen) {
          setIsNotificationsOpen(false)
          announce("Notifications closed")
        }
      }),

      // Navigation shortcuts
      registerKeyboardShortcut(
        "d",
        () => {
          router.push("/cafeteria/dashboard")
          announce("Navigated to dashboard")
        },
        { alt: true, description: "Go to dashboard" },
      ),

      registerKeyboardShortcut(
        "m",
        () => {
          router.push("/cafeteria/menu")
          announce("Navigated to menu")
        },
        { alt: true, description: "Go to menu" },
      ),

      registerKeyboardShortcut(
        "o",
        () => {
          router.push("/cafeteria/orders")
          announce("Navigated to orders")
        },
        { alt: true, description: "Go to orders" },
      ),

      registerKeyboardShortcut(
        "i",
        () => {
          router.push("/cafeteria/inventory")
          announce("Navigated to inventory")
        },
        { alt: true, description: "Go to inventory" },
      ),

      registerKeyboardShortcut(
        "s",
        () => {
          router.push("/cafeteria/support")
          announce("Navigated to support")
        },
        { alt: true, description: "Go to support" },
      ),
    ]

    // Cleanup all keyboard shortcuts on unmount
    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [isMobile, isNotificationsOpen, router])

  // Check for responses from admin in localStorage
  useEffect(() => {
    const checkNotifications = () => {
      const cafeteriaMessages = JSON.parse(localStorage.getItem("cafeteriaMessages") || "[]")

      // Get system messages (responses from admin)
      const systemMessages = cafeteriaMessages
        .filter((msg) => msg.sender === "system")
        .map((msg) => ({
          id: msg.id,
          title: "Admin Response",
          description: msg.content.length > 50 ? msg.content.substring(0, 50) + "..." : msg.content,
          time: new Date(msg.timestamp).toLocaleString(),
          read: msg.read || false,
        }))

      setNotifications(systemMessages.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()))

      // Count unread notifications
      const unreadCount = systemMessages.filter((n) => !n.read).length
      setNotificationCount(unreadCount)

      // Announce new notifications for screen readers
      if (unreadCount > 0 && unreadCount !== notificationCount) {
        announce(`You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`, "polite")
      }
    }

    // Check on mount
    checkNotifications()

    // Set up interval to check periodically
    const interval = setInterval(checkNotifications, 5000)
    return () => clearInterval(interval)
  }, [notificationCount])

  const handleViewAllNotifications = () => {
    setIsNotificationsOpen(false)
    router.push("/cafeteria/support")

    // Mark all as read
    const cafeteriaMessages = JSON.parse(localStorage.getItem("cafeteriaMessages") || "[]")
    const updatedMessages = cafeteriaMessages.map((msg) => ({ ...msg, read: true }))
    localStorage.setItem("cafeteriaMessages", JSON.stringify(updatedMessages))
    setNotificationCount(0)
    announce("All notifications marked as read")
  }

  const handleNotificationClick = (notification) => {
    // Mark notification as read
    const cafeteriaMessages = JSON.parse(localStorage.getItem("cafeteriaMessages") || "[]")
    const updatedMessages = cafeteriaMessages.map((msg) => (msg.id === notification.id ? { ...msg, read: true } : msg))
    localStorage.setItem("cafeteriaMessages", JSON.stringify(updatedMessages))

    // Navigate to support page
    router.push("/cafeteria/support")
    setIsNotificationsOpen(false)
    announce("Notification opened in support page")
  }

  const handleBellClick = () => {
    if (isMobile) {
      setIsMobileNotificationsOpen(true)
      announce("Notifications panel opened")
    } else {
      setIsNotificationsOpen(!isNotificationsOpen)
      announce(isNotificationsOpen ? "Notifications closed" : "Notifications opened")
    }
  }

  const handleLogout = () => {
    // Implement your logout logic here, e.g., clearing local storage, redirecting to login page
    console.log("Logout clicked")
    router.push("/") // Example: Redirect to the home page
    announce("Logging out")
  }

  const handleNavigation = (path: string, label: string) => {
    router.push(path)
    announce(`Navigated to ${label}`)
  }

  return (
    <>
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-white focus:text-black focus:outline-none focus:ring-2 focus:ring-yellow-500"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-10 border-b border-[#1a1f36] bg-[#0f1424] pb-4 md:pb-0" role="banner">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen)
                announce(isMobileMenuOpen ? "Menu closed" : "Menu opened")
              }}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-xl font-semibold">Cafeteria Dashboard</h1>
          </div>
          <div className="ml-auto flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search..."
                className={`rounded-md border pl-8 pr-3 py-2 text-sm ${
                  isDark
                    ? "bg-[#0f1424] border-gray-700 text-white placeholder:text-gray-400"
                    : "bg-white border-gray-300 text-black placeholder:text-gray-500"
                }`}
                ref={searchInputRef}
                aria-label="Search"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    announce("Performing search")
                  }
                }}
              />
            </div>

            {/* Bell icon for notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={handleBellClick}
              aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ""}`}
              aria-haspopup="true"
              aria-expanded={isNotificationsOpen}
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span
                  className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white"
                  aria-hidden="true"
                >
                  {notificationCount}
                </span>
              )}
            </Button>

            {/* Desktop Notifications Dropdown */}
            {!isMobile && (
              <DropdownMenu open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                <DropdownMenuTrigger asChild>
                  <span className="hidden">Notifications Trigger</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-80"
                  onCloseAutoFocus={(e) => {
                    // Prevent focus returning to trigger when closed
                    e.preventDefault()
                  }}
                >
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length > 0 ? (
                    <>
                      <div className="max-h-[300px] overflow-y-auto" role="region" aria-label="Notification list">
                        {notifications.map((notification) => (
                          <DropdownMenuItem
                            key={notification.id}
                            className="cursor-pointer flex flex-col items-start p-3 hover:bg-accent focus:bg-accent"
                            onClick={() => handleNotificationClick(notification)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                handleNotificationClick(notification)
                              }
                            }}
                            role="button"
                            aria-label={`${notification.title}${!notification.read ? ", unread" : ""}`}
                            tabIndex={0}
                          >
                            <div className="flex w-full justify-between">
                              <span className="font-medium">{notification.title}</span>
                              {!notification.read && (
                                <span className="h-2 w-2 rounded-full bg-blue-600" aria-hidden="true"></span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">{notification.description}</span>
                            <span className="mt-1 text-xs text-gray-400">{notification.time}</span>
                          </DropdownMenuItem>
                        ))}
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer justify-center font-medium text-blue-600 focus:text-blue-500 focus:bg-accent"
                        onClick={handleViewAllNotifications}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            handleViewAllNotifications()
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        View All Notifications
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <div className="py-4 text-center text-sm text-gray-500" role="status">
                      No new notifications
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full bg-[#1a1f36] p-1 pr-3 text-sm font-medium text-white hover:bg-[#2a2f46] focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-[#0f1424]"
                  aria-label="User menu"
                  aria-haspopup="true"
                >
                  <Avatar className="h-8 w-8 border border-yellow-500">
                    <AvatarImage src={user?.image || ""} alt="" />
                    <AvatarFallback className="bg-[#1a1f36] text-yellow-500" aria-hidden="true">
                      {user?.name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{user?.name || "User"}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-[#1a1f36] text-white border border-[#2a2f46] shadow-lg animate-in fade-in-80 slide-in-from-top-5"
                sideOffset={8}
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                    <p className="text-xs leading-none text-gray-400">{user?.email || "user@example.com"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#2a2f46]" />
                <DropdownMenuItem
                  className="cursor-pointer flex items-center hover:bg-[#2a2f46] focus:bg-[#2a2f46] rounded-sm py-2"
                  onClick={() => handleNavigation("/cafeteria/profile", "profile")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      handleNavigation("/cafeteria/profile", "profile")
                    }
                  }}
                  role="menuitem"
                  tabIndex={0}
                >
                  <User className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex items-center hover:bg-[#2a2f46] focus:bg-[#2a2f46] rounded-sm py-2"
                  onClick={() => handleNavigation("/cafeteria/settings", "settings")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      handleNavigation("/cafeteria/settings", "settings")
                    }
                  }}
                  role="menuitem"
                  tabIndex={0}
                >
                  <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#2a2f46]" />
                <DropdownMenuItem
                  className="cursor-pointer flex items-center hover:bg-[#2a2f46] focus:bg-[#2a2f46] rounded-sm py-2 text-red-400 hover:text-red-300 focus:text-red-300"
                  onClick={handleLogout}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      handleLogout()
                    }
                  }}
                  role="menuitem"
                  tabIndex={0}
                >
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1f36] border-t border-[#2a2f46] z-50"
          aria-label="Mobile navigation"
          id="mobile-menu"
        >
          <div className="flex justify-around items-center h-16">
            <button
              onClick={() => handleNavigation("/cafeteria/dashboard", "dashboard")}
              className={`flex flex-col items-center justify-center w-1/5 h-full ${
                pathname === "/cafeteria/dashboard"
                  ? "text-yellow-500"
                  : "text-gray-400 hover:text-white focus:text-white"
              }`}
              aria-label="Dashboard"
              aria-current={pathname === "/cafeteria/dashboard" ? "page" : undefined}
            >
              <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs mt-1">Dashboard</span>
            </button>
            <button
              onClick={() => handleNavigation("/cafeteria/menu", "menu")}
              className={`flex flex-col items-center justify-center w-1/5 h-full ${
                pathname === "/cafeteria/menu" ? "text-yellow-500" : "text-gray-400 hover:text-white focus:text-white"
              }`}
              aria-label="Menu"
              aria-current={pathname === "/cafeteria/menu" ? "page" : undefined}
            >
              <Coffee className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs mt-1">Menu</span>
            </button>
            <button
              onClick={() => handleNavigation("/cafeteria/orders", "orders")}
              className={`flex flex-col items-center justify-center w-1/5 h-full ${
                pathname === "/cafeteria/orders" ? "text-yellow-500" : "text-gray-400 hover:text-white focus:text-white"
              }`}
              aria-label="Orders"
              aria-current={pathname === "/cafeteria/orders" ? "page" : undefined}
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs mt-1">Orders</span>
            </button>
            <button
              onClick={() => handleNavigation("/cafeteria/inventory", "inventory")}
              className={`flex flex-col items-center justify-center w-1/5 h-full ${
                pathname === "/cafeteria/inventory"
                  ? "text-yellow-500"
                  : "text-gray-400 hover:text-white focus:text-white"
              }`}
              aria-label="Inventory"
              aria-current={pathname === "/cafeteria/inventory" ? "page" : undefined}
            >
              <Package className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs mt-1">Inventory</span>
            </button>
            <button
              onClick={() => handleNavigation("/cafeteria/support", "support")}
              className={`flex flex-col items-center justify-center w-1/5 h-full ${
                pathname === "/cafeteria/support"
                  ? "text-yellow-500"
                  : "text-gray-400 hover:text-white focus:text-white"
              }`}
              aria-label="Support"
              aria-current={pathname === "/cafeteria/support" ? "page" : undefined}
            >
              <HelpCircle className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs mt-1">Support</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Notifications Panel */}
      <MobileNotificationsPanel
        isOpen={isMobileNotificationsOpen}
        onClose={() => {
          setIsMobileNotificationsOpen(false)
          announce("Notifications panel closed")
        }}
      />

      {/* Keyboard shortcuts help dialog */}
      <div id="keyboard-shortcuts" className="sr-only" role="region" aria-label="Keyboard shortcuts">
        <h2>Keyboard Shortcuts</h2>
        <ul>
          <li>Press / to focus search</li>
          <li>Press Alt+d to go to dashboard</li>
          <li>Press Alt+m to go to menu</li>
          <li>Press Alt+o to go to orders</li>
          <li>Press Alt+i to go to inventory</li>
          <li>Press Alt+s to go to support</li>
          <li>Press Escape to close dialogs</li>
        </ul>
      </div>

      {/* Screen reader announcer */}
      <div id="sr-announcer" className="sr-only" aria-live="assertive" aria-atomic="true"></div>
    </>
  )
}
