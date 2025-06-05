"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, RefreshCw, Database, Users, ShoppingCart, Coffee } from 'lucide-react'
import { DataService } from '@/lib/data-service'
import { testSupabaseConnection } from '@/lib/supabase'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'loading'
  message: string
  data?: any
}

export function SupabaseConnectionTest() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runTests = async () => {
    setIsRunning(true)
    const testResults: TestResult[] = []

    // Test 1: Basic connection
    testResults.push({ name: 'Connection Test', status: 'loading', message: 'Testing...' })
    setTests([...testResults])

    try {
      const connectionResult = await testSupabaseConnection()
      testResults[0] = {
        name: 'Connection Test',
        status: connectionResult.success ? 'success' : 'error',
        message: connectionResult.success ? 'Connected successfully' : connectionResult.error,
        data: connectionResult.data
      }
      setTests([...testResults])
    } catch (error) {
      testResults[0] = {
        name: 'Connection Test',
        status: 'error',
        message: 'Connection failed'
      }
      setTests([...testResults])
    }

    // Test 2: Cafeterias
    testResults.push({ name: 'Cafeterias', status: 'loading', message: 'Fetching cafeterias...' })
    setTests([...testResults])

    try {
      const cafeterias = await DataService.getCafeterias(false)
      testResults[1] = {
        name: 'Cafeterias',
        status: 'success',
        message: `Found ${cafeterias.length} cafeterias`,
        data: cafeterias.slice(0, 3)
      }
      setTests([...testResults])
    } catch (error) {
      testResults[1] = {
        name: 'Cafeterias',
        status: 'error',
        message: 'Failed to fetch cafeterias'
      }
      setTests([...testResults])
    }

    // Test 3: Menu Items
    testResults.push({ name: 'Menu Items', status: 'loading', message: 'Fetching menu items...' })
    setTests([...testResults])

    try {
      const menuItems = await DataService.getMenuItems(undefined, false)
      testResults[2] = {
        name: 'Menu Items',
        status: 'success',
        message: `Found ${menuItems.length} menu items`,
        data: menuItems.slice(0, 3)
      }
      setTests([...testResults])
    } catch (error) {
      testResults[2] = {
        name: 'Menu Items',
        status: 'error',
        message: 'Failed to fetch menu items'
      }
      setTests([...testResults])
    }

    // Test 4: Orders (admin access)
    testResults.push({ name: 'Orders', status: 'loading', message: 'Fetching orders...' })
    setTests([...testResults])

    try {
      const orders = await DataService.getOrders()
      testResults[3] = {
        name: 'Orders',
        status: 'success',
        message: `Found ${orders.length} orders`,
        data: orders.slice(0, 3)
      }
      setTests([...testResults])
    } catch (error) {
      testResults[3] = {
        name: 'Orders',
        status: 'error',
        message: 'Failed to fetch orders'
      }
      setTests([...testResults])
    }

    setIsRunning(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  const getIcon = (name: string) => {
    switch (name) {
      case 'Connection Test':
        return <Database className="h-4 w-4" />
      case 'Cafeterias':
        return <Coffee className="h-4 w-4" />
      case 'Menu Items':
        return <ShoppingCart className="h-4 w-4" />
      case 'Orders':
        return <Users className="h-4 w-4" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'loading':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'loading':
        return <Badge variant="secondary">Loading</Badge>
      default:
        return null
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Supabase Connection Test
          <Button
            onClick={runTests}
            disabled={isRunning}
            size="sm"
            variant="outline"
            className="ml-auto"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isRunning ? 'Running...' : 'Run Tests'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tests.map((test, index) => (
            <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getIcon(test.name)}
                <span className="font-medium">{test.name}</span>
                {getStatusIcon(test.status)}
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(test.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600">{test.message}</p>
                {test.data && test.status === 'success' && (
                  <div className="mt-2 text-xs text-gray-500">
                    <details>
                      <summary className="cursor-pointer hover:text-gray-700">
                        View sample data
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(test.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {tests.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Test Summary</h4>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600">
                ✓ {tests.filter(t => t.status === 'success').length} Passed
              </span>
              <span className="text-red-600">
                ✗ {tests.filter(t => t.status === 'error').length} Failed
              </span>
              <span className="text-blue-600">
                ⏳ {tests.filter(t => t.status === 'loading').length} Running
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
