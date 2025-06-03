"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Coffee, MapPin, FileText } from "lucide-react"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    ownerFirstName: "",
    ownerLastName: "",
    email: "",
    phone: "",
    cafeteriaName: "",
    cafeteriaLocation: "",
    cafeteriaDescription: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      })
      return
    }

    if (!formData.agreeToTerms) {
      toast({
        title: "Terms agreement required",
        description: "You must agree to the terms and conditions.",
        variant: "destructive",
      })
      return
    }

    if (
      !formData.ownerFirstName ||
      !formData.ownerLastName ||
      !formData.email ||
      !formData.cafeteriaName ||
      !formData.cafeteriaLocation
    ) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    toast({
      title: "Submitting application",
      description: "Please wait while we process your cafeteria application...",
    })

    try {
      // Submit application to API
      const response = await fetch('/api/cafeteria-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit application')
      }

      setIsSubmitting(false)
      toast({
        title: "Application submitted successfully!",
        description: "Your cafeteria application has been submitted for review. You will be notified once it's processed.",
      })

      // Redirect to login page
      router.push("/")
    } catch (error: any) {
      setIsSubmitting(false)
      toast({
        title: "Application failed",
        description: error.message || "There was a problem submitting your application. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Enhanced floating gradient orbs for register page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb w-96 h-96 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 -top-48 -right-48 animate-float"></div>
        <div className="floating-orb w-80 h-80 bg-gradient-to-br from-blue-500/12 to-indigo-500/12 -bottom-40 -left-40 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="floating-orb w-72 h-72 bg-gradient-to-br from-purple-500/10 to-violet-500/10 top-1/2 right-1/4 animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="floating-orb w-64 h-64 bg-gradient-to-br from-amber-500/8 to-orange-500/8 top-1/4 left-1/3 animate-float" style={{ animationDelay: '1s' }}></div>
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
            href="/"
            className="text-slate-300 hover:text-blue-400 transition-all duration-300 text-sm md:text-base hover:scale-105 font-medium"
          >
            Sign In
          </Link>
        </nav>
      </header>

      <main className="w-full px-4 py-4 flex-1 flex flex-col relative z-10 animate-fade-in">
        <h2 className="text-3xl font-bold mb-6 text-center gradient-text animate-shimmer">Register Your Cafeteria</h2>

        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-4xl modern-card glass-effect hover-lift relative">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl"></div>
              <div className="flex justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center">
                    <Coffee className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-violet-500/30 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-purple-400" />
                  </div>
                </div>
                <div className="text-sm">Join UniEats to connect with students and grow your business.</div>
              </div>

              <form className="space-y-0" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="cafeteriaName" className="text-xs">
                      Cafeteria Name
                    </Label>
                    <Input
                      id="cafeteriaName"
                      placeholder="Enter cafeteria name"
                      className="glass-effect border-white/20 hover:border-emerald-500/50 focus:border-emerald-500/50 btn-modern h-10 text-sm transition-all duration-300"
                      value={formData.cafeteriaName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cafeteriaLocation" className="text-xs">
                      Location on Campus
                    </Label>
                    <Input
                      id="cafeteriaLocation"
                      placeholder="Enter location"
                      className="glass-effect border-white/20 hover:border-blue-500/50 focus:border-blue-500/50 btn-modern h-10 text-sm transition-all duration-300"
                      value={formData.cafeteriaLocation}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ownerFirstName" className="text-xs">
                      First Name
                    </Label>
                    <Input
                      id="ownerFirstName"
                      placeholder="Your first name"
                      className={`${isDark ? "bg-[#0f1424] border-gray-700" : "bg-white"} h-8 text-sm`}
                      value={formData.ownerFirstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ownerLastName" className="text-xs">
                      Last Name
                    </Label>
                    <Input
                      id="ownerLastName"
                      placeholder="Your last name"
                      className={`${isDark ? "bg-[#0f1424] border-gray-700" : "bg-white"} h-8 text-sm`}
                      value={formData.ownerLastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Your email"
                      className={`${isDark ? "bg-[#0f1424] border-gray-700" : "bg-white"} h-8 text-sm`}
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="phone" className="text-xs">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Your phone"
                      className={`${isDark ? "bg-[#0f1424] border-gray-700" : "bg-white"} h-8 text-sm`}
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password" className="text-xs">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create password"
                        className={`${isDark ? "bg-[#0f1424] border-gray-700" : "bg-white"} h-8 text-sm pr-8`}
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-8 w-8"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        <span className="sr-only">Toggle password visibility</span>
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirmPassword" className="text-xs">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      className={`${isDark ? "bg-[#0f1424] border-gray-700" : "bg-white"} h-8 text-sm`}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label htmlFor="cafeteriaDescription" className="text-xs">
                      Description
                    </Label>
                    <Input
                      id="cafeteriaDescription"
                      placeholder="Briefly describe your cafeteria"
                      className={`${isDark ? "bg-[#0f1424] border-gray-700" : "bg-white"} h-8 text-sm`}
                      value={formData.cafeteriaDescription}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start space-x-2 mt-2">
                  <Checkbox
                    id="agreeToTerms"
                    className="mt-1"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, agreeToTerms: checked === true }))}
                  />
                  <div>
                    <label
                      htmlFor="agreeToTerms"
                      className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the terms and conditions
                    </label>
                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      By creating an account, you agree to our{" "}
                      <a
                        href="#"
                        className={isDark ? "text-yellow-500 hover:underline" : "text-yellow-500 hover:underline"}
                      >
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a
                        href="#"
                        className={isDark ? "text-yellow-500 hover:underline" : "text-yellow-500 hover:underline"}
                      >
                        Privacy Policy
                      </a>
                      .
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <div className="text-xs">
                    Already have an account?{" "}
                    <a
                      href="/"
                      className={isDark ? "text-yellow-500 hover:underline" : "text-yellow-500 hover:underline"}
                    >
                      Sign in
                    </a>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white btn-modern shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Register Cafeteria"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
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
