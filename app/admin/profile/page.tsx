'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { PageHeader } from "@/components/admin/page-header"
import { supabase } from '@/lib/supabase'

type ProfileData = {
  personal: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  security: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }
}

export default function AdminProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [avatarImage, setAvatarImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tempData, setTempData] = useState<ProfileData>({
    personal: { firstName: "", lastName: "", email: "", phone: "" },
    security: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })
  const [profileData, setProfileData] = useState<ProfileData>({
    personal: { firstName: "", lastName: "", email: "", phone: "" },
    security: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          toast({
            title: "Error",
            description: "Please sign in to access your profile.",
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

        // Update profile data
        const fullName = profile.full_name || ''
        const nameParts = fullName.split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''

        // Set avatar image if available
        if (profile.avatar_url) {
          setAvatarImage(profile.avatar_url)
        }

        setProfileData({
          personal: {
            firstName,
            lastName,
            email: profile.email || user.email || '',
            phone: profile.phone || '',
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
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Please sign in to upload photos')
      }

      // Import storage utility
      const { uploadUserAvatar } = await import('@/lib/storage')

      // Upload to Supabase Storage
      const result = await uploadUserAvatar(file, user.id)

      if (result.success && result.url) {
        setAvatarImage(result.url)
        
        // Update profile with new avatar URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: result.url })
          .eq('id', user.id)

        if (updateError) {
          console.error('Error updating avatar URL:', updateError)
          throw new Error(`Failed to update profile: ${updateError.message}`)
        }

        toast({
          title: "Avatar updated",
          description: "Your profile photo has been updated successfully.",
        })
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)

      let errorMessage = "Failed to upload image. Please try again."

      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message)
      }

      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
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

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Please sign in to update your profile')
      }

      // Prepare profile updates
      const profileUpdates = {
        full_name: `${tempData.personal.firstName} ${tempData.personal.lastName}`.trim(),
        phone: tempData.personal.phone,
      }

      // Call API to update profile
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          profileUpdates,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile')
      }

      // Update local state
      setProfileData({ ...tempData })
      setIsEditing(false)
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      })

    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    }
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
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Profile Settings"
        subtitle="Manage your personal information and account settings"
      />

      <div className="flex flex-col md:flex-row gap-6 mt-6">
        <Card className="w-full md:w-1/3 modern-card glass-effect hover-lift">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your personal information</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="h-24 w-24 rounded-full overflow-hidden flex items-center justify-center text-2xl font-medium bg-gradient-to-br from-emerald-500 to-teal-500">
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
              <h3 className="font-medium text-lg">{profileData.personal.firstName} {profileData.personal.lastName}</h3>
              <p className="text-sm text-muted-foreground">{profileData.personal.email}</p>
              <p className="text-xs text-emerald-500 font-medium">Administrator</p>
            </div>
            <>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                Change Avatar
              </Button>
            </>
          </CardContent>
        </Card>

        <Card className="flex-1 modern-card glass-effect hover-lift">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Update your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="personal">
              <TabsList className="mb-4">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
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
                      readOnly={true}
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
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
                      placeholder={isEditing ? "Enter current password" : "••••••••"}
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
                      placeholder={isEditing ? "Enter new password" : "••••••••"}
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
                      placeholder={isEditing ? "Confirm new password" : "••••••••"}
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
                <Button onClick={handleSave} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                Edit Profile
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
