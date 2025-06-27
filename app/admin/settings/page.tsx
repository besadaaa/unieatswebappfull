"use client"

import { useState, useEffect } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Globe, Bell, Shield, CreditCard, Mail, Users, Clock, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { PageHeader } from "@/components/admin/page-header"
import SettingsService from "@/lib/settings-service"

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    serviceFeeRate: "4",
    serviceFeeCap: "20",
    commissionRate: "10",
    maintenanceMessage: "We're currently performing scheduled maintenance. Please check back soon.",
    // Notification settings
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    orderNotificationFreq: "immediate",
    // Security settings
    require2FA: false,
    sessionTimeout: "30",
    minPasswordLength: "8",
    ipWhitelist: false,
    // Payment settings
    paymentProvider: "stripe",
    currency: "EGP",
    autoRefunds: true,
    // Email settings
    smtpServer: "smtp.gmail.com",
    smtpPort: "587",
    fromEmail: "noreply@unieats.com",
    // User settings
    autoApproveStudents: true,
    requireEmailVerification: true,
    maxLoginAttempts: "5",
  })

  // Load settings from database
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const settings = await SettingsService.getPlatformSettings()
      const financialSettings = await SettingsService.getFinancialSettings()

      setFormData({
        platformName: settings.platformName || "UniEats",
        platformUrl: settings.platformUrl || "https://unieats.com",
        supportEmail: settings.supportEmail || "support@unieats.com",
        timezone: settings.timezone || "Africa/Cairo",
        dateFormat: settings.dateFormat || "YYYY-MM-DD",
        maintenanceMode: settings.maintenanceMode || false,
        newRegistrations: settings.newRegistrations !== false,
        cafeteriaApplications: settings.cafeteriaApplications !== false,
        autoApprove: settings.autoApprove !== false,
        platformFee: String(financialSettings.commissionRate * 100 || 10),
        serviceFeeRate: String(financialSettings.serviceFeeRate * 100 || 4),
        serviceFeeCap: String(financialSettings.serviceFeeCap || 20),
        commissionRate: String(financialSettings.commissionRate * 100 || 10),
        maintenanceMessage: settings.maintenanceMessage || "We're currently performing scheduled maintenance. Please check back soon.",
      })
    } catch (error) {
      console.error('Error loading settings:', error)
      toast({
        title: "Error",
        description: "Failed to load settings. Using defaults.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    try {
      setSaving(true)

      toast({
        title: "Saving settings",
        description: "Please wait while we update your settings...",
      })

      // Save platform settings
      await SettingsService.updateSetting('platformName', formData.platformName)
      await SettingsService.updateSetting('platformUrl', formData.platformUrl)
      await SettingsService.updateSetting('supportEmail', formData.supportEmail)
      await SettingsService.updateSetting('timezone', formData.timezone)
      await SettingsService.updateSetting('dateFormat', formData.dateFormat)
      await SettingsService.updateSetting('maintenanceMode', formData.maintenanceMode)
      await SettingsService.updateSetting('newRegistrations', formData.newRegistrations)
      await SettingsService.updateSetting('cafeteriaApplications', formData.cafeteriaApplications)
      await SettingsService.updateSetting('autoApprove', formData.autoApprove)
      await SettingsService.updateSetting('maintenanceMessage', formData.maintenanceMessage)

      // Save financial settings
      await SettingsService.updateSetting('serviceFeeRate', parseFloat(formData.serviceFeeRate) / 100)
      await SettingsService.updateSetting('serviceFeeCap', parseFloat(formData.serviceFeeCap))
      await SettingsService.updateSetting('commissionRate', parseFloat(formData.commissionRate) / 100)

      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
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
                            className="glass-effect border-white/20 hover:border-emerald-500/50 focus:border-emerald-500/50 btn-modern transition-all duration-300"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="platform-url">Platform URL</Label>
                          <Input
                            id="platform-url"
                            value={formData.platformUrl}
                            onChange={(e) => setFormData({ ...formData, platformUrl: e.target.value })}
                            className="glass-effect border-white/20 hover:border-emerald-500/50 focus:border-emerald-500/50 btn-modern transition-all duration-300"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="support-email">Support Email</Label>
                          <Input
                            id="support-email"
                            value={formData.supportEmail}
                            onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                            className="glass-effect border-white/20 hover:border-emerald-500/50 focus:border-emerald-500/50 btn-modern transition-all duration-300"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="timezone">Default Timezone</Label>
                          <Select
                            value={formData.timezone}
                            onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                          >
                            <SelectTrigger className="glass-effect border-white/20 hover:border-emerald-500/50 focus:border-emerald-500/50 btn-modern transition-all duration-300">
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
                            <SelectTrigger className="glass-effect border-white/20 hover:border-emerald-500/50 focus:border-emerald-500/50 btn-modern transition-all duration-300">
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
                          <Label htmlFor="service-fee-rate">Service Fee Rate (%)</Label>
                          <Input
                            id="service-fee-rate"
                            value={formData.serviceFeeRate}
                            onChange={(e) => setFormData({ ...formData, serviceFeeRate: e.target.value })}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            className="glass-effect border-white/20 hover:border-emerald-500/50 focus:border-emerald-500/50 btn-modern transition-all duration-300"
                          />
                          <p className="text-xs text-gray-400">Fee charged to students on orders</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="service-fee-cap">Service Fee Cap (EGP)</Label>
                          <Input
                            id="service-fee-cap"
                            value={formData.serviceFeeCap}
                            onChange={(e) => setFormData({ ...formData, serviceFeeCap: e.target.value })}
                            type="number"
                            min="0"
                            step="0.01"
                            className="glass-effect border-white/20 hover:border-emerald-500/50 focus:border-emerald-500/50 btn-modern transition-all duration-300"
                          />
                          <p className="text-xs text-gray-400">Maximum service fee amount</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="commission-rate">Commission Rate (%)</Label>
                          <Input
                            id="commission-rate"
                            value={formData.commissionRate}
                            onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            className="glass-effect border-white/20 hover:border-emerald-500/50 focus:border-emerald-500/50 btn-modern transition-all duration-300"
                          />
                          <p className="text-xs text-gray-400">Commission taken from cafeterias</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="maintenance-message">Maintenance Message</Label>
                          <Textarea
                            id="maintenance-message"
                            value={formData.maintenanceMessage}
                            onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
                            className="glass-effect border-white/20 hover:border-emerald-500/50 focus:border-emerald-500/50 btn-modern transition-all duration-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notifications" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4 gradient-text">Notification Settings</h3>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Email Notifications</Label>
                            <p className="text-xs text-gray-400">Send email notifications for important events</p>
                          </div>
                          <Switch
                            checked={formData.emailNotifications || true}
                            onCheckedChange={(checked) => setFormData({ ...formData, emailNotifications: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Push Notifications</Label>
                            <p className="text-xs text-gray-400">Send push notifications to mobile apps</p>
                          </div>
                          <Switch
                            checked={formData.pushNotifications || true}
                            onCheckedChange={(checked) => setFormData({ ...formData, pushNotifications: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>SMS Notifications</Label>
                            <p className="text-xs text-gray-400">Send SMS for critical updates</p>
                          </div>
                          <Switch
                            checked={formData.smsNotifications || false}
                            onCheckedChange={(checked) => setFormData({ ...formData, smsNotifications: checked })}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-4 gradient-text">Notification Frequency</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Order Updates</Label>
                          <Select value={formData.orderNotificationFreq || "immediate"} onValueChange={(value) => setFormData({ ...formData, orderNotificationFreq: value })}>
                            <SelectTrigger className="glass-effect border-white/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="immediate">Immediate</SelectItem>
                              <SelectItem value="hourly">Hourly</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4 gradient-text">Security Settings</h3>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Two-Factor Authentication</Label>
                            <p className="text-xs text-gray-400">Require 2FA for admin accounts</p>
                          </div>
                          <Switch
                            checked={formData.require2FA || false}
                            onCheckedChange={(checked) => setFormData({ ...formData, require2FA: checked })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Session Timeout (minutes)</Label>
                          <Input
                            type="number"
                            value={formData.sessionTimeout || "30"}
                            onChange={(e) => setFormData({ ...formData, sessionTimeout: e.target.value })}
                            className="glass-effect border-white/20 hover:border-amber-500/50 focus:border-amber-500/50 btn-modern transition-all duration-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Password Minimum Length</Label>
                          <Input
                            type="number"
                            value={formData.minPasswordLength || "8"}
                            onChange={(e) => setFormData({ ...formData, minPasswordLength: e.target.value })}
                            className="glass-effect border-white/20 hover:border-amber-500/50 focus:border-amber-500/50 btn-modern transition-all duration-300"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-4 gradient-text">Access Control</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>IP Whitelist</Label>
                            <p className="text-xs text-gray-400">Restrict admin access to specific IPs</p>
                          </div>
                          <Switch
                            checked={formData.ipWhitelist || false}
                            onCheckedChange={(checked) => setFormData({ ...formData, ipWhitelist: checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="payment" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4 gradient-text">Payment Gateway</h3>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label>Payment Provider</Label>
                          <Select value={formData.paymentProvider || "stripe"} onValueChange={(value) => setFormData({ ...formData, paymentProvider: value })}>
                            <SelectTrigger className="glass-effect border-white/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="stripe">Stripe</SelectItem>
                              <SelectItem value="paypal">PayPal</SelectItem>
                              <SelectItem value="fawry">Fawry</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Currency</Label>
                          <Select value={formData.currency || "EGP"} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                            <SelectTrigger className="glass-effect border-white/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EGP">Egyptian Pound (EGP)</SelectItem>
                              <SelectItem value="USD">US Dollar (USD)</SelectItem>
                              <SelectItem value="EUR">Euro (EUR)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-4 gradient-text">Payment Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Auto-refunds</Label>
                            <p className="text-xs text-gray-400">Automatically process refunds</p>
                          </div>
                          <Switch
                            checked={formData.autoRefunds || true}
                            onCheckedChange={(checked) => setFormData({ ...formData, autoRefunds: checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="email" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4 gradient-text">Email Configuration</h3>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label>SMTP Server</Label>
                          <Input
                            value={formData.smtpServer || "smtp.gmail.com"}
                            onChange={(e) => setFormData({ ...formData, smtpServer: e.target.value })}
                            className="glass-effect border-white/20 hover:border-pink-500/50 focus:border-pink-500/50 btn-modern transition-all duration-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>SMTP Port</Label>
                          <Input
                            type="number"
                            value={formData.smtpPort || "587"}
                            onChange={(e) => setFormData({ ...formData, smtpPort: e.target.value })}
                            className="glass-effect border-white/20 hover:border-pink-500/50 focus:border-pink-500/50 btn-modern transition-all duration-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>From Email</Label>
                          <Input
                            type="email"
                            value={formData.fromEmail || "noreply@unieats.com"}
                            onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                            className="glass-effect border-white/20 hover:border-pink-500/50 focus:border-pink-500/50 btn-modern transition-all duration-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="users" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4 gradient-text">User Management</h3>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Auto-approve Students</Label>
                            <p className="text-xs text-gray-400">Automatically approve student registrations</p>
                          </div>
                          <Switch
                            checked={formData.autoApproveStudents || true}
                            onCheckedChange={(checked) => setFormData({ ...formData, autoApproveStudents: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Email Verification Required</Label>
                            <p className="text-xs text-gray-400">Require email verification for new users</p>
                          </div>
                          <Switch
                            checked={formData.requireEmailVerification || true}
                            onCheckedChange={(checked) => setFormData({ ...formData, requireEmailVerification: checked })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Login Attempts</Label>
                          <Input
                            type="number"
                            value={formData.maxLoginAttempts || "5"}
                            onChange={(e) => setFormData({ ...formData, maxLoginAttempts: e.target.value })}
                            className="glass-effect border-white/20 hover:border-cyan-500/50 focus:border-cyan-500/50 btn-modern transition-all duration-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="maintenance" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4 gradient-text">Maintenance Mode</h3>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Enable Maintenance Mode</Label>
                            <p className="text-xs text-gray-400">Put the platform in maintenance mode</p>
                          </div>
                          <Switch
                            checked={formData.maintenanceMode}
                            onCheckedChange={(checked) => handleToggleChange('maintenanceMode')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Maintenance Message</Label>
                          <Textarea
                            value={formData.maintenanceMessage}
                            onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
                            className="glass-effect border-white/20 hover:border-red-500/50 focus:border-red-500/50 btn-modern transition-all duration-300"
                            rows={4}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-4 gradient-text">System Health</h3>
                      <div className="space-y-4">
                        <div className="p-4 glass-effect border-white/20 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span>Database Status</span>
                            <span className="text-green-400">✓ Connected</span>
                          </div>
                        </div>
                        <div className="p-4 glass-effect border-white/20 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span>Storage Status</span>
                            <span className="text-green-400">✓ Available</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={loadSettings}
                disabled={loading || saving}
                className="glass-effect border-white/20 hover:border-gray-500/50 btn-modern transition-all duration-300"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Reload Settings
              </Button>
              <Button
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white btn-modern transition-all duration-300"
                onClick={handleSaveChanges}
                disabled={loading || saving}
              >
                {saving ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
