"use client"

import { SupabaseConnectionTest } from '@/components/supabase-connection-test'
import { useCafeterias, useMenuItems, useSupabaseConnection } from '@/hooks/use-supabase-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, RefreshCw, Coffee, ShoppingCart } from 'lucide-react'

export default function TestIntegrationPage() {
  const { isConnected, loading: connectionLoading, error: connectionError, testConnection } = useSupabaseConnection()
  const { data: cafeterias, loading: cafeteriasLoading, error: cafeteriasError, refetch: refetchCafeterias } = useCafeterias()
  const { data: menuItems, loading: menuItemsLoading, error: menuItemsError, refetch: refetchMenuItems } = useMenuItems()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="container mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Supabase Integration Test</h1>
          <p className="text-slate-300">Testing all Supabase connections and data fetching</p>
        </div>

        {/* Connection Status */}
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              {connectionLoading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : isConnected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Connection Status
              <Button
                onClick={testConnection}
                disabled={connectionLoading}
                size="sm"
                variant="outline"
                className="ml-auto glass-effect border-white/20"
              >
                Test Again
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connectionLoading ? (
              <p className="text-slate-300">Testing connection...</p>
            ) : isConnected ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500">Connected</Badge>
                <span className="text-slate-300">Supabase connection is working</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Disconnected</Badge>
                <span className="text-slate-300">{connectionError || 'Connection failed'}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cafeterias Test */}
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Coffee className="h-5 w-5" />
              Cafeterias ({cafeterias.length})
              <Button
                onClick={refetchCafeterias}
                disabled={cafeteriasLoading}
                size="sm"
                variant="outline"
                className="ml-auto glass-effect border-white/20"
              >
                {cafeteriasLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cafeteriasLoading ? (
              <p className="text-slate-300">Loading cafeterias...</p>
            ) : cafeteriasError ? (
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Error</Badge>
                <span className="text-slate-300">{cafeteriasError}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500">Success</Badge>
                  <span className="text-slate-300">Found {cafeterias.length} cafeterias</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {cafeterias.slice(0, 6).map((cafeteria) => (
                    <div key={cafeteria.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="font-medium text-white">{cafeteria.name}</h4>
                      <p className="text-sm text-slate-400">{cafeteria.location}</p>
                      <div className="flex gap-2 mt-2">
                        {cafeteria.is_active && (
                          <Badge variant="secondary" className="text-xs">Active</Badge>
                        )}
                        {cafeteria.approval_status === 'approved' && (
                          <Badge className="bg-green-500 text-xs">Approved</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Menu Items Test */}
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ShoppingCart className="h-5 w-5" />
              Menu Items ({menuItems.length})
              <Button
                onClick={refetchMenuItems}
                disabled={menuItemsLoading}
                size="sm"
                variant="outline"
                className="ml-auto glass-effect border-white/20"
              >
                {menuItemsLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {menuItemsLoading ? (
              <p className="text-slate-300">Loading menu items...</p>
            ) : menuItemsError ? (
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Error</Badge>
                <span className="text-slate-300">{menuItemsError}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500">Success</Badge>
                  <span className="text-slate-300">Found {menuItems.length} menu items</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {menuItems.slice(0, 6).map((item) => (
                    <div key={item.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="font-medium text-white">{item.name}</h4>
                      <p className="text-sm text-slate-400">{item.category}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-green-400 font-medium">${item.price}</span>
                        {item.is_available && (
                          <Badge variant="secondary" className="text-xs">Available</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comprehensive Test Component */}
        <SupabaseConnectionTest />
      </div>
    </div>
  )
}
