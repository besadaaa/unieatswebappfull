"use client"

import { supabase } from '@/lib/supabase'

export async function requestPasswordReset(formData: FormData) {
  try {
    const email = formData.get("email") as string

    if (!email) {
      return { success: false, message: "Email is required" }
    }

    // Use Supabase's built-in password reset functionality
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      console.error('Password reset error:', error)
      return { success: false, message: error.message }
    }

    return {
      success: true,
      message: "Password reset instructions have been sent to your email",
    }
  } catch (error) {
    console.error('Password reset error:', error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function resetPassword(formData: FormData) {
  try {
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!password || password.length < 6) {
      return { success: false, message: "Password must be at least 6 characters" }
    }

    if (password !== confirmPassword) {
      return { success: false, message: "Passwords do not match" }
    }

    // Update the user's password using Supabase
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      console.error('Password update error:', error)
      return { success: false, message: error.message }
    }

    return {
      success: true,
      message: "Your password has been reset successfully. You can now log in with your new password.",
      redirect: "/",
    }
  } catch (error) {
    console.error('Password update error:', error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function verifyResetToken(token: string) {
  try {
    // In Supabase, the token verification is handled automatically
    // when the user clicks the reset link from their email
    // This function can be used to validate the session
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { valid: false, message: "Invalid or expired reset token" }
    }

    return { valid: true, message: "Token is valid" }
  } catch (error) {
    console.error('Token verification error:', error)
    return { valid: false, message: "An unexpected error occurred" }
  }
}
