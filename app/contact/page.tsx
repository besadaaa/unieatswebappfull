"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MapPin, Phone, Facebook, Twitter, Instagram, Linkedin } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import Image from "next/image"
import { submitContactForm, getPublicSystemSettings } from "@/lib/supabase"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [systemSettings, setSystemSettings] = useState<Record<string, any>>({})

  useEffect(() => {
    const loadSystemSettings = async () => {
      try {
        const settings = await getPublicSystemSettings()
        setSystemSettings(settings)
      } catch (error) {
        console.error('Error loading system settings:', error)
      }
    }

    loadSystemSettings()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Get user's IP and user agent for analytics
      const userAgent = navigator.userAgent

      const success = await submitContactForm({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        user_agent: userAgent
      })

      if (success) {
        toast({
          title: "Message Sent",
          description: "Thank you for your message. We'll get back to you soon!",
        })
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error submitting contact form:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Enhanced floating gradient orbs for contact page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb w-96 h-96 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 -top-48 -right-48 animate-float"></div>
        <div className="floating-orb w-80 h-80 bg-gradient-to-br from-purple-500/12 to-violet-500/12 -bottom-40 -left-40 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="floating-orb w-72 h-72 bg-gradient-to-br from-amber-500/10 to-orange-500/10 top-1/2 right-1/4 animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="floating-orb w-64 h-64 bg-gradient-to-br from-blue-500/8 to-indigo-500/8 top-1/4 left-1/3 animate-float" style={{ animationDelay: '1s' }}></div>
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
            href="/"
            className="text-slate-300 hover:text-blue-400 transition-all duration-300 text-sm md:text-base hover:scale-105 font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/about"
            className="text-slate-300 hover:text-purple-400 transition-all duration-300 text-sm md:text-base hover:scale-105 font-medium"
          >
            About Us
          </Link>
          <Link
            href="/register"
            className="text-slate-300 hover:text-amber-400 transition-all duration-300 text-sm md:text-base hover:scale-105 font-medium"
          >
            Register
          </Link>
        </nav>
      </header>

      <main className="w-full px-4 py-4 flex-1 flex flex-col relative z-10 animate-fade-in">
        <h2 className="text-3xl font-bold mb-6 text-center gradient-text animate-shimmer">Contact Us</h2>

        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-4xl modern-card glass-effect hover-lift">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <form className="space-y-3" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label htmlFor="name" className="text-xs font-medium">
                          Name
                        </label>
                        <Input
                          id="name"
                          placeholder="Your name"
                          className="glass-effect border-white/20 hover:border-emerald-500/50 focus:border-emerald-500/50 btn-modern h-10 text-sm transition-all duration-300"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="email" className="text-xs font-medium">
                          Email
                        </label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Your email"
                          className={isDark ? "bg-[#1a1f36] border-0 h-8 text-sm" : "bg-white h-8 text-sm"}
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="subject" className="text-xs font-medium">
                        Subject
                      </label>
                      <Input
                        id="subject"
                        placeholder="How can we help?"
                        className={isDark ? "bg-[#1a1f36] border-0 h-8 text-sm" : "bg-white h-8 text-sm"}
                        value={formData.subject}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="message" className="text-xs font-medium">
                        Message
                      </label>
                      <Textarea
                        id="message"
                        placeholder="Your message"
                        className={isDark ? "bg-[#1a1f36] border-0 h-20 text-sm" : "bg-white h-20 text-sm"}
                        value={formData.message}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      size="sm"
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white btn-modern shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-lg ${isDark ? "bg-[#0f1424]" : "bg-gray-50 border"}`}>
                      <div className="flex items-start">
                        <div
                          className={`w-8 h-8 rounded-full ${isDark ? "bg-yellow-500/20 text-yellow-500" : "bg-yellow-500/20 text-yellow-500"} flex items-center justify-center mr-2`}
                        >
                          <Mail size={16} />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">Email</h4>
                          <p className={`text-xs ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                            {systemSettings.support_email || "support@unieats.com"}
                          </p>
                          <p className={`text-xs ${isDark ? "text-gray-300" : "text-gray-600"}`}>info@unieats.com</p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg ${isDark ? "bg-[#0f1424]" : "bg-gray-50 border"}`}>
                      <div className="flex items-start">
                        <div
                          className={`w-8 h-8 rounded-full ${isDark ? "bg-yellow-500/20 text-yellow-500" : "bg-yellow-500/20 text-yellow-500"} flex items-center justify-center mr-2`}
                        >
                          <Phone size={16} />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">Phone</h4>
                          <p className={`text-xs ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                            {systemSettings.company_phone || "+20 123 456 7890"}
                          </p>
                          <p className={`text-xs ${isDark ? "text-gray-300" : "text-gray-600"}`}>+20 098 765 4321</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg ${isDark ? "bg-[#0f1424]" : "bg-gray-50 border"}`}>
                    <div className="flex items-start">
                      <div
                        className={`w-8 h-8 rounded-full ${isDark ? "bg-yellow-500/20 text-yellow-500" : "bg-yellow-500/20 text-yellow-500"} flex items-center justify-center mr-2`}
                      >
                        <MapPin size={16} />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Office</h4>
                        <p className={`text-xs ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                          {systemSettings.company_address || "123 University Avenue, Cairo, Egypt 12345"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg ${isDark ? "bg-[#0f1424]" : "bg-gray-50 border"}`}>
                    <h4 className="font-medium text-sm mb-1">Office Hours</h4>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div>Monday - Friday</div>
                      <div>9:00 AM - 6:00 PM</div>
                      <div>Saturday</div>
                      <div>10:00 AM - 4:00 PM</div>
                      <div>Sunday</div>
                      <div>Closed</div>
                    </div>
                  </div>

                  <div className="flex justify-center space-x-2 mt-2">
                    {systemSettings.social_facebook && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 rounded-full p-0"
                        onClick={() => window.open(systemSettings.social_facebook, '_blank')}
                      >
                        <Facebook size={16} />
                        <span className="sr-only">Facebook</span>
                      </Button>
                    )}
                    {systemSettings.social_twitter && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 rounded-full p-0"
                        onClick={() => window.open(systemSettings.social_twitter, '_blank')}
                      >
                        <Twitter size={16} />
                        <span className="sr-only">Twitter</span>
                      </Button>
                    )}
                    {systemSettings.social_instagram && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 rounded-full p-0"
                        onClick={() => window.open(systemSettings.social_instagram, '_blank')}
                      >
                        <Instagram size={16} />
                        <span className="sr-only">Instagram</span>
                      </Button>
                    )}
                    {systemSettings.social_linkedin && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8 rounded-full p-0"
                        onClick={() => window.open(systemSettings.social_linkedin, '_blank')}
                      >
                        <Linkedin size={16} />
                        <span className="sr-only">LinkedIn</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
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
