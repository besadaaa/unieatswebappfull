import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { PreloadProvider } from "@/components/providers/preload-provider"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UniEats - Campus Food Ordering System",
  description: "A platform for cafeteria owners and administrators to manage student pickup orders across campus.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`} suppressHydrationWarning>
        <PreloadProvider>
          <ThemeProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
            {/* Floating Background Orbs */}
            <div className="fixed inset-0 pointer-events-none">
              <div className="floating-orb w-96 h-96 bg-gradient-to-r from-orange-500/20 to-amber-500/20 -top-48 -left-48 animate-float"></div>
              <div className="floating-orb w-80 h-80 bg-gradient-to-r from-blue-500/15 to-indigo-500/15 top-1/3 -right-40 animate-float" style={{ animationDelay: '2s' }}></div>
              <div className="floating-orb w-72 h-72 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 -bottom-36 left-1/4 animate-float" style={{ animationDelay: '4s' }}></div>
              <div className="floating-orb w-64 h-64 bg-gradient-to-r from-purple-500/15 to-pink-500/15 top-1/4 left-1/2 animate-float" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10">
              {children}
            </div>
          </div>
          <Toaster />
          </ThemeProvider>
        </PreloadProvider>
      </body>
    </html>
  )
}
