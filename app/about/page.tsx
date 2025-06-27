"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "@/components/ui/use-toast"
import { getPublicSystemSettings } from "@/lib/supabase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// No open positions currently
const mockCareers: any[] = []

export default function AboutPage() {
  const [loading, setLoading] = useState(false)
  const [showCareers, setShowCareers] = useState(false)
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

  const handleViewCareers = () => {
    setLoading(true)
    // Simulate loading
    setTimeout(() => {
      setLoading(false)
      setShowCareers(true)
      toast({
        title: "Careers Loaded",
        description: "We have several open positions available.",
      })
    }, 800)
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Enhanced floating gradient orbs for about page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-orb w-96 h-96 bg-gradient-to-br from-blue-500/15 to-indigo-500/15 -top-48 -right-48 animate-float"></div>
        <div className="floating-orb w-80 h-80 bg-gradient-to-br from-purple-500/12 to-violet-500/12 -bottom-40 -left-40 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="floating-orb w-72 h-72 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 top-1/2 right-1/4 animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="floating-orb w-64 h-64 bg-gradient-to-br from-amber-500/8 to-orange-500/8 top-1/4 left-1/3 animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      <header className="container mx-auto py-6 px-4 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 relative">
            <Image src="/logo.png" alt="UniEats Logo" width={48} height={48} className="object-contain" priority />
          </div>
          <h1 className="text-2xl font-bold gradient-text">UniEats</h1>
        </div>

        <nav className="flex items-center gap-6 animate-slide-in-right">
          <Link
            href="/"
            className="text-slate-300 hover:text-blue-400 transition-all duration-300 text-sm md:text-base hover:scale-105 font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/contact"
            className="text-slate-300 hover:text-emerald-400 transition-all duration-300 text-sm md:text-base hover:scale-105 font-medium"
          >
            Contact Us
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
        <h2 className="text-3xl font-bold mb-6 text-center gradient-text animate-shimmer">
          About {systemSettings.platform_name || "UniEats"}
        </h2>

        <Tabs defaultValue="about" className="flex-1 flex flex-col animate-slide-in-up">
          <TabsList className="mx-auto mb-6 glass-effect border border-white/20 p-1 h-auto rounded-xl">
            <TabsTrigger value="about" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">About</TabsTrigger>
            <TabsTrigger value="values" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">Our Values</TabsTrigger>
            <TabsTrigger value="team" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">Our Team</TabsTrigger>
            <TabsTrigger value="impact" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">Our Impact</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-3xl modern-card glass-effect hover-lift">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-2xl"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div>
                    <p className="text-sm mb-2">
                      {systemSettings.platform_name || "UniEats"} is a revolutionary campus food ordering system designed to streamline the way students,
                      faculty, and staff order food from cafeterias across university campuses.
                    </p>
                    <p className="text-sm mb-2">
                      Founded in 2025, our mission is to reduce wait times, minimize food waste, and create a more
                      efficient dining experience for everyone on campus.
                    </p>
                    <p className="text-sm">
                      Our platform connects cafeteria owners with their customers, providing real-time updates on
                      orders, inventory management, and analytics to help cafeterias better serve their communities.
                    </p>
                  </div>
                  <div className="h-40 overflow-hidden rounded-lg">
                    <img
                      src="/diverse-group-city.png"
                      alt="The UniEats Team"
                      className="w-full h-full object-cover"
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-center">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white btn-modern shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={handleViewCareers}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "View Careers"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="values" className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-3xl modern-card glass-effect hover-lift">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl"></div>
                <h3 className="text-xl font-bold mb-6 gradient-text">Our Core Values</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 rounded-lg glass-effect border border-white/10">
                    <div className="w-12 h-12 rounded-full mx-auto bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 flex items-center justify-center mb-3 text-lg font-bold">
                      1
                    </div>
                    <h4 className="font-bold text-base mb-2 text-white">Efficiency</h4>
                    <p className="text-sm text-slate-300">
                      We create systems that save time and reduce waste.
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg glass-effect border border-white/10">
                    <div className="w-12 h-12 rounded-full mx-auto bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 flex items-center justify-center mb-3 text-lg font-bold">
                      2
                    </div>
                    <h4 className="font-bold text-base mb-2 text-white">Accessibility</h4>
                    <p className="text-sm text-slate-300">
                      Food services should be accessible to everyone.
                    </p>
                  </div>
                  <div className="text-center p-4 rounded-lg glass-effect border border-white/10">
                    <div className="w-12 h-12 rounded-full mx-auto bg-gradient-to-br from-purple-500/20 to-violet-500/20 text-purple-400 flex items-center justify-center mb-3 text-lg font-bold">
                      3
                    </div>
                    <h4 className="font-bold text-base mb-2 text-white">Innovation</h4>
                    <p className="text-sm text-slate-300">
                      We continuously improve with cutting-edge technology.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-3xl modern-card glass-effect hover-lift overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-purple-500/20 to-violet-500/20 relative">
                <img
                  src="/diverse-group-city.png"
                  alt="The UniEats Team"
                  className="w-full h-full object-cover opacity-80"
                  style={{ width: 'auto', height: 'auto' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
              </div>
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-full blur-2xl"></div>
                <h3 className="text-xl font-bold mb-4 gradient-text">Our Team</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  UniEats was founded by a group of university students who experienced firsthand the challenges of
                  campus dining. Our dedicated team includes:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="text-slate-300">• Besada Zekry</div>
                  <div className="text-slate-300">• Youssef Gomaa</div>
                  <div className="text-slate-300">• Aya Awad</div>
                  <div className="text-slate-300">• Mahmoud Mamesh</div>
                  <div className="text-slate-300">• Ahmed Alaa</div>
                  <div className="text-slate-300">• Mohamed Nasser</div>
                  <div className="text-slate-300">• Abdullah Ahmed</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="impact" className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-3xl modern-card glass-effect hover-lift">
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-2xl"></div>
                <h3 className="text-xl font-bold mb-6 gradient-text">Our Vision</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg glass-effect border border-white/10">
                    <h4 className="font-bold text-white mb-2">🎯 Mission</h4>
                    <p className="text-sm text-slate-300">To revolutionize campus dining by connecting students with their favorite meals while empowering local cafeterias to thrive in the digital age.</p>
                  </div>
                  <div className="p-4 rounded-lg glass-effect border border-white/10">
                    <h4 className="font-bold text-white mb-2">🚀 Goals</h4>
                    <p className="text-sm text-slate-300">Reduce wait times, minimize food waste, and create a seamless ordering experience for university communities across Egypt.</p>
                  </div>
                  <div className="p-4 rounded-lg glass-effect border border-white/10">
                    <h4 className="font-bold text-white mb-2">🌟 Future</h4>
                    <p className="text-sm text-slate-300">Expanding to universities nationwide, building the largest campus food network in Egypt with innovative features and sustainable practices.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Careers Modal */}
        {showCareers && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900/95 border border-white/20 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto glass-effect">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold gradient-text">Open Positions</h2>
                  <Button variant="ghost" onClick={() => setShowCareers(false)} className="hover:bg-white/10">
                    ✕
                  </Button>
                </div>

                <div className="space-y-6">
                  {mockCareers.length > 0 ? (
                    mockCareers.map((career) => (
                      <Card key={career.id} className="modern-card glass-effect border border-white/10">
                        <CardContent className="p-6">
                          <h3 className="text-xl font-bold mb-2 text-white">{career.title}</h3>
                          <div className="flex items-center text-sm text-slate-400 mb-4">
                            <span>{career.department}</span>
                            <span className="mx-2">•</span>
                            <span>{career.location}</span>
                          </div>
                          <p className="mb-4 text-slate-300">{career.description}</p>
                          <div className="mb-4">
                            <strong className="block mb-2 text-white">Requirements:</strong>
                            <p className="text-slate-300">{career.requirements}</p>
                          </div>
                          <Button
                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white btn-modern"
                            onClick={() => {
                              toast({
                                title: "Application Started",
                                description: `You've started an application for ${career.title}.`,
                              })
                            }}
                          >
                            Apply Now
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="modern-card glass-effect border border-white/10">
                      <CardContent className="p-8 text-center">
                        <div className="text-6xl mb-4">💼</div>
                        <h3 className="text-xl font-bold mb-2 text-white">No Open Positions</h3>
                        <p className="text-slate-300 mb-4">
                          We don't have any open positions at the moment, but we're always growing!
                          Check back later or follow us on social media for updates.
                        </p>
                        <p className="text-sm text-slate-400">
                          Interested in joining our team? Send us your resume at{" "}
                          <a href="mailto:unieats2025@gmail.com" className="text-blue-400 hover:text-blue-300">
                            unieats2025@gmail.com
                          </a>
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
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
