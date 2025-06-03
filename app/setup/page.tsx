"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { Loader2, CheckCircle, XCircle, Users, Shield, GraduationCap, Store } from 'lucide-react'

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [setupResults, setSetupResults] = useState<any>(null)

  const handleSetup = async () => {
    setIsLoading(true)
    setSetupResults(null)

    try {
      const response = await fetch('/api/setup-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        setSetupResults(data)
        toast({
          title: "Setup Completed!",
          description: "All users have been created successfully.",
        })
      } else {
        toast({
          title: "Setup Failed",
          description: data.error || "Failed to create users",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Setup error:', error)
      toast({
        title: "Setup Error",
        description: "An unexpected error occurred during setup",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1419] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">UniEats User Setup</h1>
          <p className="text-gray-400">
            This page will create the initial users for your UniEats application.
            <br />
            <strong className="text-yellow-400">Important:</strong> Make sure you have added your Supabase Service Role Key to .env.local
          </p>
        </div>

        <Card className="bg-[#1a1f36] border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Setup Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-400 mb-2">Before running setup:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to your Supabase Dashboard</li>
                <li>Navigate to Project Settings → API</li>
                <li>Copy the <code className="bg-gray-800 px-1 rounded">service_role</code> key</li>
                <li>Add it to your <code className="bg-gray-800 px-1 rounded">.env.local</code> file as <code className="bg-gray-800 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code></li>
                <li>Restart your development server</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <h4 className="font-semibold text-blue-400">Admin User</h4>
                </div>
                <p className="text-sm text-gray-300">
                  Email: admin@unieats.com<br />
                  Password: UniEats2025_Admin<br />
                  Role: admin
                </p>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Store className="w-4 h-4 text-green-400" />
                  <h4 className="font-semibold text-green-400">Cafeteria Owner</h4>
                </div>
                <p className="text-sm text-gray-300">
                  Email: cafeteria@unieats.com<br />
                  Password: UniEats2025_Cafe<br />
                  Role: cafeteria_owner
                </p>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                  <h4 className="font-semibold text-purple-400">Student User</h4>
                </div>
                <p className="text-sm text-gray-300">
                  Email: student@unieats.com<br />
                  Password: UniEats2025_Student<br />
                  Role: student
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            onClick={handleSetup}
            disabled={isLoading}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Users...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Create Users
              </>
            )}
          </Button>
        </div>

        {setupResults && (
          <Card className="bg-[#1a1f36] border-gray-700 mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Setup Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {setupResults.results.admin && (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Admin user created successfully</span>
                  </div>
                )}
                
                {setupResults.results.cafeteria && (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Cafeteria owner created successfully</span>
                  </div>
                )}
                
                {setupResults.results.student && (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Student user created successfully</span>
                  </div>
                )}

                {setupResults.results.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-red-400">Errors:</h4>
                    {setupResults.results.errors.map((error: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-red-400">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">{error}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mt-6">
                  <h4 className="font-semibold text-green-400 mb-2">✅ Setup Complete!</h4>
                  <p className="text-sm text-gray-300 mb-4">
                    You can now sign in with any of the created accounts. After testing, remember to:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                    <li>Delete the <code className="bg-gray-800 px-1 rounded">/app/setup</code> folder</li>
                    <li>Delete the <code className="bg-gray-800 px-1 rounded">/app/api/setup-users</code> folder</li>
                    <li>Remove the service role key from production environment</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
