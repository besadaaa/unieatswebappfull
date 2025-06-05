"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "@/components/theme-context"
import { useEffect, useRef, useState } from "react"
import { getCurrentUser, trackNavigation, getPublicSystemSettings } from "@/lib/supabase"

export function Navigation() {
  const pathname = usePathname()
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const previousPathname = useRef<string>("")
  const [platformName, setPlatformName] = useState("UniEats")

  // Track navigation and load platform settings
  useEffect(() => {
    const handleNavigation = async () => {
      try {
        // Track navigation if there was a previous page
        if (previousPathname.current && previousPathname.current !== pathname) {
          const user = await getCurrentUser()
          await trackNavigation(
            user?.id || null,
            previousPathname.current,
            pathname
          )
        }

        // Load platform name from system settings
        const settings = await getPublicSystemSettings()
        if (settings.platform_name) {
          setPlatformName(settings.platform_name)
        }

        previousPathname.current = pathname
      } catch (error) {
        console.error('Error in navigation tracking:', error)
      }
    }

    handleNavigation()
  }, [pathname])

  return (
    <header className={`w-full px-4 py-3 ${isDark ? "bg-[#1a1f36]" : "bg-white shadow-sm"}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <div className="w-10 h-10 relative">
            <Image src="/logo.png" alt="UniEats Logo" width={40} height={40} className="object-contain" priority />
          </div>
          <Link href="/" className="text-2xl font-bold">
            {platformName}
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-6 mr-4">
            <Link
              href="/about"
              className={`transition-colors ${
                pathname === "/about"
                  ? isDark
                    ? "text-yellow-500"
                    : "text-yellow-500 font-medium"
                  : isDark
                    ? "hover:text-yellow-500"
                    : "hover:text-yellow-500"
              }`}
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className={`transition-colors ${
                pathname === "/contact"
                  ? isDark
                    ? "text-yellow-500"
                    : "text-yellow-500 font-medium"
                  : isDark
                    ? "hover:text-yellow-500"
                    : "hover:text-yellow-500"
              }`}
            >
              Contact Us
            </Link>
            <Link
              href="/register"
              className={`transition-colors ${
                pathname === "/register"
                  ? isDark
                    ? "text-yellow-500"
                    : "text-yellow-500 font-medium"
                  : isDark
                    ? "hover:text-yellow-500"
                    : "hover:text-yellow-500"
              }`}
            >
              Register
            </Link>
            <Link
              href="/"
              className={`transition-colors ${
                pathname === "/"
                  ? isDark
                    ? "text-yellow-500"
                    : "text-yellow-500 font-medium"
                  : isDark
                    ? "hover:text-yellow-500"
                    : "hover:text-yellow-500"
              }`}
            >
              Login
            </Link>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
