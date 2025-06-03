"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Package, 
  TrendingDown,
  TrendingUp,
  Clock
} from 'lucide-react'
import { useInventoryManagement, useMenuItemAvailability } from '@/hooks/use-auto-inventory'
import { getCurrentUser, getCafeterias } from '@/lib/supabase'

interface InventoryDashboardProps {
  cafeteriaId?: string
}

export function InventoryDashboard({ cafeteriaId: propCafeteriaId }: InventoryDashboardProps) {
  const [cafeteriaId, setCafeteriaId] = useState<string | undefined>(propCafeteriaId)
  const [isInitialized, setIsInitialized] = useState(false)
  const { toast } = useToast()

  const {
    alerts,
    alertsLoading,
    alertsError,
    refetchAlerts,
    resolveAlert,
    updateAllAvailability
  } = useInventoryManagement(cafeteriaId)

  // Initialize cafeteria ID if not provided
  useEffect(() => {
    const initializeCafeteria = async () => {
      if (!propCafeteriaId) {
        try {
          const user = await getCurrentUser()
          const cafeterias = await getCafeterias()
          const userCafeteria = cafeterias.find(c => c.owner_id === user?.id) || cafeterias[0]
          
          if (userCafeteria) {
            setCafeteriaId(userCafeteria.id)
          }
        } catch (error) {
          console.error('Error initializing cafeteria:', error)
        }
      }
      setIsInitialized(true)
    }

    initializeCafeteria()
  }, [propCafeteriaId])

  const handleResolveAlert = async (alertId: string) => {
    const result = await resolveAlert(alertId)
    
    if (result.success) {
      toast({
        title: "Alert Resolved",
        description: result.message,
      })
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive"
      })
    }
  }

  const handleUpdateAllAvailability = async () => {
    const result = await updateAllAvailability()
    
    if (result.success) {
      toast({
        title: "Availability Updated",
        description: `Updated ${result.updated} menu items`,
      })
      refetchAlerts()
    } else {
      toast({
        title: "Update Failed",
        description: result.errors.join(', '),
        variant: "destructive"
      })
    }
  }

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'out_of_stock':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'low_stock':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'expired':
        return <Clock className="h-4 w-4 text-red-500" />
      case 'expiring_soon':
        return <Clock className="h-4 w-4 text-orange-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getAlertBadgeVariant = (alertType: string) => {
    switch (alertType) {
      case 'out_of_stock':
      case 'expired':
        return 'destructive'
      case 'low_stock':
      case 'expiring_soon':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Initializing inventory dashboard...</span>
      </div>
    )
  }

  if (!cafeteriaId) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No cafeteria found. Please ensure you have access to a cafeteria.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Inventory Dashboard</h2>
          <p className="text-slate-400">Automatic inventory monitoring and alerts</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={refetchAlerts}
            disabled={alertsLoading}
            variant="outline"
            className="glass-effect border-white/20"
          >
            {alertsLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button
            onClick={handleUpdateAllAvailability}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Update All Availability
          </Button>
        </div>
      </div>

      {/* Alerts Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-effect border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Total Alerts</p>
                <p className="text-2xl font-bold text-white">{alerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-sm text-slate-400">Out of Stock</p>
                <p className="text-2xl font-bold text-white">
                  {alerts.filter(a => a.alert_type === 'out_of_stock').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-sm text-slate-400">Low Stock</p>
                <p className="text-2xl font-bold text-white">
                  {alerts.filter(a => a.alert_type === 'low_stock').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-sm text-slate-400">Expiring</p>
                <p className="text-2xl font-bold text-white">
                  {alerts.filter(a => a.alert_type === 'expiring_soon' || a.alert_type === 'expired').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {alertsError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{alertsError}</AlertDescription>
        </Alert>
      )}

      {/* Active Alerts */}
      <Card className="glass-effect border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Active Inventory Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span className="text-slate-400">Loading alerts...</span>
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
              <span className="text-slate-400">No active alerts - all inventory levels are good!</span>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.alert_type)}
                    <div>
                      <p className="text-white font-medium">{alert.message}</p>
                      <p className="text-sm text-slate-400">
                        {new Date(alert.created_at).toLocaleDateString()} at{' '}
                        {new Date(alert.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getAlertBadgeVariant(alert.alert_type)}>
                      {alert.alert_type.replace('_', ' ')}
                    </Badge>
                    <Button
                      onClick={() => handleResolveAlert(alert.id)}
                      size="sm"
                      variant="outline"
                      className="glass-effect border-white/20"
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
