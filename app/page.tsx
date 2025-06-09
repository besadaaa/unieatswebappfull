"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { signIn } from "./actions/auth"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

export default function LandingPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("cafeteria")

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)

    // Simulate network request
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const result = await signIn(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })

        if (result.redirect) {
          router.push(result.redirect)
        }
      } else {
        // Check if user is suspended
        if (result.suspended) {
          toast({
            title: "Account Suspended",
            description: result.message,
            variant: "destructive",
          })
          // Redirect to suspension page after a delay
          setTimeout(() => {
            router.push('/suspended')
          }, 2000)
        } else {
          toast({
            title: "Error",
            description: result.message || "Invalid credentials. Please try again.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = () => {
    toast({
      title: "Password Reset",
      description: "Redirecting to password reset page...",
    })
    router.push("/forgot-password")
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Enhanced floating gradient orbs for login page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb w-96 h-96 bg-gradient-to-br from-amber-500/15 to-orange-500/15 -top-48 -right-48 animate-float"></div>
        <div className="floating-orb w-80 h-80 bg-gradient-to-br from-emerald-500/12 to-teal-500/12 -bottom-40 -left-40 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="floating-orb w-72 h-72 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 top-1/2 right-1/4 animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="floating-orb w-64 h-64 bg-gradient-to-br from-purple-500/8 to-violet-500/8 top-1/4 left-1/3 animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <header className="container mx-auto py-6 px-4 flex justify-between items-center relative z-10 animate-slide-in-up">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 relative animate-bounce-in">
            <Image src="/logo.png" alt="UniEats Logo" width={48} height={48} className="object-contain" priority />
          </div>
          <h1 className="text-2xl font-bold gradient-text animate-shimmer">UniEats</h1>
        </div>
        <nav className="flex items-center gap-6 animate-slide-in-right">
          <Link
            href="/about"
            className="text-slate-300 hover:text-amber-400 transition-all duration-300 text-sm md:text-base hover:scale-105 font-medium"
          >
            About Us
          </Link>
          <Link
            href="/contact"
            className="text-slate-300 hover:text-emerald-400 transition-all duration-300 text-sm md:text-base hover:scale-105 font-medium"
          >
            Contact Us
          </Link>
          <Link
            href="/register"
            className="text-slate-300 hover:text-blue-400 transition-all duration-300 text-sm md:text-base hover:scale-105 font-medium"
          >
            Register
          </Link>
        </nav>
      </header>

      <main className="container mx-auto py-12 px-4 flex-grow flex items-center relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full max-w-7xl mx-auto animate-fade-in">
          <div className="text-center lg:text-left space-y-8 animate-slide-in-left">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">
                Campus <span className="gradient-text animate-shimmer">pickup</span> made simple
              </h2>
              <p className="text-lg text-slate-300">
                A powerful platform for cafeteria owners and administrators to manage student pickup orders across
                campus.
              </p>
            </div>

            <div className="grid gap-4 max-w-md mx-auto lg:mx-0">
              <Card className="modern-card glass-effect hover-lift animate-scale-in stagger-1">
                <CardContent className="p-4 flex items-start gap-4 relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center text-amber-400 animate-float">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-package"
                    >
                      <path d="m7.5 4.27 9 5.15" />
                      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                      <path d="m3.3 7 8.7 5 8.7-5" />
                      <path d="M12 22V12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white">Quick Pickup</h3>
                    <p className="text-sm text-slate-400">
                      Skip the lines and grab your food when it's ready
                    </p>
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-xl"></div>
                </CardContent>
              </Card>

              <Card className="modern-card glass-effect hover-lift animate-scale-in stagger-2">
                <CardContent className="p-4 flex items-start gap-4 relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center text-emerald-400 animate-float" style={{ animationDelay: '0.5s' }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-clock"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white">Time Slots</h3>
                    <p className="text-sm text-slate-400">
                      Schedule your pickup at your convenience
                    </p>
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-xl"></div>
                </CardContent>
              </Card>

              <Card className="modern-card glass-effect hover-lift animate-scale-in stagger-3">
                <CardContent className="p-4 flex items-start gap-4 relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center text-blue-400 animate-float" style={{ animationDelay: '1s' }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-list-checks"
                    >
                      <path d="m3 17 2 2 4-4" />
                      <path d="m3 7 2 2 4-4" />
                      <path d="M13 6h8" />
                      <path d="M13 12h8" />
                      <path d="M13 18h8" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white">Easy Orders</h3>
                    <p className="text-sm text-slate-400">
                      Simple ordering process with just a few taps
                    </p>
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-xl"></div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
              <p className="text-sm mb-3 text-slate-400">
                Trusted by cafeterias across campus
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 glass-effect border border-white/20 rounded-full text-xs shadow-md hover:border-amber-500/50 transition-all duration-300">
                  EUI Cafeteria
                </span>
                <span className="px-4 py-2 glass-effect border border-white/20 rounded-full text-xs shadow-md hover:border-emerald-500/50 transition-all duration-300">
                  NTI Cafeteria
                </span>
                <span className="px-4 py-2 glass-effect border border-white/20 rounded-full text-xs shadow-md hover:border-blue-500/50 transition-all duration-300">
                  Beanos
                </span>
                <span className="px-4 py-2 glass-effect border border-white/20 rounded-full text-xs shadow-md hover:border-purple-500/50 transition-all duration-300">
                  Cinnamon Factory
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center animate-slide-in-right">
            <Card className="w-full max-w-md modern-card glass-effect hover-lift relative">
              <CardContent className="p-8 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl"></div>
                <Tabs defaultValue="cafeteria" value={activeTab} onValueChange={setActiveTab} className="w-full relative z-10">
                  <TabsList className="grid w-full grid-cols-2 mb-8 glass-effect border border-white/20 p-1 h-auto rounded-xl">
                    <TabsTrigger
                      value="cafeteria"
                      className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5 py-3"
                    >
                      Cafeteria Owner
                    </TabsTrigger>
                    <TabsTrigger
                      value="admin"
                      className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5 py-3"
                    >
                      Admin
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="cafeteria">
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2 text-center mb-6">
                        <h3 className="text-2xl font-bold gradient-text">Cafeteria Owner Login</h3>
                        <p className="text-sm text-slate-400">
                          Sign in to manage your cafeteria operations
                        </p>
                      </div>

                      <input type="hidden" name="role" value="cafeteria_manager" />

                      <div className="space-y-2">
                        <Label htmlFor="cafeteria-email" className="text-base text-slate-300">
                          Email
                        </Label>
                        <Input
                          id="cafeteria-email"
                          name="email"
                          defaultValue="ayaawad@unieats.com"
                          placeholder="ayaawad@unieats.com"
                          className="glass-effect border-white/20 hover:border-amber-500/50 focus:border-amber-500/50 btn-modern h-12 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cafeteria-password" className="text-base text-slate-300">
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="cafeteria-password"
                            name="password"
                            defaultValue="UniEats2025_Cafe"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pr-10 glass-effect border-white/20 hover:border-amber-500/50 focus:border-amber-500/50 btn-modern h-12 transition-all duration-300"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full hover:bg-white/10"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">Toggle password visibility</span>
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="cafeteria-remember" />
                          <label
                            htmlFor="cafeteria-remember"
                            className="text-sm text-slate-400"
                          >
                            Remember me
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-sm text-amber-400 hover:text-amber-300 transition-colors duration-300"
                        >
                          Forgot password?
                        </button>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white h-12 mt-6 text-base font-medium btn-modern shadow-lg hover:shadow-xl transition-all duration-300"
                        disabled={isLoading}
                      >
                        {isLoading ? "Signing in..." : "Sign in"}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="ml-2 h-4 w-4"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </Button>
                    </form>
                  </TabsContent>
                  <TabsContent value="admin">
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2 text-center mb-6">
                        <h3 className="text-2xl font-bold gradient-text">Admin Login</h3>
                        <p className="text-sm text-slate-400">
                          Sign in to access system administration
                        </p>
                      </div>

                      <input type="hidden" name="role" value="admin" />

                      <div className="space-y-2">
                        <Label htmlFor="admin-email" className="text-base text-slate-300">
                          Email
                        </Label>
                        <Input
                          id="admin-email"
                          name="email"
                          defaultValue="admin@unieats.com"
                          placeholder="admin@unieats.com"
                          className="glass-effect border-white/20 hover:border-emerald-500/50 focus:border-emerald-500/50 btn-modern h-12 transition-all duration-300"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="admin-password" className="text-base text-slate-300">
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="admin-password"
                            name="password"
                            defaultValue="UniEats2025_Admin"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pr-10 glass-effect border-white/20 hover:border-emerald-500/50 focus:border-emerald-500/50 btn-modern h-12 transition-all duration-300"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full hover:bg-white/10"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">Toggle password visibility</span>
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="admin-remember" />
                          <label
                            htmlFor="admin-remember"
                            className="text-sm text-slate-400"
                          >
                            Remember me
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors duration-300"
                        >
                          Forgot password?
                        </button>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white h-12 mt-6 text-base font-medium btn-modern shadow-lg hover:shadow-xl transition-all duration-300"
                        disabled={isLoading}
                      >
                        {isLoading ? "Signing in..." : "Sign in"}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="ml-2 h-4 w-4"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="container mx-auto py-6 px-4 mt-auto border-t border-slate-800 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-2 md:mb-0">
            <div className="w-6 h-6 relative">
              <Image src="/logo.png" alt="UniEats Logo" width={24} height={24} className="object-contain" />
            </div>
            <span className="text-lg font-bold gradient-text">UniEats</span>
            <span className="text-xs ml-2 text-slate-400">v1.0</span>
          </div>
          <div className="text-sm text-slate-400">
            © 2025 UniEats. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
