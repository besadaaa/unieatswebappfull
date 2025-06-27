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

      // Provide user-friendly error messages
      let userMessage = error.message
      if (error.message.includes('Invalid login credentials')) {
        userMessage = 'Invalid email or password. Please check your credentials and try again.'
      } else if (error.message.includes('Email not confirmed')) {
        userMessage = 'Please check your email and confirm your account before signing in.'
      } else if (error.message.includes('Too many requests')) {
        userMessage = 'Too many login attempts. Please wait a few minutes before trying again.'
      } else if (error.message.includes('User not found')) {
        userMessage = 'No account found with this email address.'
      }

      return { success: false, message: userMessage }
    }

    if (!data.user) {
      console.error('❌ No user data returned')
      return { success: false, message: "Authentication failed" }
    }

    console.log('✅ Supabase auth successful:', data.user.email)

    // Get user profile from your profiles table
    console.log('🔍 Looking for profile:', { userId: data.user.id, role })

    // First, get the user's profile without role filtering
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    console.log('📋 Profile lookup result:', { userProfile, profileError })

    if (profileError || !userProfile) {
      console.error('❌ Profile not found:', { profileError, userId: data.user.id })
      await supabase.auth.signOut()
      return { success: false, message: "User profile not found. Please contact support." }
    }

    // Check if the user's role matches the expected role
    if (userProfile.role !== role) {
      console.error('❌ Role mismatch:', {
        userRole: userProfile.role,
        expectedRole: role,
        userEmail: data.user.email
      })
      await supabase.auth.signOut()
      return {
        success: false,
        message: `Invalid role. Expected: ${role}, but user has: ${userProfile.role}`
      }
    }

    // Check if user is suspended
    if (userProfile.is_suspended) {
      console.log('🚫 User is suspended:', data.user.email)
      await supabase.auth.signOut()
      return {
        success: false,
        message: "Your account has been suspended. Please contact support for assistance.",
        suspended: true
      }
    }

    // Check if user account is active (for cafeteria managers)
    if (userProfile.role === 'cafeteria_manager' && userProfile.is_active === false) {
      console.log('⏳ User account is pending approval:', data.user.email)
      await supabase.auth.signOut()
      return {
        success: false,
        message: "Your cafeteria application is still pending approval. You will be able to login once an admin approves your application.",
        pending: true
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
  } catch (error: any) {
    console.error('💥 Sign in error:', error)

    // Handle specific Supabase AuthApiError
    if (error?.name === 'AuthApiError' || error?.message?.includes('Invalid login credentials')) {
      return { success: false, message: "Invalid email or password. Please check your credentials and try again." }
    }

    // Handle other auth errors
    if (error?.message?.includes('Email not confirmed')) {
      return { success: false, message: "Please check your email and confirm your account before signing in." }
    }

    if (error?.message?.includes('Too many requests')) {
      return { success: false, message: "Too many login attempts. Please wait a few minutes before trying again." }
    }

    if (error?.message?.includes('User not found')) {
      return { success: false, message: "No account found with this email address." }
    }

    // Default user-friendly message
    return { success: false, message: "Invalid email or password. Please check your credentials and try again." }
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
          email: email,
          status: 'active'
        }
      ])

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return { success: false, message: `Profile creation failed: ${profileError.message}` }
    }

    return {
      success: true,
      message: "Account created successfully! You can now sign in.",
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
    if (profile.is_suspended) {
      console.log('🚫 Suspended user detected, signing out:', user.email)
      await supabase.auth.signOut()
      return null
    }

    // Check if user account is inactive (for cafeteria managers)
    if (profile.role === 'cafeteria_manager' && profile.is_active === false) {
      console.log('⏳ Inactive user detected, signing out:', user.email)
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
