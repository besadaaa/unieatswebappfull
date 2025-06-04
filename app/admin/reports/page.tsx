"use client"

import { useState, useEffect } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Download, FileText, CheckCircle2, Loader2 } from "lucide-react"
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
import { supabase } from "@/lib/supabase"
import { PageHeader } from "@/components/admin/page-header"

interface Report {
  id: string
  name: string
  type: string
  period: string
  generated: string
  format: string
  file_url?: string
  file_size?: number
}

export default function Reports() {
  // State for reports and search
  const [reports, setReports] = useState<Report[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  // State for report generation dialog
  const [open, setOpen] = useState(false)
  const [reportType, setReportType] = useState("")
  const [reportPeriod, setReportPeriod] = useState("")
  const [reportFormat, setReportFormat] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationComplete, setGenerationComplete] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)

  const [reportTypeFilter, setReportTypeFilter] = useState("All Types")

  // Load reports from API
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true)

        const response = await fetch('/api/reports')
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch reports')
        }

        setReports(data.reports || [])
        setFilteredReports(data.reports || [])

      } catch (error) {
        console.error('Error loading reports:', error)
        toast({
          title: "Error",
          description: "Failed to load reports. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [])

  // Filter reports based on search term
  useEffect(() => {
    let filtered = reports

    // Filter by search term
    if (searchTerm.trim() !== "") {
      const lowercasedSearch = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (report) =>
          report.name.toLowerCase().includes(lowercasedSearch) ||
          report.type.toLowerCase().includes(lowercasedSearch) ||
          report.period.toLowerCase().includes(lowercasedSearch) ||
          report.generated.toLowerCase().includes(lowercasedSearch) ||
          report.format.toLowerCase().includes(lowercasedSearch),
      )
    }

    // Filter by report type
    if (reportTypeFilter !== "All Types") {
      filtered = filtered.filter((report) => report.type === reportTypeFilter)
    }

    setFilteredReports(filtered)
  }, [searchTerm, reports, reportTypeFilter])

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

      // Generate report via API
      setTimeout(async () => {
        try {
          const response = await fetch('/api/reports', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              reportType,
              reportPeriod,
              reportFormat
            })
          })

          const data = await response.json()

          if (!data.success) {
            throw new Error(data.error || 'Failed to generate report')
          }

          // Add the new report to the local state
          const newReport = data.report
          setReports([newReport, ...reports])
          setFilteredReports([newReport, ...filteredReports])

          setIsGenerating(false)
          setGenerationComplete(true)

          // Close the dialog after a delay
          setTimeout(() => {
            setOpen(false)
            setGenerationComplete(false)
            setReportType("")
            setReportPeriod("")
            setReportFormat("")

            toast({
              title: "Report Generated",
              description: `Your ${reportType} report has been generated successfully.`,
            })
          }, 1500)

        } catch (error) {
          console.error('Error generating report:', error)
          setIsGenerating(false)
          toast({
            title: "Error",
            description: "Failed to generate report. Please try again.",
            variant: "destructive",
          })
        }
      }, 2000)

    } catch (error) {
      console.error('Error generating report:', error)
      setIsGenerating(false)
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Function to create sample data for testing
  const createSampleData = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/admin/sample-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to create sample data')
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: `Sample data created: ${result.data.orders_created} orders, ${result.data.total_revenue} EGP revenue`,
        })
      } else {
        throw new Error(result.error || 'Failed to create sample data')
      }
    } catch (error) {
      console.error('Error creating sample data:', error)
      toast({
        title: "Error",
        description: "Failed to create sample data",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Function to download a report
  const downloadReport = async (report: Report) => {
    try {
      // Extract filename from file_url
      const filename = report.file_url.split('/').pop()
      if (!filename) {
        throw new Error('Invalid file URL')
      }

      // Make request to download API
      const response = await fetch(report.file_url)

      if (!response.ok) {
        throw new Error('Failed to download report')
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${report.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.${report.format.toLowerCase()}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Download Started",
        description: `${report.name} is being downloaded.`,
      })

    } catch (error) {
      console.error('Error downloading report:', error)
      toast({
        title: "Download Failed",
        description: "Failed to download the report. Please try again.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    function handleClickOutside(event) {
      const dropdown = document.getElementById("typeDropdown")
      if (
        dropdown &&
        !dropdown.contains(event.target) &&
        !event.target.closest("button")?.contains(dropdown.previousElementSibling)
      ) {
        dropdown.classList.add("hidden")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

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
                  variant="outline"
                  className="glass-effect border-white/20 hover:border-blue-500/50 btn-modern"
                  onClick={createSampleData}
                  disabled={isGenerating}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Create Sample Data
                </Button>
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

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                <Input
                  placeholder="Search reports..."
                  className="pl-10 bg-[#0f1424] border-gray-700 focus-visible:ring-1 focus-visible:ring-gray-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <div className="relative">
                  <Button
                    variant="outline"
                    className="bg-[#0f1424] border-gray-700 flex items-center"
                    onClick={() => document.getElementById("typeDropdown").classList.toggle("hidden")}
                  >
                    {reportTypeFilter}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-2"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </Button>
                  <div
                    id="typeDropdown"
                    className="absolute z-10 mt-1 hidden w-full bg-[#1a1f36] border border-gray-700 rounded-md shadow-lg"
                  >
                    <div className="py-1">
                      <button
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-[#0f1424]"
                        onClick={() => {
                          setReportTypeFilter("All Types")
                          document.getElementById("typeDropdown").classList.add("hidden")
                        }}
                      >
                        All Types
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-[#0f1424]"
                        onClick={() => {
                          setReportTypeFilter("Revenue")
                          document.getElementById("typeDropdown").classList.add("hidden")
                        }}
                      >
                        Revenue
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-[#0f1424]"
                        onClick={() => {
                          setReportTypeFilter("Performance")
                          document.getElementById("typeDropdown").classList.add("hidden")
                        }}
                      >
                        Performance
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-[#0f1424]"
                        onClick={() => {
                          setReportTypeFilter("Users")
                          document.getElementById("typeDropdown").classList.add("hidden")
                        }}
                      >
                        Users
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-[#0f1424]"
                        onClick={() => {
                          setReportTypeFilter("Orders")
                          document.getElementById("typeDropdown").classList.add("hidden")
                        }}
                      >
                        Orders
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-[#0f1424]"
                        onClick={() => {
                          setReportTypeFilter("Feedback")
                          document.getElementById("typeDropdown").classList.add("hidden")
                        }}
                      >
                        Feedback
                      </button>
                    </div>
                  </div>
                </div>

                <Button variant="ghost" size="icon" className="h-10 w-10 bg-[#0f1424] border border-gray-700">
                  <Filter size={18} />
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Report Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Period</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Generated</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Format</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.length > 0 ? (
                    filteredReports.map((report) => (
                      <tr key={report.id} className="border-b border-gray-800">
                        <td className="py-4 px-4">{report.name}</td>
                        <td className="py-4 px-4">{report.type}</td>
                        <td className="py-4 px-4">{report.period}</td>
                        <td className="py-4 px-4">{report.generated}</td>
                        <td className="py-4 px-4">{report.format}</td>
                        <td className="py-4 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => downloadReport(report)}
                          >
                            <Download size={16} className="mr-2" />
                            Download
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 px-4 text-center text-gray-400">
                        No reports found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                      <SelectItem value="Revenue">Revenue</SelectItem>
                      <SelectItem value="Performance">Performance</SelectItem>
                      <SelectItem value="Users">Users</SelectItem>
                      <SelectItem value="Orders">Orders</SelectItem>
                      <SelectItem value="Feedback">Feedback</SelectItem>
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
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
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
