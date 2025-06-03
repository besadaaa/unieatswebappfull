"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Mail, Phone, LogOut, Home, Clock, User } from "lucide-react"
import { supabase } from '@/lib/supabase'
import { getCurrentUserSession } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function SuspendedPage() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [suspensionDetails, setSuspensionDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadSuspensionInfo()
  }, [])

  const loadSuspensionInfo = async () => {
    try {
      const user = await getCurrentUserSession()
      
      if (!user) {
        router.push('/')
        return
      }

      // If user is not suspended, redirect to appropriate dashboard
      if (user.status !== 'suspended') {
        const redirectUrl = user.role === 'admin' ? '/admin/dashboard' : '/cafeteria/dashboard'
        router.push(redirectUrl)
        return
      }

      setUserInfo(user)

      // Get suspension details from audit logs
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity_id', user.id)
        .eq('action', 'user_suspended')
        .order('created_at', { ascending: false })
        .limit(1)

      if (auditLogs && auditLogs.length > 0) {
        setSuspensionDetails(auditLogs[0])
      }

      // Get any notifications related to suspension
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'account_status')
        .order('created_at', { ascending: false })
        .limit(3)

    } catch (error) {
      console.error('Error loading suspension info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_session')
      }
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleContactSupport = () => {
    const subject = encodeURIComponent('Account Suspension Appeal')
    const body = encodeURIComponent(`Hello UniEats Support Team,

I am writing to inquire about my suspended account and request information about the appeal process.

Account Details:
- Name: ${userInfo?.full_name || 'N/A'}
- Email: ${userInfo?.email || 'N/A'}
- Role: ${userInfo?.role || 'N/A'}
- Suspension Date: ${suspensionDetails ? new Date(suspensionDetails.created_at).toLocaleDateString() : 'Unknown'}

I would like to understand:
1. The specific reason for my account suspension
2. What steps I need to take to resolve this issue
3. The timeline for the appeal process
4. Any documentation or information I need to provide

Please let me know how I can proceed to restore my account access.

Thank you for your time and assistance.

Best regards,
${userInfo?.full_name || 'User'}`)

    window.location.href = `mailto:support@unieats.com?subject=${subject}&body=${body}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f1424] to-[#1a1f36] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p>Loading account information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1424] to-[#1a1f36] text-white">
      {/* Header */}
      <header className="container mx-auto py-6 px-4 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 relative">
            <Image src="/logo.png" alt="UniEats Logo" width={48} height={48} className="object-contain" priority />
          </div>
          <h1 className="text-2xl font-bold">UniEats</h1>
        </div>
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </header>

      {/* Main Content */}
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-red-400 mb-2">Account Suspended</h1>
          <p className="text-xl text-gray-300">Your UniEats account has been temporarily suspended</p>
        </div>

        {/* User Information */}
        {userInfo && (
          <Card className="bg-[#1a1f36] border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Name:</strong> {userInfo.full_name || 'N/A'}</p>
                  <p><strong>Email:</strong> {userInfo.email}</p>
                </div>
                <div>
                  <p><strong>Role:</strong> {userInfo.role}</p>
                  <p><strong>Account Status:</strong> <span className="text-red-400 font-semibold">Suspended</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suspension Details */}
        {suspensionDetails && (
          <Card className="bg-[#1a1f36] border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock className="h-5 w-5" />
                Suspension Details
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              <p><strong>Suspended on:</strong> {new Date(suspensionDetails.created_at).toLocaleDateString()} at {new Date(suspensionDetails.created_at).toLocaleTimeString()}</p>
              {suspensionDetails.details?.reason && (
                <p className="mt-2"><strong>Reason:</strong> {suspensionDetails.details.reason}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* What This Means */}
        <Alert className="bg-red-900/20 border-red-700 mb-6">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <AlertTitle className="text-red-400">What this means for your account:</AlertTitle>
          <AlertDescription className="text-gray-300 mt-2">
            <ul className="space-y-2">
              <li>• You cannot access your account dashboard</li>
              <li>• You cannot place new orders or manage existing ones</li>
              <li>• Your cafeteria services (if applicable) are temporarily paused</li>
              <li>• You cannot update your profile or account settings</li>
              <li>• All active orders may be cancelled or transferred</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Next Steps */}
        <Card className="bg-[#1a1f36] border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <h4 className="font-semibold text-blue-400 mb-2">1. Contact Support</h4>
                <p className="text-sm">Reach out to our support team to understand the specific reason for suspension and learn about the appeal process.</p>
              </div>
              
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-400 mb-2">2. Provide Required Information</h4>
                <p className="text-sm">Submit any requested documentation or information to help resolve the issue.</p>
              </div>
              
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                <h4 className="font-semibold text-green-400 mb-2">3. Wait for Review</h4>
                <p className="text-sm">Our team will review your case and provide updates on the status of your appeal.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Options */}
        <Card className="bg-[#1a1f36] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Contact Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={handleContactSupport}
                className="bg-blue-600 hover:bg-blue-700 text-white h-auto py-4"
              >
                <div className="text-center">
                  <Mail className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-semibold">Email Support</div>
                  <div className="text-sm opacity-90">support@unieats.com</div>
                </div>
              </Button>
              
              <Button
                onClick={() => window.open('tel:+201234567890')}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 h-auto py-4"
              >
                <div className="text-center">
                  <Phone className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-semibold">Call Support</div>
                  <div className="text-sm opacity-90">+20 123 456 7890</div>
                </div>
              </Button>
              
              <Link href="/">
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 h-auto py-4 w-full"
                >
                  <div className="text-center">
                    <Home className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-semibold">Return Home</div>
                    <div className="text-sm opacity-90">Go to main page</div>
                  </div>
                </Button>
              </Link>
            </div>
            
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
              <h4 className="font-semibold text-gray-300 mb-2">Support Hours:</h4>
              <p className="text-sm text-gray-400">
                Sunday - Thursday: 9:00 AM - 6:00 PM (Cairo Time)<br />
                Friday - Saturday: Closed<br />
                Emergency support available 24/7 via email
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
