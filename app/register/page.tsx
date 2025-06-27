"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
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
        title: "Registration successful!",
        description: "Your account has been created and your cafeteria application submitted for review. You can login once an admin approves your application.",
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

        {/* Document Requirements Notice */}
        <div className="max-w-4xl mx-auto mb-6">
          <Card className="modern-card glass-effect border border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="h-3 w-3 text-amber-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-amber-400 text-sm">Required Documents for Cafeteria Registration</h3>
                  <p className="text-xs text-slate-300">
                    After completing this registration, please send the following documents to{" "}
                    <a href="mailto:unieats2025@gmail.com" className="text-amber-400 hover:text-amber-300 underline">
                      unieats2025@gmail.com
                    </a>
                    :
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1 ml-4">
                    <li>• A copy of your commercial registration (السجل التجاري)</li>
                    <li>• A copy of your tax card (البطاقة الضريبية)</li>
                    <li>• Food safety or health clearance (إن وجد)</li>
                    <li>• Owner's or legal representative's ID copy</li>
                  </ul>
                  <p className="text-xs text-slate-400 italic">
                    Please ensure all documents are valid and clearly scanned.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                      className="glass-effect border-white/20 hover:border-purple-500/50 focus:border-purple-500/50 btn-modern h-10 text-sm transition-all duration-300"
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
                      className="glass-effect border-white/20 hover:border-purple-500/50 focus:border-purple-500/50 btn-modern h-10 text-sm transition-all duration-300"
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
                      className="glass-effect border-white/20 hover:border-amber-500/50 focus:border-amber-500/50 btn-modern h-10 text-sm transition-all duration-300"
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
                      className="glass-effect border-white/20 hover:border-cyan-500/50 focus:border-cyan-500/50 btn-modern h-10 text-sm transition-all duration-300"
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
                        className="glass-effect border-white/20 hover:border-rose-500/50 focus:border-rose-500/50 btn-modern h-10 text-sm pr-10 transition-all duration-300"
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
                      className="glass-effect border-white/20 hover:border-rose-500/50 focus:border-rose-500/50 btn-modern h-10 text-sm transition-all duration-300"
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
                      className="glass-effect border-white/20 hover:border-indigo-500/50 focus:border-indigo-500/50 btn-modern h-10 text-sm transition-all duration-300"
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
                    <p className="text-xs text-slate-400">
                      By creating an account, you agree to our{" "}
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="text-amber-400 hover:text-amber-300 hover:underline transition-colors duration-300">
                            Terms of Service
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Terms of Service</DialogTitle>
                            <DialogDescription>
                              Please read our terms of service carefully.
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="h-[60vh] pr-4">
                            <div className="space-y-4 text-sm">
                              <section>
                                <h3 className="font-semibold text-lg mb-2">1. Acceptance of Terms</h3>
                                <p>
                                  By accessing and using UniEats, you accept and agree to be bound by the terms and provision of this agreement.
                                  If you do not agree to abide by the above, please do not use this service.
                                </p>
                              </section>

                              <section>
                                <h3 className="font-semibold text-lg mb-2">2. Service Description</h3>
                                <p>
                                  UniEats is a food ordering platform that connects university students with campus cafeterias.
                                  We provide a convenient way to browse menus, place orders, and manage food delivery within university premises.
                                </p>
                              </section>

                              <section>
                                <h3 className="font-semibold text-lg mb-2">3. User Accounts</h3>
                                <p>
                                  To use our service, you must create an account with accurate information. You are responsible for maintaining
                                  the confidentiality of your account credentials and for all activities that occur under your account.
                                </p>
                              </section>

                              <section>
                                <h3 className="font-semibold text-lg mb-2">4. Orders and Payments</h3>
                                <p>
                                  All orders placed through UniEats are subject to acceptance by the respective cafeteria.
                                  Payment must be completed at the time of order placement. We accept various payment methods including
                                  credit cards, debit cards, and digital wallets.
                                </p>
                              </section>

                              <section>
                                <h3 className="font-semibold text-lg mb-2">5. Cancellation and Refunds</h3>
                                <p>
                                  Orders may be cancelled within 5 minutes of placement. Refunds will be processed according to our refund policy.
                                  In case of order issues, please contact our support team for assistance.
                                </p>
                              </section>

                              <section>
                                <h3 className="font-semibold text-lg mb-2">6. User Conduct</h3>
                                <p>
                                  Users must not use the platform for any unlawful purposes or in any way that could damage, disable,
                                  or impair the service. Harassment of cafeteria staff or other users is strictly prohibited.
                                </p>
                              </section>

                              <section>
                                <h3 className="font-semibold text-lg mb-2">7. Intellectual Property</h3>
                                <p>
                                  All content on UniEats, including logos, text, images, and software, is the property of UniEats or its licensors
                                  and is protected by copyright and other intellectual property laws.
                                </p>
                              </section>

                              <section>
                                <h3 className="font-semibold text-lg mb-2">8. Limitation of Liability</h3>
                                <p>
                                  UniEats shall not be liable for any indirect, incidental, special, or consequential damages arising from
                                  the use of our service. Our liability is limited to the amount paid for the specific order in question.
                                </p>
                              </section>

                              <section>
                                <h3 className="font-semibold text-lg mb-2">9. Changes to Terms</h3>
                                <p>
                                  We reserve the right to modify these terms at any time. Users will be notified of significant changes,
                                  and continued use of the service constitutes acceptance of the modified terms.
                                </p>
                              </section>

                              <section>
                                <h3 className="font-semibold text-lg mb-2">10. Contact Information</h3>
                                <p>
                                  For questions about these Terms of Service, please contact us at:
                                  <br />
                                  Email: unieats2025@gmail.com
                                  <br />
                                  Phone: 01225958284
                                </p>
                              </section>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>{" "}
                      and{" "}
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="text-amber-400 hover:text-amber-300 hover:underline transition-colors duration-300">
                            Privacy Policy
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Privacy Policy</DialogTitle>
                            <DialogDescription>
                              Learn how we collect, use, and protect your personal information.
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="h-[60vh] pr-4">
                            <div className="space-y-4 text-sm">
                              <section>
                                <h3 className="font-semibold text-lg mb-2">1. Information We Collect</h3>
                                <p>
                                  We collect information you provide directly to us, such as when you create an account, place an order,
                                  or contact us for support. This includes your name, email address, phone number, payment information,
                                  and order history.
                                </p>
                              </section>

                              <section>
                                <h3 className="font-semibold text-lg mb-2">2. How We Use Your Information</h3>
                                <p>
                                  We use your information to provide and improve our services, process orders, communicate with you,
                                  and ensure the security of our platform. We may also use your information for analytics and
                                  to personalize your experience.
                                </p>
                              </section>

                              <section>
                                <h3 className="font-semibold text-lg mb-2">3. Information Sharing</h3>
                                <p>
                                  We do not sell, trade, or rent your personal information to third parties. We may share your information
                                  with cafeteria partners to fulfill orders, with service providers who assist us in operating our platform,
                                  and as required by law.
                                </p>
                              </section>

                              <section>
                                <h3 className="font-semibold text-lg mb-2">4. Data Security</h3>
                                <p>
                                  We implement appropriate security measures to protect your personal information against unauthorized access,
                                  alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
                                </p>
                              </section>

                              <section>
                                <h3 className="font-semibold text-lg mb-2">5. Cookies and Tracking</h3>
                                <p>
                                  We use cookies and similar technologies to enhance your experience, analyze usage patterns,
                                  and provide personalized content. You can control cookie settings through your browser preferences.
                                </p>
                              </section>

                              <section>
                                <h3 className="font-semibold text-lg mb-2">6. Your Rights</h3>
                                <p>
                                  You have the right to access, update, or delete your personal information. You may also opt out of
                                  certain communications from us. To exercise these rights, please contact us using the information below.
                                </p>
                              </section>

                              <section>
                                <h3 className="font-semibold text-lg mb-2">7. Data Retention</h3>
                                <p>
                                  We retain your personal information for as long as necessary to provide our services and comply with
                                  legal obligations. Order history and account information may be retained for up to 7 years for
                                  business and legal purposes.
                                </p>
                              </section>

                              <section>
                                <h3 className="font-semibold text-lg mb-2">8. Children's Privacy</h3>
                                <p>
                                  Our service is intended for university students who are typically 18 years or older.
                                  We do not knowingly collect personal information from children under 13.
                                </p>
                              </section>

                              <section>
                                <h3 className="font-semibold text-lg mb-2">9. Changes to Privacy Policy</h3>
                                <p>
                                  We may update this Privacy Policy from time to time. We will notify you of any material changes
                                  by posting the new policy on our platform and updating the effective date.
                                </p>
                              </section>

                              <section>
                                <h3 className="font-semibold text-lg mb-2">10. Contact Us</h3>
                                <p>
                                  If you have any questions about this Privacy Policy, please contact us at:
                                  <br />
                                  Email: unieats2025@gmail.com
                                  <br />
                                  Phone: 01225958284
                                  <br />
                                  <br />
                                  UniEats Team: Besada Zekry, Youssef Gomaa, Aya Awad, Mahmoud Mamesh, Ahmed Alaa, Mohamed Nasser, Abdullah Ahmed
                                </p>
                              </section>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      .
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <div className="text-xs text-slate-300">
                    Already have an account?{" "}
                    <a
                      href="/"
                      className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors duration-300"
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
