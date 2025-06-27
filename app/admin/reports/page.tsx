"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, CheckCircle2, Loader2, BarChart3, TrendingUp, Users, Package, MessageSquare } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { PageHeader } from "@/components/admin/page-header"

const REPORT_TYPES = [
  {
    id: 'revenue',
    name: 'Admin Revenue Report',
    description: 'Actual admin revenue: 4% user fee (max 20 EGP) + 10% vendor commission',
    icon: TrendingUp,
    color: 'text-green-500'
  },
  {
    id: 'orders',
    name: 'Orders Report',
    description: 'Complete order history with payments, ratings, and customer details',
    icon: BarChart3,
    color: 'text-blue-500'
  },
  {
    id: 'users',
    name: 'Users Report',
    description: 'User profiles, activity, spending patterns, and account status',
    icon: Users,
    color: 'text-purple-500'
  },
  {
    id: 'inventory',
    name: 'Inventory Report',
    description: 'Current stock levels, low stock alerts, and inventory status',
    icon: Package,
    color: 'text-orange-500'
  },
  {
    id: 'ratings',
    name: 'Ratings Report',
    description: 'Customer feedback and ratings analysis',
    icon: MessageSquare,
    color: 'text-pink-500'
  }
]

export default function Reports() {
  const [loading, setLoading] = useState(true)

  // Initialize loading state
  useEffect(() => {
    setLoading(false)
  }, [])

  // Download report function
  const downloadReport = async (reportType: string, format: string) => {
    try {
      toast({
        title: "Downloading Report",
        description: `Downloading ${reportType} report in ${format.toUpperCase()} format...`,
      })

      console.log(`Downloading ${reportType} report in ${format} format`)

      const response = await fetch(`/api/reports/download?type=${reportType}&format=${format}`, {
        method: 'GET',
        headers: {
          'Accept': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      })

      if (!response.ok) {
        let errorMessage = 'Failed to download report'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const blob = await response.blob()

      if (blob.size === 0) {
        throw new Error('Downloaded file is empty')
      }

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url

      // Get filename from response headers or create one
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.${format}`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      a.download = filename
      document.body.appendChild(a)
      a.click()

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }, 100)

      toast({
        title: "Success",
        description: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report downloaded successfully`,
      })

    } catch (error) {
      console.error('Error downloading report:', error)
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download report. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading reports...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Reports"
        subtitle="Access and download comprehensive system reports"
      />

      <Card className="modern-card glass-effect hover-lift">
        <CardContent className="p-8 relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 animate-slide-in-up">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-full blur-2xl"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {REPORT_TYPES.map((reportType) => {
              const IconComponent = reportType.icon
              return (
                <Card key={reportType.id} className="modern-card glass-effect hover-lift cursor-pointer transition-all duration-300 hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900`}>
                        <IconComponent className={`h-6 w-6 ${reportType.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{reportType.name}</h3>
                        <p className="text-sm text-gray-400">{reportType.description}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 glass-effect border-white/20 hover:border-blue-500/50"
                        onClick={() => downloadReport(reportType.id, 'csv')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 glass-effect border-white/20 hover:border-green-500/50"
                        onClick={() => downloadReport(reportType.id, 'excel')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Excel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
