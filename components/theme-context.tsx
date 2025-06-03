"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { getCurrentUser, getUserThemePreference, saveUserThemePreference, getSystemSetting } from "@/lib/supabase"

type Theme = "dark" | "light"

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("light")
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Set mounted to true after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const initializeTheme = async () => {
      try {
        // Get current user
        const user = await getCurrentUser()

        if (user) {
          // User is logged in, try to get their preference from Supabase
          const userPreference = await getUserThemePreference(user.id)

          if (userPreference) {
            setTheme(userPreference.theme)
            applyTheme(userPreference.theme)
          } else {
            // No user preference found, get default from system settings
            const defaultTheme = await getSystemSetting('default_theme') || 'light'
            setTheme(defaultTheme)
            applyTheme(defaultTheme)

            // Save the default theme as user's preference
            await saveUserThemePreference(user.id, defaultTheme)
          }
        } else {
          // User not logged in, check localStorage or system preference
          const savedTheme = localStorage.getItem("unieats-theme") as "dark" | "light" | null

          if (savedTheme) {
            setTheme(savedTheme)
            applyTheme(savedTheme)
          } else {
            // Check system preference
            const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
            const defaultTheme = await getSystemSetting('default_theme') || (systemPrefersDark ? 'dark' : 'light')

            setTheme(defaultTheme)
            applyTheme(defaultTheme)
            localStorage.setItem("unieats-theme", defaultTheme)
          }
        }
      } catch (error) {
        console.error('Error initializing theme:', error)
        // Fallback to localStorage or default
        const savedTheme = localStorage.getItem("unieats-theme") as "dark" | "light" | null
        const fallbackTheme = savedTheme || "light"
        setTheme(fallbackTheme)
        applyTheme(fallbackTheme)
      } finally {
        setIsLoading(false)
      }
    }

    initializeTheme()
  }, [mounted])

  const applyTheme = (newTheme: Theme) => {
    if (!mounted) return // Don't apply theme until after hydration

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
    } else {
      document.documentElement.classList.remove("dark")
      document.documentElement.classList.add("light")
    }

    // Also set the data attribute for better CSS targeting
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const handleThemeChange = async (newTheme: Theme) => {
    try {
      setTheme(newTheme)
      applyTheme(newTheme)

      // Save to localStorage for non-authenticated users
      if (typeof window !== "undefined") {
        localStorage.setItem("unieats-theme", newTheme)
      }

      // Save to Supabase if user is logged in
      const user = await getCurrentUser()
      if (user) {
        await saveUserThemePreference(user.id, newTheme)
      }
    } catch (error) {
      console.error('Error saving theme preference:', error)
      // Still apply the theme locally even if saving fails
      setTheme(newTheme)
      applyTheme(newTheme)
      if (typeof window !== "undefined") {
        localStorage.setItem("unieats-theme", newTheme)
      }
    }
  }

  // Prevent hydration mismatch by not rendering theme-dependent content until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: "light", setTheme: handleThemeChange, isLoading: true }}>
        {children}
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleThemeChange, isLoading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
