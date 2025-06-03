"use client"


import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

import { toast } from "@/components/ui/use-toast"

type BusinessHours = {
  day: string
  openTime: string
  closeTime: string
}

export default function SettingsPage() {
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

  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([
    { day: "Monday", openTime: "8:00", closeTime: "20:00" },
    { day: "Tuesday", openTime: "8:00", closeTime: "20:00" },
    { day: "Wednesday", openTime: "8:00", closeTime: "20:00" },
    { day: "Thursday", openTime: "8:00", closeTime: "20:00" },
    { day: "Friday", openTime: "8:00", closeTime: "20:00" },
    { day: "Saturday", openTime: "10:00", closeTime: "18:00" },
    { day: "Sunday", openTime: "10:00", closeTime: "16:00" },
  ])

  const handleSwitchChange = async (section: string, setting: string, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [setting]: checked,
      },
    }))

    // Save to Supabase (implement based on your settings table structure)
    try {
      // You can implement saving to a settings table here
      console.log('Saving setting:', { section, setting, value: checked })

      toast({
        title: "Setting updated",
        description: `${setting.charAt(0).toUpperCase() + setting.slice(1).replace(/([A-Z])/g, " $1")} has been ${checked ? "enabled" : "disabled"}.`,
      })
    } catch (error) {
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
      console.log('Saving setting:', { section, setting, value })

      toast({
        title: "Setting updated",
        description: `${setting.charAt(0).toUpperCase() + setting.slice(1).replace(/([A-Z])/g, " $1")} has been set to ${value}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save setting. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBusinessHourChange = (index: number, field: keyof BusinessHours, value: string) => {
    const updatedHours = [...businessHours]
    updatedHours[index] = {
      ...updatedHours[index],
      [field]: value,
    }
    setBusinessHours(updatedHours)
  }

  const setHoursForAllDays = () => {
    const mondayHours = businessHours[0]
    const updatedHours = businessHours.map((day) => ({
      ...day,
      openTime: mondayHours.openTime,
      closeTime: mondayHours.closeTime,
    }))

    setBusinessHours(updatedHours)
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
        <div className="mb-8 animate-slide-in-up">
          <h1 className="text-3xl font-bold gradient-text animate-shimmer">Settings</h1>
          <p className="text-slate-400 mt-2">Configure your cafeteria preferences and settings</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          <TabsList className="grid w-full grid-cols-3 glass-effect border border-white/20 p-1 h-auto rounded-xl">
            <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">General</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">Notifications</TabsTrigger>
            <TabsTrigger value="advanced" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-medium transition-all duration-300 hover:bg-white/5">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card className="modern-card glass-effect hover-lift animate-slide-in-up stagger-1">
              <CardHeader>
                <CardTitle className="gradient-text">General Settings</CardTitle>
                <CardDescription className="text-slate-400">Manage your account preferences and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="ordering">Online Ordering</Label>
                    <p className="text-sm text-muted-foreground">Allow customers to place orders online</p>
                  </div>
                  <Switch
                    id="ordering"
                    checked={settings.general.onlineOrdering}
                    onCheckedChange={(checked) => handleSwitchChange("general", "onlineOrdering", checked)}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoAccept">Auto-Accept Orders</Label>
                    <p className="text-sm text-muted-foreground">Automatically accept new orders</p>
                  </div>
                  <Switch
                    id="autoAccept"
                    checked={settings.general.autoAcceptOrders}
                    onCheckedChange={(checked) => handleSwitchChange("general", "autoAcceptOrders", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preparationTime">Default Preparation Time</Label>
                  <Select
                    value={settings.general.preparationTime}
                    onValueChange={(value) => handleSelectChange("general", "preparationTime", value)}
                  >
                    <SelectTrigger id="preparationTime">
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

            <Card>
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
                <CardDescription>Set your operating hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {businessHours.map((hours, index) => (
                  <div key={hours.day} className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Day</Label>
                      <div className="font-medium">{hours.day}</div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`openTime-${index}`}>Opening Time</Label>
                      <Select
                        value={hours.openTime}
                        onValueChange={(value) => handleBusinessHourChange(index, "openTime", value)}
                      >
                        <SelectTrigger id={`openTime-${index}`}>
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
                      <Label htmlFor={`closeTime-${index}`}>Closing Time</Label>
                      <Select
                        value={hours.closeTime}
                        onValueChange={(value) => handleBusinessHourChange(index, "closeTime", value)}
                      >
                        <SelectTrigger id={`closeTime-${index}`}>
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
                <Button variant="outline" className="w-full" onClick={setHoursForAllDays}>
                  Set Hours for All Days
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="newOrders">New Orders</Label>
                    <p className="text-sm text-muted-foreground">Get notified when a new order is placed</p>
                  </div>
                  <Switch
                    id="newOrders"
                    checked={settings.notifications.newOrders}
                    onCheckedChange={(checked) => handleSwitchChange("notifications", "newOrders", checked)}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="lowStock">Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when inventory items are running low</p>
                  </div>
                  <Switch
                    id="lowStock"
                    checked={settings.notifications.lowStock}
                    onCheckedChange={(checked) => handleSwitchChange("notifications", "lowStock", checked)}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="reviews">Customer Reviews</Label>
                    <p className="text-sm text-muted-foreground">Get notified when you receive a new review</p>
                  </div>
                  <Switch
                    id="reviews"
                    checked={settings.notifications.reviews}
                    onCheckedChange={(checked) => handleSwitchChange("notifications", "reviews", checked)}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing">Marketing Updates</Label>
                    <p className="text-sm text-muted-foreground">Receive marketing tips and platform updates</p>
                  </div>
                  <Switch
                    id="marketing"
                    checked={settings.notifications.marketing}
                    onCheckedChange={(checked) => handleSwitchChange("notifications", "marketing", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Configure advanced settings for your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="analytics">Analytics Tracking</Label>
                    <p className="text-sm text-muted-foreground">Allow us to collect anonymous usage data</p>
                  </div>
                  <Switch
                    id="analytics"
                    checked={settings.advanced.analyticsTracking}
                    onCheckedChange={(checked) => handleSwitchChange("advanced", "analyticsTracking", checked)}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoUpdate">Automatic Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically update menu items when inventory changes
                    </p>
                  </div>
                  <Switch
                    id="autoUpdate"
                    checked={settings.advanced.autoUpdate}
                    onCheckedChange={(checked) => handleSwitchChange("advanced", "autoUpdate", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataRetention">Data Retention</Label>
                  <Select
                    value={settings.advanced.dataRetention}
                    onValueChange={(value) => handleSelectChange("advanced", "dataRetention", value)}
                  >
                    <SelectTrigger id="dataRetention">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4">
                  <Button variant="destructive" onClick={handleDeleteAccount}>
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
