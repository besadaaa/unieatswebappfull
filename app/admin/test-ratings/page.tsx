"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestRatingsPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const createSampleRatings = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/create-sample-ratings', {
        method: 'POST'
      })
      const result = await response.json()
      if (result.success) {
        setMessage(`✅ Sample ratings created successfully!
        
Cafeteria ratings: ${result.data.cafeteriaRatings}
Menu item ratings: ${result.data.menuItemRatings}
Cafeterias: ${result.data.cafeterias}
Menu items: ${result.data.menuItems}
Users: ${result.data.users}`)
      } else {
        setMessage(`❌ Failed to create sample ratings: ${result.error}`)
      }
    } catch (err) {
      setMessage('❌ Failed to create sample ratings')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Ratings Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-300">
              This tool creates sample ratings data for testing the cafeteria ratings screen.
              It will create random ratings for cafeterias and menu items.
            </p>
            
            <Button 
              onClick={createSampleRatings} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Creating Sample Ratings..." : "Create Sample Ratings"}
            </Button>

            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('✅') 
                  ? 'bg-green-500/10 border border-green-500/20 text-green-300' 
                  : 'bg-red-500/10 border border-red-500/20 text-red-300'
              }`}>
                <pre className="whitespace-pre-wrap text-sm">{message}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm">
              <li>Click "Create Sample Ratings" to generate test data</li>
              <li>Go to Admin → Cafeteria Ratings to see the results</li>
              <li>Check that cafeterias show ratings and recent reviews</li>
              <li>Verify that menu items display their ratings</li>
              <li>Confirm that recent reviews are shown with user names</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
