"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings } from 'lucide-react'

interface SimpleStatusManagerProps {
  cafeteriaId: string
  userId: string
  initialStatus?: any
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

export function SimpleStatusManager({ cafeteriaId, userId, initialStatus }: SimpleStatusManagerProps) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus?.operational_status || 'open')
  const [isLoading, setIsLoading] = useState(false)

  const updateStatus = async (newStatus: string, message: string = '') => {
    if (!cafeteriaId || !userId) {
      alert('Missing required information')
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
          status: newStatus,
          message: message,
          user_id: userId
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCurrentStatus(newStatus)
          alert('Status updated successfully!')
        } else {
          alert('Failed to update status: ' + (data.error || 'Unknown error'))
        }
      } else {
        alert('Failed to update status: HTTP ' + response.status)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusOption = (status: string) => {
    return STATUS_OPTIONS.find(option => option.value === status) || STATUS_OPTIONS[0]
  }

  const currentStatusOption = getStatusOption(currentStatus)

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
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${currentStatusOption.color}`}></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{currentStatusOption.icon}</span>
                <span className="font-medium">{currentStatusOption.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {currentStatusOption.description}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Status Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={currentStatus === 'open' ? 'default' : 'outline'}
            className="flex items-center gap-2"
            onClick={() => updateStatus('open')}
            disabled={isLoading}
          >
            🟢 Open
          </Button>
          <Button
            variant={currentStatus === 'busy' ? 'default' : 'outline'}
            className="flex items-center gap-2"
            onClick={() => updateStatus('busy', 'High demand - longer wait times expected')}
            disabled={isLoading}
          >
            🟡 Busy
          </Button>
          <Button
            variant={currentStatus === 'temporarily_closed' ? 'default' : 'outline'}
            className="flex items-center gap-2"
            onClick={() => updateStatus('temporarily_closed', 'Temporarily closed - will reopen soon')}
            disabled={isLoading}
          >
            ⏸️ Temp Closed
          </Button>
          <Button
            variant={currentStatus === 'closed' ? 'default' : 'outline'}
            className="flex items-center gap-2"
            onClick={() => updateStatus('closed', 'Closed for the day')}
            disabled={isLoading}
          >
            🔴 Closed
          </Button>
        </div>

        {isLoading && (
          <div className="text-center text-sm text-muted-foreground">
            Updating status...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
