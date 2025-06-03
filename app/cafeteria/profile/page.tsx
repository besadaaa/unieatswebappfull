"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useState, useEffect, useRef } from "react"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/supabase"

type ProfileData = {
  personal: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  business: {
    cafeName: string
    location: string
    businessHours: string
    description: string
  }
  security: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData>({
    personal: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
    business: {
      cafeName: "",
      location: "",
      businessHours: "",
      description: "",
    },
    security: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const [tempData, setTempData] = useState<ProfileData>({ ...profileData })
  const [avatarImage, setAvatarImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load profile data from Supabase
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true)

        // Get current user
        const user = await getCurrentUser()
        if (!user) {
          toast({
            title: "Error",
            description: "Please log in to view your profile.",
            variant: "destructive",
          })
          return
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          toast({
            title: "Error",
            description: "Failed to load profile data.",
            variant: "destructive",
          })
          return
        }

        // Get cafeteria data if user is a cafeteria manager
        let cafeteriaData = null
        if (profile.role === 'cafeteria_manager') {
          const { data: cafeteria, error: cafeteriaError } = await supabase
            .from('cafeterias')
            .select('*')
            .eq('owner_id', user.id)
            .single()

          if (!cafeteriaError && cafeteria) {
            cafeteriaData = cafeteria
          }
        }

        // Update profile data
        const fullName = profile.full_name || ''
        const nameParts = fullName.split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        setProfileData({
          personal: {
            firstName,
            lastName,
            email: profile.email || user.email || '',
            phone: profile.phone || '',
          },
          business: {
            cafeName: cafeteriaData?.name || 'My Cafeteria',
            location: cafeteriaData?.location || '',
            businessHours: cafeteriaData?.business_hours || '8:00 AM - 8:00 PM',
            description: cafeteriaData?.description || '',
          },
          security: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          },
        })

      } catch (error) {
        console.error('Error loading profile data:', error)
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [])

  useEffect(() => {
    if (isEditing) {
      setTempData({ ...profileData })
    }
  }, [isEditing, profileData])

  const handleInputChange = (section: keyof ProfileData, field: string, value: string) => {
    setTempData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show loading state
    toast({
      title: "Uploading image...",
      description: "Please wait while we upload your profile photo.",
    })

    try {
      // Import storage utility
      const { uploadUserAvatar } = await import('@/lib/storage')

      // Get current user ID (you'll need to implement this based on your auth system)
      const userId = 'current-user-id' // Replace with actual user ID from auth

      // Upload to Supabase Storage
      const result = await uploadUserAvatar(file, userId)

      if (result.success && result.url) {
        setAvatarImage(result.url)
        toast({
          title: "Avatar updated",
          description: "Your profile photo has been updated successfully.",
        })
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSave = () => {
    // Validate password if changed
    if (tempData.security.newPassword) {
      if (!tempData.security.currentPassword) {
        toast({
          title: "Error",
          description: "Current password is required to set a new password.",
          variant: "destructive",
        })
        return
      }

      if (tempData.security.newPassword !== tempData.security.confirmPassword) {
        toast({
          title: "Error",
          description: "New passwords do not match.",
          variant: "destructive",
        })
        return
      }
    }

    // Show loading state
    toast({
      title: "Saving changes...",
      description: "Please wait while we update your profile.",
    })

    // Simulate API call
    setTimeout(() => {
      setProfileData({ ...tempData })
      setIsEditing(false)
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      })
    }, 1500)
  }

  const handleCancel = () => {
    setTempData({ ...profileData })
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading profile data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Card className="w-full md:w-1/3">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your personal information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="h-24 w-24 rounded-full overflow-hidden flex items-center justify-center text-2xl font-medium bg-gray-700">
                {avatarImage ? (
                  <img
                    src={avatarImage || "/placeholder.svg"}
                    alt="User avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    {profileData.personal.firstName.charAt(0)}
                    {profileData.personal.lastName.charAt(0)}
                  </>
                )}
              </div>
              <div className="text-center">
                <h3 className="font-medium text-lg">{profileData.business.cafeName}</h3>
                <p className="text-sm text-muted-foreground">{profileData.personal.email}</p>
              </div>
              <>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                  Change Avatar
                </Button>
              </>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="personal">
                <TabsList className="mb-4">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="business">Business Info</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={isEditing ? tempData.personal.firstName : profileData.personal.firstName}
                        onChange={(e) => handleInputChange("personal", "firstName", e.target.value)}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={isEditing ? tempData.personal.lastName : profileData.personal.lastName}
                        onChange={(e) => handleInputChange("personal", "lastName", e.target.value)}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={isEditing ? tempData.personal.email : profileData.personal.email}
                        onChange={(e) => handleInputChange("personal", "email", e.target.value)}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={isEditing ? tempData.personal.phone : profileData.personal.phone}
                        onChange={(e) => handleInputChange("personal", "phone", e.target.value)}
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="business" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cafeName">Cafe Name</Label>
                      <Input
                        id="cafeName"
                        value={isEditing ? tempData.business.cafeName : profileData.business.cafeName}
                        onChange={(e) => handleInputChange("business", "cafeName", e.target.value)}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={isEditing ? tempData.business.location : profileData.business.location}
                        onChange={(e) => handleInputChange("business", "location", e.target.value)}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessHours">Business Hours</Label>
                      <Input
                        id="businessHours"
                        value={isEditing ? tempData.business.businessHours : profileData.business.businessHours}
                        onChange={(e) => handleInputChange("business", "businessHours", e.target.value)}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={isEditing ? tempData.business.description : profileData.business.description}
                        onChange={(e) => handleInputChange("business", "description", e.target.value)}
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={isEditing ? tempData.security.currentPassword : profileData.security.currentPassword}
                        onChange={(e) => handleInputChange("security", "currentPassword", e.target.value)}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={isEditing ? tempData.security.newPassword : profileData.security.newPassword}
                        onChange={(e) => handleInputChange("security", "newPassword", e.target.value)}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={isEditing ? tempData.security.confirmPassword : profileData.security.confirmPassword}
                        onChange={(e) => handleInputChange("security", "confirmPassword", e.target.value)}
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save Changes</Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </CardFooter>
          </Card>
        </div>
    </div>
  )
}
