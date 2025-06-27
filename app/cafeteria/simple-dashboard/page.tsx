"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SimpleStatusManager } from '@/components/cafeteria/SimpleStatusManager'
import { supabase } from '@/lib/supabase'

export default function SimpleCafeteriaDashboard() {
  const [cafeteriaData, setCafeteriaData] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        throw new Error(`Auth error: ${userError.message}`)
      }

      if (!user) {
        throw new Error('No authenticated user found')
      }

      console.log('✅ Found user:', user.id)
      setCurrentUser(user)

      // Get cafeteria for this user
      const { data: cafeteria, error: cafeteriaError } = await supabase
        .from('cafeterias')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (cafeteriaError) {
        throw new Error(`Cafeteria error: ${cafeteriaError.message}`)
      }

      if (!cafeteria) {
        throw new Error('No cafeteria found for this user')
      }

      console.log('✅ Found cafeteria:', cafeteria.name)
      setCafeteriaData(cafeteria)

    } catch (error) {
      console.error('❌ Error loading data:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading cafeteria dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500">Error: {error}</p>
          <button 
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!cafeteriaData || !currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">No cafeteria data found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{cafeteriaData.name} Dashboard</h1>
        <p className="text-muted-foreground">Manage your cafeteria operations</p>
      </div>

      {/* Status Manager */}
      <div className="mb-6">
        <SimpleStatusManager
          cafeteriaId={cafeteriaData.id}
          userId={currentUser.id}
          initialStatus={cafeteriaData}
        />
      </div>

      {/* Basic Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cafeteria Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Name:</strong> {cafeteriaData.name}</p>
              <p><strong>Status:</strong> {cafeteriaData.operational_status || 'open'}</p>
              <p><strong>Active:</strong> {cafeteriaData.is_active ? 'Yes' : 'No'}</p>
              <p><strong>Open:</strong> {cafeteriaData.is_open ? 'Yes' : 'No'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                View Orders
              </button>
              <button className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600">
                Manage Menu
              </button>
              <button className="w-full p-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                View Reports
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>User ID:</strong> {currentUser.id.slice(0, 8)}...</p>
              <p><strong>Cafeteria ID:</strong> {cafeteriaData.id.slice(0, 8)}...</p>
              <p><strong>Last Updated:</strong> {new Date().toLocaleTimeString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug Info */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <details>
              <summary className="cursor-pointer font-medium">View Raw Data</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify({ cafeteriaData, currentUser: { id: currentUser.id, email: currentUser.email } }, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
