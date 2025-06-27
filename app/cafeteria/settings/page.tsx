"use client"


import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { Store, MessageSquare, RefreshCw, Save } from "lucide-react"

import { toast } from "@/components/ui/use-toast"
import { CafeteriaPageHeader } from "@/components/cafeteria/page-header"
import SettingsService from "@/lib/settings-service"
import { supabase } from "@/lib/supabase"

type BusinessHours = {
  day: string
  openTime: string
  closeTime: string
}

const STATUS_OPTIONS = [
  {
    value: 'open',
    label: 'Open',
    description: 'Accepting orders normally',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '🟢'
  },
  {
    value: 'busy',
    label: 'Busy',
    description: 'High demand - longer wait times',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: '🟡'
  },
  {
    value: 'temporarily_closed',
    label: 'Temporarily Closed',
    description: 'Brief closure - will reopen soon',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '⏸️'
  },
  {
    value: 'closed',
    label: 'Closed',
    description: 'Not accepting orders',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '🔴'
  }
]

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [cafeteriaData, setCafeteriaData] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedStatus, setSelectedStatus] = useState('open')
  const [statusMessage, setStatusMessage] = useState('')
  const [isSavingStatus, setIsSavingStatus] = useState(false)
  const [settings, setSettings] = useState({
    general: {
      onlineOrdering: true,
      autoAcceptOrders: false,
      preparationTime: "15",
    },
    notifications: {
      newOrders: true,
      lowStock: true,
      reviews: true,
      marketing: false,
    },
    advanced: {
      analyticsTracking: true,
      autoUpdate: false,
      dataRetention: "90",
    },
  })

  // Load settings from database
  useEffect(() => {
    loadSettings()
  }, [])

  // Load business hours when cafeteria data is available
  useEffect(() => {
    if (cafeteriaData) {
      loadBusinessHours()
    }
  }, [cafeteriaData])

  const loadSettings = async () => {
    try {
      setLoading(true)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('No authenticated user found')
      }
      setCurrentUser(user)

      // Get cafeteria for this user
      const { data: cafeteria, error: cafeteriaError } = await supabase
        .from('cafeterias')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (cafeteriaError || !cafeteria) {
        console.warn('No cafeteria found for this user')
      } else {
        setCafeteriaData(cafeteria)
        setSelectedStatus(cafeteria.operational_status || 'open')
        setStatusMessage(cafeteria.status_message || '')
      }

      // Get real settings from Supabase with better error handling
      let userSettings = null
      let cafeteriaSettings = null

      // Skip trying to load from non-existent tables for now
      // We'll use the cafeterias table for all settings
      console.log('Loading settings from cafeterias table only')

      // Set settings from database or defaults
      // For now, use cafeteria table for all settings until we create proper tables
      setSettings({
        general: {
          onlineOrdering: cafeteria?.online_ordering ?? true,
          autoAcceptOrders: cafeteria?.auto_accept_orders ?? false,
          preparationTime: String(cafeteria?.default_preparation_time ?? 15),
        },
        notifications: {
          newOrders: true, // Default values for now
          lowStock: true,
          reviews: true,
          marketing: false,
        },
        advanced: {
          analyticsTracking: true, // Default values for now
          autoUpdate: false,
          dataRetention: "90",
        },
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

  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([
    { day: "Monday", openTime: "8:00", closeTime: "20:00" },
    { day: "Tuesday", openTime: "8:00", closeTime: "20:00" },
    { day: "Wednesday", openTime: "8:00", closeTime: "20:00" },
    { day: "Thursday", openTime: "8:00", closeTime: "20:00" },
    { day: "Friday", openTime: "8:00", closeTime: "20:00" },
    { day: "Saturday", openTime: "10:00", closeTime: "18:00" },
    { day: "Sunday", openTime: "10:00", closeTime: "16:00" },
  ])

  // Load business hours from Supabase (simplified version)
  const loadBusinessHours = async () => {
    if (!cafeteriaData) return

    try {
      // Try to load business hours from the cafeterias table
      if (cafeteriaData.business_hours) {
        const savedHours = JSON.parse(cafeteriaData.business_hours)
        if (Array.isArray(savedHours) && savedHours.length === 7) {
          setBusinessHours(savedHours)
          return
        }
      }

      // If no saved hours, keep the default hours
      console.log('Using default business hours')
    } catch (error) {
      console.error('Error loading business hours:', error)
      // Keep default hours if there's an error
    }
  }

  // Save business hours to Supabase (simplified version)
  const saveBusinessHours = async () => {
    if (!cafeteriaData) return

    try {
      // For now, save business hours as JSON in the cafeterias table
      const hoursJson = JSON.stringify(businessHours)

      const { error } = await supabase
        .from('cafeterias')
        .update({
          business_hours: hoursJson,
          updated_at: new Date().toISOString()
        })
        .eq('id', cafeteriaData.id)

      if (error) {
        console.error('Error saving business hours:', error)
        toast({
          title: "Error",
          description: "Failed to save business hours. Please try again.",
          variant: "destructive",
        })
      } else {
        // Update local state
        setCafeteriaData(prev => ({ ...prev, business_hours: hoursJson }))
        toast({
          title: "Business hours updated",
          description: "Your business hours have been saved successfully.",
        })
      }
    } catch (error) {
      console.error('Error saving business hours:', error)
      toast({
        title: "Error",
        description: "Failed to save business hours. Please try again.",
        variant: "destructive",
      })
    }
  }

  const updateStatus = async (newStatus: string, message: string = '') => {
    if (!cafeteriaData || !currentUser) return

    setIsSavingStatus(true)
    try {
      const response = await fetch('/api/cafeteria/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cafeteria_id: cafeteriaData.id,
          status: newStatus,
          message: message,
          user_id: currentUser.id
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setSelectedStatus(newStatus)
        setStatusMessage(message)
        setCafeteriaData(prev => prev ? {
          ...prev,
          operational_status: newStatus,
          status_message: message,
          status_updated_at: new Date().toISOString()
        } : null)

        toast({
          title: "Success",
          description: "Cafeteria status updated successfully",
        })
      } else {
        throw new Error(data.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      })
    } finally {
      setIsSavingStatus(false)
    }
  }

  const getCurrentStatusOption = () => {
    return STATUS_OPTIONS.find(option => option.value === selectedStatus) || STATUS_OPTIONS[0]
  }

  const handleSwitchChange = async (section: string, setting: string, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [setting]: checked,
      },
    }))

    // Save to Supabase based on section
    try {
      if (!currentUser) {
        throw new Error('No authenticated user')
      }

      if (section === 'general' && cafeteriaData) {
        // Save general settings to cafeterias table for now
        try {
          const updateData: any = {}
          if (setting === 'onlineOrdering') updateData.online_ordering = checked
          if (setting === 'autoAcceptOrders') updateData.auto_accept_orders = checked

          const { error } = await supabase
            .from('cafeterias')
            .update({
              ...updateData,
              updated_at: new Date().toISOString()
            })
            .eq('id', cafeteriaData.id)

          if (error) {
            console.error('Error saving cafeteria settings:', error)
          } else {
            // Update local state
            setCafeteriaData(prev => ({ ...prev, ...updateData }))
          }
        } catch (error) {
          console.error('Error saving settings:', error)
        }
      } else {
        // For notification and advanced settings, just update local state for now
        console.log(`Setting ${setting} in ${section} updated to ${checked} (local only)`)
      }

      toast({
        title: "Setting updated",
        description: `${setting.charAt(0).toUpperCase() + setting.slice(1).replace(/([A-Z])/g, " $1")} has been ${checked ? "enabled" : "disabled"}.`,
      })
    } catch (error) {
      console.error('Error saving setting:', error)
      toast({
        title: "Error",
        description: "Failed to save setting. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSelectChange = async (section: string, setting: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [setting]: value,
      },
    }))

    // Save to Supabase
    try {
      if (!currentUser) {
        throw new Error('No authenticated user')
      }

      if (section === 'general' && cafeteriaData) {
        // Save general settings to cafeterias table for now
        try {
          const updateData: any = {}
          if (setting === 'preparationTime') updateData.default_preparation_time = parseInt(value)

          const { error } = await supabase
            .from('cafeterias')
            .update({
              ...updateData,
              updated_at: new Date().toISOString()
            })
            .eq('id', cafeteriaData.id)

          if (error) {
            console.error('Error saving cafeteria settings:', error)
          } else {
            // Update local state
            setCafeteriaData(prev => ({ ...prev, ...updateData }))
          }
        } catch (error) {
          console.error('Error saving settings:', error)
        }
      } else {
        // For advanced settings, just update local state for now
        console.log(`Setting ${setting} in ${section} updated to ${value} (local only)`)
      }

      toast({
        title: "Setting updated",
        description: `${setting.charAt(0).toUpperCase() + setting.slice(1).replace(/([A-Z])/g, " $1")} has been set to ${value}.`,
      })
    } catch (error) {
      console.error('Error saving setting:', error)
      toast({
        title: "Error",
        description: "Failed to save setting. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBusinessHourChange = async (index: number, field: keyof BusinessHours, value: string) => {
    const updatedHours = [...businessHours]
    updatedHours[index] = {
      ...updatedHours[index],
      [field]: value,
    }
    setBusinessHours(updatedHours)

    // Auto-save to Supabase
    setTimeout(() => {
      saveBusinessHours()
    }, 1000) // Debounce for 1 second
  }

  const setHoursForAllDays = async () => {
    const mondayHours = businessHours[0]
    const updatedHours = businessHours.map((day) => ({
      ...day,
      openTime: mondayHours.openTime,
      closeTime: mondayHours.closeTime,
    }))

    setBusinessHours(updatedHours)

    // Save to Supabase
    await saveBusinessHours()

    toast({
      title: "Business hours updated",
      description: "Business hours have been set for all days.",
    })
  }

  const handleDeleteAccount = () => {
    const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.")

    if (confirmed) {
      toast({
        title: "Account deletion requested",
        description: "Your account deletion request has been submitted. An administrator will contact you shortly.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex-1 p-6 animate-fade-in">
      <CafeteriaPageHeader
        title="Settings"
        subtitle="Configure your cafeteria preferences and settings"
      />

      <Tabs defaultValue="general" className="space-y-6 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          <TabsList className="grid w-full grid-cols-3 glass-effect border border-white/20 p-1 h-auto rounded-xl">
            <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">General</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">Notifications</TabsTrigger>
            <TabsTrigger value="advanced" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {/* Operational Status Section */}
            {cafeteriaData && (
              <Card className="modern-card glass-effect hover-lift animate-slide-in-up stagger-1 border-2">
                <CardHeader>
                  <CardTitle className="gradient-text flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Operational Status
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Manage your cafeteria's current operational status and customer messaging
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Status Display */}
                  <div className="p-4 rounded-lg border-2 border-dashed bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getCurrentStatusOption().icon}</span>
                        <div>
                          <Badge className={getCurrentStatusOption().color}>
                            {getCurrentStatusOption().label}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {getCurrentStatusOption().description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Last updated</p>
                        <p>{cafeteriaData.status_updated_at ? new Date(cafeteriaData.status_updated_at).toLocaleString() : 'Never'}</p>
                      </div>
                    </div>

                    {statusMessage && (
                      <div className="mt-4 p-3 bg-background rounded border">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <p className="text-sm">{statusMessage}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Status Buttons */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {STATUS_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={selectedStatus === option.value ? 'default' : 'outline'}
                        className="h-auto p-4 flex flex-col items-center gap-2 transition-all duration-300 hover:scale-105"
                        onClick={() => updateStatus(option.value, option.description)}
                        disabled={isSavingStatus}
                      >
                        <span className="text-lg">{option.icon}</span>
                        <span className="font-medium text-xs">{option.label}</span>
                      </Button>
                    ))}
                  </div>

                  {/* Custom Message */}
                  <div className="space-y-2">
                    <Label htmlFor="status-message" className="text-sm font-medium">Custom Status Message</Label>
                    <Textarea
                      id="status-message"
                      placeholder="Add a message for customers (e.g., 'Back in 30 minutes', 'Limited menu available')"
                      value={statusMessage}
                      onChange={(e) => setStatusMessage(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                    <Button
                      onClick={() => updateStatus(selectedStatus, statusMessage)}
                      disabled={isSavingStatus}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                    >
                      {isSavingStatus ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Update Status & Message
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="modern-card glass-effect hover-lift animate-slide-in-up stagger-1 border-2">
              <CardHeader>
                <CardTitle className="gradient-text">General Settings</CardTitle>
                <CardDescription className="text-slate-400">Manage your account preferences and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border-2 border-dashed bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                  <div className="space-y-0.5">
                    <Label htmlFor="ordering" className="text-base font-medium">Online Ordering</Label>
                    <p className="text-sm text-muted-foreground">Allow customers to place orders online</p>
                  </div>
                  <Switch
                    id="ordering"
                    checked={settings.general.onlineOrdering}
                    onCheckedChange={(checked) => handleSwitchChange("general", "onlineOrdering", checked)}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border-2 border-dashed bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoAccept" className="text-base font-medium">Auto-Accept Orders</Label>
                    <p className="text-sm text-muted-foreground">Automatically accept new orders</p>
                  </div>
                  <Switch
                    id="autoAccept"
                    checked={settings.general.autoAcceptOrders}
                    onCheckedChange={(checked) => handleSwitchChange("general", "autoAcceptOrders", checked)}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>

                <div className="space-y-3 p-4 rounded-lg border-2 border-dashed bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                  <Label htmlFor="preparationTime" className="text-base font-medium">Default Preparation Time</Label>
                  <Select
                    value={settings.general.preparationTime}
                    onValueChange={(value) => handleSelectChange("general", "preparationTime", value)}
                  >
                    <SelectTrigger id="preparationTime" className="bg-background border-2">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="20">20 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="modern-card glass-effect hover-lift animate-slide-in-up stagger-2 border-2">
              <CardHeader>
                <CardTitle className="gradient-text">Business Hours</CardTitle>
                <CardDescription className="text-slate-400">Set your operating hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {businessHours.map((hours, index) => (
                  <div key={hours.day} className="grid grid-cols-3 gap-4 p-4 rounded-lg border-2 border-dashed bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600 dark:text-slate-300">Day</Label>
                      <div className="font-semibold text-base">{hours.day}</div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`openTime-${index}`} className="text-sm font-medium text-slate-600 dark:text-slate-300">Opening Time</Label>
                      <Select
                        value={hours.openTime}
                        onValueChange={(value) => handleBusinessHourChange(index, "openTime", value)}
                      >
                        <SelectTrigger id={`openTime-${index}`} className="bg-background border-2">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7:00">7:00 AM</SelectItem>
                          <SelectItem value="8:00">8:00 AM</SelectItem>
                          <SelectItem value="9:00">9:00 AM</SelectItem>
                          <SelectItem value="10:00">10:00 AM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`closeTime-${index}`} className="text-sm font-medium text-slate-600 dark:text-slate-300">Closing Time</Label>
                      <Select
                        value={hours.closeTime}
                        onValueChange={(value) => handleBusinessHourChange(index, "closeTime", value)}
                      >
                        <SelectTrigger id={`closeTime-${index}`} className="bg-background border-2">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="17:00">5:00 PM</SelectItem>
                          <SelectItem value="18:00">6:00 PM</SelectItem>
                          <SelectItem value="20:00">8:00 PM</SelectItem>
                          <SelectItem value="22:00">10:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full glass-effect border-2 hover:border-emerald-500/50 btn-modern" onClick={setHoursForAllDays}>
                  Set Hours for All Days
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card className="modern-card glass-effect hover-lift animate-slide-in-up stagger-2 border-2">
              <CardHeader>
                <CardTitle className="gradient-text">Notification Preferences</CardTitle>
                <CardDescription className="text-slate-400">Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border-2 border-dashed bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                  <div className="space-y-0.5">
                    <Label htmlFor="newOrders" className="text-base font-medium">New Orders</Label>
                    <p className="text-sm text-muted-foreground">Get notified when a new order is placed</p>
                  </div>
                  <Switch
                    id="newOrders"
                    checked={settings.notifications.newOrders}
                    onCheckedChange={(checked) => handleSwitchChange("notifications", "newOrders", checked)}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border-2 border-dashed bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                  <div className="space-y-0.5">
                    <Label htmlFor="lowStock" className="text-base font-medium">Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when inventory items are running low</p>
                  </div>
                  <Switch
                    id="lowStock"
                    checked={settings.notifications.lowStock}
                    onCheckedChange={(checked) => handleSwitchChange("notifications", "lowStock", checked)}
                    className="data-[state=checked]:bg-orange-500"
                  />
                </div>

                <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border-2 border-dashed bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                  <div className="space-y-0.5">
                    <Label htmlFor="reviews" className="text-base font-medium">Customer Reviews</Label>
                    <p className="text-sm text-muted-foreground">Get notified when you receive a new review</p>
                  </div>
                  <Switch
                    id="reviews"
                    checked={settings.notifications.reviews}
                    onCheckedChange={(checked) => handleSwitchChange("notifications", "reviews", checked)}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border-2 border-dashed bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing" className="text-base font-medium">Marketing Updates</Label>
                    <p className="text-sm text-muted-foreground">Receive marketing tips and platform updates</p>
                  </div>
                  <Switch
                    id="marketing"
                    checked={settings.notifications.marketing}
                    onCheckedChange={(checked) => handleSwitchChange("notifications", "marketing", checked)}
                    className="data-[state=checked]:bg-purple-500"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card className="modern-card glass-effect hover-lift animate-slide-in-up stagger-3 border-2">
              <CardHeader>
                <CardTitle className="gradient-text">Advanced Settings</CardTitle>
                <CardDescription className="text-slate-400">Configure advanced settings for your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border-2 border-dashed bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                  <div className="space-y-0.5">
                    <Label htmlFor="analytics" className="text-base font-medium">Analytics Tracking</Label>
                    <p className="text-sm text-muted-foreground">Allow us to collect anonymous usage data</p>
                  </div>
                  <Switch
                    id="analytics"
                    checked={settings.advanced.analyticsTracking}
                    onCheckedChange={(checked) => handleSwitchChange("advanced", "analyticsTracking", checked)}
                    className="data-[state=checked]:bg-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border-2 border-dashed bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoUpdate" className="text-base font-medium">Automatic Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically update menu items when inventory changes
                    </p>
                  </div>
                  <Switch
                    id="autoUpdate"
                    checked={settings.advanced.autoUpdate}
                    onCheckedChange={(checked) => handleSwitchChange("advanced", "autoUpdate", checked)}
                    className="data-[state=checked]:bg-teal-500"
                  />
                </div>

                <div className="space-y-3 p-4 rounded-lg border-2 border-dashed bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                  <Label htmlFor="dataRetention" className="text-base font-medium">Data Retention</Label>
                  <Select
                    value={settings.advanced.dataRetention}
                    onValueChange={(value) => handleSelectChange("advanced", "dataRetention", value)}
                  >
                    <SelectTrigger id="dataRetention" className="bg-background border-2">
                      <SelectValue placeholder="Select retention period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t border-white/20">
                  <Button variant="destructive" onClick={handleDeleteAccount} className="w-full glass-effect border-2 hover:border-red-500/50">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

      </Tabs>
    </div>
  )
}
