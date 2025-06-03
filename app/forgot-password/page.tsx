"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { requestPasswordReset } from "../actions/reset-password"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      const result = await requestPasswordReset(formData)

      if (result.success) {
        setIsSubmitted(true)
        toast({
          title: "Success",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
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

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Enhanced floating gradient orbs for forgot password page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb w-96 h-96 bg-gradient-to-br from-blue-500/15 to-indigo-500/15 -top-48 -right-48 animate-float"></div>
        <div className="floating-orb w-80 h-80 bg-gradient-to-br from-emerald-500/12 to-teal-500/12 -bottom-40 -left-40 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="floating-orb w-72 h-72 bg-gradient-to-br from-purple-500/10 to-violet-500/10 top-1/2 right-1/4 animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="floating-orb w-64 h-64 bg-gradient-to-br from-amber-500/8 to-orange-500/8 top-1/4 left-1/3 animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <header className="container mx-auto py-6 px-4 flex justify-center items-center relative z-10 animate-slide-in-up">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold gradient-text animate-shimmer">UniEats</span>
          <span className="text-slate-400">Password Reset</span>
        </div>
      </header>

      <div className="container mx-auto py-8 flex-grow flex items-center justify-center relative z-10 animate-fade-in">
        <Card className="w-full max-w-md modern-card glass-effect hover-lift">
          <CardHeader className="relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-xl"></div>
            <CardTitle className="text-2xl font-bold gradient-text animate-shimmer">Reset Password</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your email address and we'll send you instructions to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="glass-effect border-white/20 hover:border-blue-500/50 focus:border-blue-500/50 btn-modern pl-10 transition-all duration-300"
                      required
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white btn-modern shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Instructions...
                    </>
                  ) : (
                    "Send Reset Instructions"
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-md p-4 text-green-400">
                  <p className="font-medium">Reset instructions sent!</p>
                  <p className="text-sm mt-1">
                    We've sent password reset instructions to <strong>{email}</strong>. Please check your inbox.
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">
                    Didn't receive an email? Check your spam folder or{" "}
                    <button
                      type="button"
                      onClick={() => setIsSubmitted(false)}
                      className="text-yellow-500 hover:underline"
                    >
                      try again
                    </button>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-0">
            <div className="w-full border-t border-gray-700 my-2"></div>
            <Link href="/" className="inline-flex items-center justify-center text-sm text-yellow-500 hover:underline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
      <footer className="container mx-auto py-6 px-4 mt-auto border-t border-slate-800 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-2 md:mb-0">
            <span className="text-lg font-bold gradient-text">UniEats</span>
            <span className="text-xs ml-2 text-slate-400">v1.0</span>
          </div>
          <div className="text-sm text-slate-400">© 2025 UniEats. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
