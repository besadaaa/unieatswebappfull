"use client"

import React, { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Mail, Phone, LogOut } from "lucide-react"
import { supabase } from '@/lib/supabase'
import { getCurrentUserSession } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'

interface SuspensionBannerProps {
  className?: string
}

export function SuspensionBanner({ className = "" }: SuspensionBannerProps) {
  const [isSuspended, setIsSuspended] = useState(false)
  const [suspensionDetails, setSuspensionDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkSuspensionStatus()
  }, [])

  const checkSuspensionStatus = async () => {
    try {
      const user = await getCurrentUserSession()
      
      if (!user) {
        setLoading(false)
        return
      }

      // Check if user is suspended
      if (user.status === 'suspended') {
        setIsSuspended(true)
        
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
      }
    } catch (error) {
      console.error('Error checking suspension status:', error)
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
    // Open email client or redirect to support page
    window.location.href = 'mailto:support@unieats.com?subject=Account Suspension Appeal&body=Hello, I would like to appeal my account suspension. My account details: [Please provide your email and any relevant information]'
  }

  if (loading || !isSuspended) {
    return null
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
      <Alert className="bg-red-900/90 border-red-700 text-white rounded-none">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <AlertTitle className="text-lg font-bold text-red-100">
          Account Suspended
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <div className="text-red-200">
            <p className="font-medium">
              Your account has been suspended and you cannot access UniEats services.
            </p>
            {suspensionDetails && (
              <p className="text-sm mt-1 opacity-90">
                Suspended on: {new Date(suspensionDetails.created_at).toLocaleDateString()} at {new Date(suspensionDetails.created_at).toLocaleTimeString()}
              </p>
            )}
          </div>
          
          <div className="bg-red-800/50 p-3 rounded-md">
            <h4 className="font-medium text-red-100 mb-2">What this means:</h4>
            <ul className="text-sm text-red-200 space-y-1">
              <li>• You cannot place or manage orders</li>
              <li>• You cannot access your account dashboard</li>
              <li>• All active orders may be cancelled</li>
              <li>• Your cafeteria services (if applicable) are paused</li>
            </ul>
          </div>

          <div className="bg-red-800/50 p-3 rounded-md">
            <h4 className="font-medium text-red-100 mb-2">Next Steps:</h4>
            <ul className="text-sm text-red-200 space-y-1">
              <li>• Contact our support team to understand the reason</li>
              <li>• Provide any requested documentation or information</li>
              <li>• Wait for the review process to complete</li>
              <li>• Follow any instructions provided by our team</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button
              onClick={handleContactSupport}
              className="bg-red-600 hover:bg-red-700 text-white border-red-500"
              size="sm"
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            
            <Button
              onClick={() => window.open('tel:+201234567890')}
              variant="outline"
              className="border-red-500 text-red-100 hover:bg-red-800"
              size="sm"
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Support
            </Button>
            
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-red-500 text-red-100 hover:bg-red-800"
              size="sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <div className="text-xs text-red-300 mt-3 p-2 bg-red-800/30 rounded">
            <strong>Support Contact:</strong><br />
            Email: support@unieats.com<br />
            Phone: +20 123 456 7890<br />
            Hours: Sunday - Thursday, 9:00 AM - 6:00 PM
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

// Hook to check suspension status
export function useSuspensionStatus() {
  const [isSuspended, setIsSuspended] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const user = await getCurrentUserSession()
        setIsSuspended(user?.status === 'suspended')
      } catch (error) {
        console.error('Error checking suspension status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkStatus()

    // Set up real-time subscription for status changes
    const subscription = supabase
      .channel('user_status_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${getCurrentUserSession()?.then(u => u?.id)}`
        },
        (payload) => {
          if (payload.new.status === 'suspended') {
            setIsSuspended(true)
          } else if (payload.new.status === 'active') {
            setIsSuspended(false)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { isSuspended, loading }
}
