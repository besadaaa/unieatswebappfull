"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function TestStatusPage() {
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const testStatusUpdate = async () => {
    setIsLoading(true)
    setResult('Testing POST...')

    try {
      // First get a real cafeteria ID
      const cafeteriaResponse = await fetch('/api/cafeteria/status', {
        method: 'PUT'
      })
      const cafeteriaData = await cafeteriaResponse.json()

      if (cafeteriaData.success && cafeteriaData.data.length > 0) {
        const firstCafeteria = cafeteriaData.data[0]

        const response = await fetch('/api/cafeteria/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cafeteria_id: firstCafeteria.id,
            status: 'busy',
            message: 'Test message from API test',
            user_id: 'test-user'
          }),
        })

        const data = await response.json()
        setResult(JSON.stringify(data, null, 2))
      } else {
        setResult('No cafeterias found: ' + JSON.stringify(cafeteriaData, null, 2))
      }
    } catch (error) {
      setResult('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  const testStatusGet = async () => {
    setIsLoading(true)
    setResult('Testing GET all cafeterias...')

    try {
      const response = await fetch('/api/cafeteria/status', {
        method: 'PUT'
      })
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Test Cafeteria Status API</h1>
      
      <div className="space-y-4">
        <Button onClick={testStatusUpdate} disabled={isLoading}>
          Test Status Update (POST)
        </Button>
        
        <Button onClick={testStatusGet} disabled={isLoading}>
          Test Status Get (GET)
        </Button>
        
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {result || 'No result yet'}
          </pre>
        </div>
      </div>
    </div>
  )
}
