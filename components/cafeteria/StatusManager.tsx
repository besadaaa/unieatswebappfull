"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Clock, MessageSquare, Settings, RefreshCw } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CafeteriaStatus {
  id: string
  name: string
  operational_status: string
  status_message: string
  status_updated_at: string
  is_open: boolean
  is_active: boolean
}

interface StatusManagerProps {
  cafeteriaId: string
  userId: string
  initialStatus?: CafeteriaStatus
}

const STATUS_OPTIONS = [
  {
    value: 'open',
    label: 'Open',
    description: 'Accepting orders normally',
    color: 'bg-green-500',
    icon: '🟢'
  },
  {
    value: 'busy',
    label: 'Busy',
    description: 'High demand - longer wait times',
    color: 'bg-orange-500',
    icon: '🟡'
  },
  {
    value: 'temporarily_closed',
    label: 'Temporarily Closed',
    description: 'Brief closure - will reopen soon',
    color: 'bg-yellow-500',
    icon: '⏸️'
  },
  {
    value: 'closed',
    label: 'Closed',
    description: 'Not accepting orders',
    color: 'bg-red-500',
    icon: '🔴'
  }
]

export function StatusManager({ cafeteriaId, userId, initialStatus }: StatusManagerProps) {
  const [currentStatus, setCurrentStatus] = useState<CafeteriaStatus | null>(initialStatus || null)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (cafeteriaId) {
      loadCurrentStatus()
      const cleanup = setupRealtimeSubscription()
      return cleanup
    }
  }, [cafeteriaId])

  const loadCurrentStatus = async () => {
    if (!cafeteriaId) return

    try {
      const response = await fetch(`/api/cafeteria/status?cafeteria_id=${cafeteriaId}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.data) {
        setCurrentStatus(data.data)
        setSelectedStatus(data.data.operational_status || 'open')
        setStatusMessage(data.data.status_message || '')
      } else {
        console.warn('No status data received:', data)
      }
    } catch (error) {
      console.error('Error loading status:', error)
      // Don't show toast for loading errors to avoid spam
      // toast({
      //   title: "Error",
      //   description: "Failed to load current status",
      //   variant: "destructive",
      // })
    }
  }

  const setupRealtimeSubscription = () => {
    try {
      const subscription = supabase
        .channel(`cafeteria-status-${cafeteriaId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'cafeterias',
            filter: `id=eq.${cafeteriaId}`
          },
          (payload) => {
            console.log('Cafeteria status updated:', payload)
            setCurrentStatus(payload.new as CafeteriaStatus)
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error('Error setting up real-time subscription:', error)
      return () => {} // Return empty cleanup function
    }
  }

  const updateStatus = async () => {
    if (!selectedStatus) {
      toast({
        title: "Error",
        description: "Please select a status",
        variant: "destructive",
      })
      return
    }

    if (!cafeteriaId || !userId) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/cafeteria/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cafeteria_id: cafeteriaId,
          status: selectedStatus,
          message: statusMessage,
          user_id: userId
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Cafeteria status updated successfully",
        })
        setIsDialogOpen(false)
        await loadCurrentStatus()
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
      setIsLoading(false)
    }
  }

  const getStatusOption = (status: string) => {
    return STATUS_OPTIONS.find(option => option.value === status) || STATUS_OPTIONS[0]
  }

  const currentStatusOption = currentStatus ? getStatusOption(currentStatus.operational_status) : null

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Cafeteria Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status Display */}
        {currentStatus && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${currentStatusOption?.color}`}></div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currentStatusOption?.icon}</span>
                  <span className="font-medium">{currentStatusOption?.label}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentStatusOption?.description}
                </p>
                {currentStatus.status_message && (
                  <p className="text-sm text-muted-foreground mt-1">
                    "{currentStatus.status_message}"
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Last updated</p>
              <p className="text-sm">
                {new Date(currentStatus.status_updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Quick Status Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={currentStatus?.operational_status === 'open' ? 'default' : 'outline'}
            className="flex items-center gap-2"
            onClick={() => {
              setSelectedStatus('open')
              setStatusMessage('')
              updateStatus()
            }}
            disabled={isLoading}
          >
            🟢 Open
          </Button>
          <Button
            variant={currentStatus?.operational_status === 'busy' ? 'default' : 'outline'}
            className="flex items-center gap-2"
            onClick={() => {
              setSelectedStatus('busy')
              setStatusMessage('High demand - longer wait times expected')
              updateStatus()
            }}
            disabled={isLoading}
          >
            🟡 Busy
          </Button>
          <Button
            variant={currentStatus?.operational_status === 'temporarily_closed' ? 'default' : 'outline'}
            className="flex items-center gap-2"
            onClick={() => {
              setSelectedStatus('temporarily_closed')
              setStatusMessage('Temporarily closed - will reopen soon')
              updateStatus()
            }}
            disabled={isLoading}
          >
            ⏸️ Temp Closed
          </Button>
          <Button
            variant={currentStatus?.operational_status === 'closed' ? 'default' : 'outline'}
            className="flex items-center gap-2"
            onClick={() => {
              setSelectedStatus('closed')
              setStatusMessage('Closed for the day')
              updateStatus()
            }}
            disabled={isLoading}
          >
            🔴 Closed
          </Button>
        </div>

        {/* Advanced Status Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Custom Status & Message
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Cafeteria Status</DialogTitle>
              <DialogDescription>
                Set your cafeteria's operational status and add a custom message for customers.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <span>{option.icon}</span>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {option.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Status Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a message for customers (e.g., 'Back in 30 minutes', 'Limited menu available')"
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateStatus} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Refresh Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={loadCurrentStatus}
          className="w-full flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  )
}
