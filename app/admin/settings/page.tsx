"use client"

import { useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Globe, Bell, Shield, CreditCard, Mail, Users, Clock } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { PageHeader } from "@/components/admin/page-header"
import { PageHeader } from "@/components/admin/page-header"

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general")
  const [formData, setFormData] = useState({
    platformName: "UniEats",
    platformUrl: "https://unieats.com",
    supportEmail: "support@unieats.com",
    timezone: "Africa/Cairo",
    dateFormat: "YYYY-MM-DD",
    maintenanceMode: false,
    newRegistrations: true,
    cafeteriaApplications: true,
    autoApprove: true,
    platformFee: "10",
    maintenanceMessage: "We're currently performing scheduled maintenance. Please check back soon.",
  })

  // Update the handleSaveChanges function to properly handle saving settings

  const handleSaveChanges = () => {
    // Show loading state
    toast({
      title: "Saving settings",
      description: "Please wait while we update your settings...",
    })

    // Simulate API call
    setTimeout(() => {
      try {
        // In a real app, this would send the formData to an API

        toast({
          title: "Settings saved",
          description: "Your settings have been updated successfully.",
        })
      } catch (error) {
        toast({
          title: "Error saving settings",
          description: "There was a problem saving your settings. Please try again.",
          variant: "destructive",
        })
      }
    }, 1500)
  }

  // Update the handleToggleChange function to properly handle toggle changes
  const handleToggleChange = (setting: string) => {
    // Show loading state
    toast({
      title: "Updating setting",
      description: `Changing ${setting} status...`,
    })

    // Simulate API call
    setTimeout(() => {
      try {
        setFormData((prev) => ({
          ...prev,
          [setting]: !prev[setting as keyof typeof prev],
        }))

        toast({
          title: `${setting.charAt(0).toUpperCase() + setting.slice(1)} updated`,
          description: `${setting.charAt(0).toUpperCase() + setting.slice(1)} has been ${formData[setting as keyof typeof formData] ? "disabled" : "enabled"}.`,
        })
      } catch (error) {
        toast({
          title: "Error updating setting",
          description: `There was a problem updating ${setting}. Please try again.`,
          variant: "destructive",
        })
      }
    }, 1000)
  }

  return (
    <div className="p-6 animate-fade-in">
        <Card className="modern-card glass-effect hover-lift">
          <CardContent className="p-8 relative">
            <div className="mb-8 animate-slide-in-up">
              <h2 className="text-2xl font-bold gradient-text animate-shimmer">System Settings</h2>
              <p className="text-sm text-slate-400 mt-2">Configure platform settings and preferences</p>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl"></div>

            <div className="mb-8 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
              <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="glass-effect border border-white/20 p-1 h-auto rounded-xl grid grid-cols-7 gap-1">
                  <TabsTrigger
                    value="general"
                    className="px-3 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    General
                  </TabsTrigger>
                  <TabsTrigger
                    value="notifications"
                    className="px-3 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="px-3 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Security
                  </TabsTrigger>
                  <TabsTrigger
                    value="payment"
                    className="px-3 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Payment
                  </TabsTrigger>
                  <TabsTrigger
                    value="email"
                    className="px-3 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger
                    value="users"
                    className="px-3 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Users
                  </TabsTrigger>
                  <TabsTrigger
                    value="maintenance"
                    className="px-3 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Maintenance
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">General Settings</h3>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="platform-name">Platform Name</Label>
                          <Input
                            id="platform-name"
                            value={formData.platformName}
                            onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
                            className="bg-[#0f1424] border-gray-700 focus-visible:ring-1 focus-visible:ring-gray-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="platform-url">Platform URL</Label>
                          <Input
                            id="platform-url"
                            value={formData.platformUrl}
                            onChange={(e) => setFormData({ ...formData, platformUrl: e.target.value })}
                            className="bg-[#0f1424] border-gray-700 focus-visible:ring-1 focus-visible:ring-gray-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="support-email">Support Email</Label>
                          <Input
                            id="support-email"
                            value={formData.supportEmail}
                            onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                            className="bg-[#0f1424] border-gray-700 focus-visible:ring-1 focus-visible:ring-gray-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="timezone">Default Timezone</Label>
                          <Select
                            value={formData.timezone}
                            onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                          >
                            <SelectTrigger className="bg-[#0f1424] border-gray-700">
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Africa/Cairo">Africa/Cairo (GMT+2)</SelectItem>
                              <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                              <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                              <SelectItem value="Asia/Tokyo">Asia/Tokyo (GMT+9)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="date-format">Date Format</Label>
                          <Select
                            value={formData.dateFormat}
                            onValueChange={(value) => setFormData({ ...formData, dateFormat: value })}
                          >
                            <SelectTrigger className="bg-[#0f1424] border-gray-700">
                              <SelectValue placeholder="Select date format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                              <SelectItem value="DD-MMM-YYYY">DD-MMM-YYYY</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Platform Settings</h3>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                            <p className="text-sm text-gray-400">Put the platform in maintenance mode</p>
                          </div>
                          <Switch
                            id="maintenance-mode"
                            checked={formData.maintenanceMode}
                            onCheckedChange={() => handleToggleChange("maintenanceMode")}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="new-registrations">Allow New Registrations</Label>
                            <p className="text-sm text-gray-400">Allow new users to register</p>
                          </div>
                          <Switch
                            id="new-registrations"
                            checked={formData.newRegistrations}
                            onCheckedChange={() => handleToggleChange("newRegistrations")}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="cafeteria-applications">Allow Cafeteria Applications</Label>
                            <p className="text-sm text-gray-400">Allow new cafeteria applications</p>
                          </div>
                          <Switch
                            id="cafeteria-applications"
                            checked={formData.cafeteriaApplications}
                            onCheckedChange={() => handleToggleChange("cafeteriaApplications")}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="auto-approve">Auto-Approve Orders</Label>
                            <p className="text-sm text-gray-400">Automatically approve new orders</p>
                          </div>
                          <Switch
                            id="auto-approve"
                            checked={formData.autoApprove}
                            onCheckedChange={() => handleToggleChange("autoApprove")}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="platform-fee">Platform Fee (%)</Label>
                          <Input
                            id="platform-fee"
                            value={formData.platformFee}
                            onChange={(e) => setFormData({ ...formData, platformFee: e.target.value })}
                            type="number"
                            min="0"
                            max="100"
                            className="bg-[#0f1424] border-gray-700 focus-visible:ring-1 focus-visible:ring-gray-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="maintenance-message">Maintenance Message</Label>
                          <Textarea
                            id="maintenance-message"
                            value={formData.maintenanceMessage}
                            onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
                            className="bg-[#0f1424] border-gray-700 focus-visible:ring-1 focus-visible:ring-gray-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Other tab contents would go here */}
              </Tabs>
            </div>

            <div className="mt-6 flex justify-end">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={handleSaveChanges}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
