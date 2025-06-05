"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface TestResult {
  timestamp: string
  environment: string
  tests: Record<string, any>
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    overallStatus: string
    successRate: string
  }
}

export default function DeploymentTestPage() {
  const [testResults, setTestResults] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runTests = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/deployment-test', {
        method: 'GET',
        cache: 'no-cache'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setTestResults(data)
    } catch (err) {
      console.error('Test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'FAIL':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
        return <Badge className="bg-green-500">PASS</Badge>
      case 'FAIL':
        return <Badge variant="destructive">FAIL</Badge>
      default:
        return <Badge variant="secondary">UNKNOWN</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🚀 Deployment Test Dashboard</h1>
        <p className="text-gray-600">
          This page tests all critical functions to identify what's working and what's not in production.
        </p>
      </div>

      <div className="mb-6">
        <Button 
          onClick={runTests} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Running Tests...' : 'Run Tests'}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Test Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <p className="text-sm text-gray-600 mt-2">
              This usually means the API route itself is not working. Check Vercel function logs.
            </p>
          </CardContent>
        </Card>
      )}

      {testResults && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(testResults.summary.overallStatus)}
                Test Summary
              </CardTitle>
              <CardDescription>
                Environment: {testResults.environment} | 
                Tested at: {new Date(testResults.timestamp).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{testResults.summary.passedTests}</div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{testResults.summary.failedTests}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{testResults.summary.totalTests}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{testResults.summary.successRate}</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Individual Tests */}
          {Object.entries(testResults.tests).map(([testName, testData]) => (
            <Card key={testName}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {getStatusIcon(testData.status)}
                    {testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                  {getStatusBadge(testData.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(testData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>🔧 How to Fix Issues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-red-600">If Environment Variables FAIL:</h4>
            <p className="text-sm">Go to Vercel Dashboard → Project → Settings → Environment Variables and add all missing variables.</p>
          </div>
          <div>
            <h4 className="font-semibold text-red-600">If Supabase Connection FAILS:</h4>
            <p className="text-sm">Check that SUPABASE_SERVICE_ROLE_KEY is correctly set in Vercel environment variables.</p>
          </div>
          <div>
            <h4 className="font-semibold text-red-600">If Database Tables FAIL:</h4>
            <p className="text-sm">Check Supabase RLS policies and ensure the service role has access to tables.</p>
          </div>
          <div>
            <h4 className="font-semibold text-red-600">If Settings Service FAILS:</h4>
            <p className="text-sm">Check that the cafeteria_settings table exists and has proper structure.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
