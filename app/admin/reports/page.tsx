"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, CheckCircle2, Loader2, BarChart3, TrendingUp, Users, Package, MessageSquare } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { PageHeader } from "@/components/admin/page-header"

interface Report {
  id: string
  name: string
  type: string
  period: string
  format: string
  file_url: string
  file_size?: number
  total_records?: number
  status?: string
  created_at: string
  updated_at?: string
}

// Report type definitions
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
    id: 'feedback',
    name: 'Customer Feedback',
    description: 'Order ratings, reviews, and customer satisfaction data',
    icon: MessageSquare,
    color: 'text-pink-500'
  }
]

export default function Reports() {
  // State for report generation dialog
  const [open, setOpen] = useState(false)
  const [reportType, setReportType] = useState("")
  const [reportPeriod, setReportPeriod] = useState("")
  const [reportFormat, setReportFormat] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationComplete, setGenerationComplete] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)
  const [loading, setLoading] = useState(true)

  // Initialize loading state
  useEffect(() => {
    setLoading(false)
  }, [])

  // Function to generate a new report
  const generateReport = async () => {
    if (!reportType || !reportPeriod || !reportFormat) {
      toast({
        title: "Missing information",
        description: "Please fill out all fields to generate a report.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGenerationStep(1)

    try {
      // Simulate report generation steps
      setTimeout(() => setGenerationStep(2), 500)
      setTimeout(() => setGenerationStep(3), 1000)
      setTimeout(() => setGenerationStep(4), 1500)

      // Generate and download report directly
      setTimeout(async () => {
        try {
          await downloadReport(reportType, reportFormat)

          setIsGenerating(false)
          setGenerationComplete(true)

          // Close the dialog after a delay
          setTimeout(() => {
            setOpen(false)
            setGenerationComplete(false)
            setReportType("")
            setReportPeriod("")
            setReportFormat("")
          }, 1500)

        } catch (error) {
          console.error('Error generating report:', error)
          setIsGenerating(false)
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to generate report. Please try again.",
            variant: "destructive",
          })
        }
      }, 2000)

    } catch (error) {
      console.error('Error generating report:', error)
      setIsGenerating(false)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Function to download report
  const downloadReport = async (reportType: string, format: string) => {
    try {
      toast({
        title: "Generating Report",
        description: `Generating ${reportType} report in ${format.toUpperCase()} format...`,
      })

      console.log(`Downloading ${reportType} report in ${format} format`)

      const response = await fetch(`/api/reports/generate?type=${reportType}&format=${format}`, {
        method: 'GET',
        headers: {
          'Accept': format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      })

      if (!response.ok) {
        let errorMessage = 'Failed to generate report'
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
        throw new Error('Generated file is empty')
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
        subtitle="Access and generate comprehensive system reports"
      />

      <Card className="modern-card glass-effect hover-lift">
        <CardContent className="p-8 relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 animate-slide-in-up">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-full blur-2xl"></div>

            <div className="mt-4 md:mt-0 flex gap-3 animate-slide-in-right">
                <Button
                  className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white btn-modern shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => {
                    console.log("Opening dialog")
                    setOpen(true)
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Generate New Report
                </Button>
              </div>
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
      {/* Report Generation Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#1a1f36] border-gray-700 text-white">
          {!isGenerating && !generationComplete ? (
            <>
              <DialogHeader>
                <DialogTitle>Generate New Report</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Select the type of report you want to generate.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger id="report-type" className="bg-[#0f1424] border-gray-700">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1f36] border-gray-700">
                      {REPORT_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <type.icon className={`h-4 w-4 ${type.color}`} />
                            <div>
                              <div className="font-medium">{type.name}</div>
                              <div className="text-xs text-gray-400">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="report-period">Period</Label>
                  <Select value={reportPeriod} onValueChange={setReportPeriod}>
                    <SelectTrigger id="report-period" className="bg-[#0f1424] border-gray-700">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1f36] border-gray-700">
                      <SelectItem value="Today">Today</SelectItem>
                      <SelectItem value="Yesterday">Yesterday</SelectItem>
                      <SelectItem value="This Week">This Week</SelectItem>
                      <SelectItem value="This Month">This Month</SelectItem>
                      <SelectItem value="Last Month">Last Month</SelectItem>
                      <SelectItem value="This Year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="report-format">Format</Label>
                  <Select value={reportFormat} onValueChange={setReportFormat}>
                    <SelectTrigger id="report-format" className="bg-[#0f1424] border-gray-700">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1f36] border-gray-700">
                      <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      <SelectItem value="csv">CSV (.csv)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} className="bg-[#0f1424] border-gray-700">
                  Cancel
                </Button>
                <Button onClick={generateReport} className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  Generate
                </Button>
              </DialogFooter>
            </>
          ) : isGenerating ? (
            <div className="py-8 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <h3 className="text-lg font-medium mb-2">Generating Report</h3>
              <p className="text-sm text-gray-400 mb-4">Please wait while we generate your report.</p>

              <div className="w-full max-w-xs space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Collecting data</span>
                    <span>{generationStep >= 1 ? "Complete" : "Pending"}</span>
                  </div>
                  <div className={`h-1 rounded-full ${generationStep >= 1 ? "bg-green-500" : "bg-gray-700"}`}></div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Processing information</span>
                    <span>{generationStep >= 2 ? "Complete" : "Pending"}</span>
                  </div>
                  <div className={`h-1 rounded-full ${generationStep >= 2 ? "bg-green-500" : "bg-gray-700"}`}></div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Formatting report</span>
                    <span>{generationStep >= 3 ? "Complete" : "Pending"}</span>
                  </div>
                  <div className={`h-1 rounded-full ${generationStep >= 3 ? "bg-green-500" : "bg-gray-700"}`}></div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Finalizing</span>
                    <span>{generationStep >= 4 ? "Complete" : "Pending"}</span>
                  </div>
                  <div className={`h-1 rounded-full ${generationStep >= 4 ? "bg-green-500" : "bg-gray-700"}`}></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Report Generated Successfully</h3>
              <p className="text-sm text-gray-400">Your report has been generated and is ready to download.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
