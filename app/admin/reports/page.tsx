"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, CheckCircle2, Loader2, BarChart3, TrendingUp, Users, Package } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { PageHeader } from "@/components/admin/page-header"

interface Report {
  id: string
  name: string
  description: string
  type: string
  status: 'completed' | 'processing' | 'failed'
  created_at: string
  file_size?: string
  download_url?: string
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch existing reports
  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reports')
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }
      
      const data = await response.json()
      setReports(data.reports || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast({
        title: "Error",
        description: "Failed to load reports. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Download report function
  const downloadReport = async (report: Report) => {
    try {
      if (!report.download_url) {
        toast({
          title: "Error",
          description: "Download URL not available for this report.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(report.download_url)
      
      if (!response.ok) {
        throw new Error('Failed to download report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${report.name.replace(/\s+/g, '_')}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Report downloaded successfully.",
      })
    } catch (error) {
      console.error('Error downloading report:', error)
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'sales':
        return <BarChart3 className="h-5 w-5 text-green-500" />
      case 'analytics':
        return <TrendingUp className="h-5 w-5 text-blue-500" />
      case 'users':
        return <Users className="h-5 w-5 text-purple-500" />
      case 'inventory':
        return <Package className="h-5 w-5 text-orange-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader
        title="Reports"
        subtitle="Download available system reports"
      />

      <Card className="glass-effect border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Available Reports</h2>
            <Button 
              variant="outline" 
              onClick={fetchReports}
              className="glass-effect border-white/20 hover:border-blue-500/50"
            >
              <Loader2 className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-white">Loading reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No reports available</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="glass-effect border border-white/10 rounded-lg p-4 hover:border-white/20 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getReportIcon(report.type)}
                      <div>
                        <h3 className="font-medium text-white">{report.name}</h3>
                        <p className="text-sm text-gray-400">{report.description}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500">
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                          {report.file_size && (
                            <span className="text-xs text-gray-500">{report.file_size}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-400">Ready</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReport(report)}
                        className="glass-effect border-white/20 hover:border-green-500/50"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
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
