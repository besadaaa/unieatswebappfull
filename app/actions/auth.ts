"use client"

import { supabase } from '@/lib/supabase'

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = (formData.get("role") as string) || "student"

  console.log('🔐 Sign in attempt:', { email, role })

  try {
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('❌ Supabase auth error:', error)
      return { success: false, message: error.message }
    }

    if (!data.user) {
      console.error('❌ No user data returned')
      return { success: false, message: "Authentication failed" }
    }

    console.log('✅ Supabase auth successful:', data.user.email)

    // Get user profile from your profiles table
    console.log('🔍 Looking for profile:', { userId: data.user.id, role })

    // First, let's see what profile exists for this user
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)

    console.log('📋 All profiles for user:', allProfiles)
    console.log('📋 Profile lookup error (if any):', allProfilesError)

    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .eq('role', role)
      .single()

    if (profileError || !userProfile) {
      console.error('❌ Profile lookup failed:', { profileError, userProfile, expectedRole: role })
      // Sign out if role doesn't match
      await supabase.auth.signOut()
      return { success: false, message: "Invalid role for this user" }
    }

    // Check if user is suspended
    if (userProfile.status === 'suspended') {
      console.log('🚫 User is suspended:', userProfile.email)
      await supabase.auth.signOut()
      return {
        success: false,
        message: "Your account has been suspended. Please contact support for assistance.",
        suspended: true
      }
    }

    console.log('✅ Profile found:', userProfile)

    // Store user session data
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        "user_session",
        JSON.stringify({
          id: userProfile.id,
          email: data.user.email,
          role: userProfile.role,
          full_name: userProfile.full_name,
        }),
      )
    }

    const redirectUrl = userProfile.role === "admin" ? "/admin/dashboard" : "/cafeteria/dashboard"
    console.log('🎉 Sign in successful, redirecting to:', redirectUrl)

    return {
      success: true,
      message: "Signed in successfully",
      redirect: redirectUrl,
    }
  } catch (error) {
    console.error('💥 Sign in error:', error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function signOut() {
  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()

    // Clear local storage regardless of Supabase result
    if (typeof window !== 'undefined') {
      localStorage.removeItem("user_session")
    }

    if (error) {
      console.error('Sign out error:', error)
    }

    return { redirectTo: "/" }
  } catch (error) {
    console.error('Sign out error:', error)
    // Still clear local storage and redirect
    if (typeof window !== 'undefined') {
      localStorage.removeItem("user_session")
    }
    return { redirectTo: "/" }
  }
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const role = (formData.get("role") as string) || "student"

  try {
    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return { success: false, message: error.message }
    }

    if (!data.user) {
      return { success: false, message: "Registration failed" }
    }

    // Create user profile in your profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          role: role,
          full_name: fullName,
        }
      ])

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return { success: false, message: "Failed to create user profile" }
    }

    return {
      success: true,
      message: "Registration successful! Please check your email to verify your account.",
    }
  } catch (error) {
    console.error('Sign up error:', error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function getCurrentUserSession() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Get user profile from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) return null

    // Check if user is suspended
    if (profile.status === 'suspended') {
      console.log('🚫 Suspended user detected, signing out:', profile.email)
      await supabase.auth.signOut()
      return null
    }

    return { ...user, ...profile }
  } catch (error) {
    console.error('Error getting current user session:', error)
    return null
  }
}

export async function getSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

export async function requireAuth(role?: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    if (role) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== role) {
        return null
      }
    }

    return user
  } catch (error) {
    console.error('Error in requireAuth:', error)
    return null
  }
}
