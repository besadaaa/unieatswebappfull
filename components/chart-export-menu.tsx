"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, ImageIcon, FileText, FileIcon as FilePdf, RefreshCw } from "lucide-react"
import { exportChartAsImage, exportChartDataAsCSV, exportChartsAsPDF } from "@/lib/chart-export-utils"

interface ChartExportMenuProps {
  chartId: string
  data: number[]
  labels: string[]
  title: string
  className?: string
}

export function ChartExportMenu({ chartId, data, labels, title, className }: ChartExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (type: "image" | "csv" | "pdf") => {
    setIsExporting(true)

    try {
      switch (type) {
        case "image":
          await exportChartAsImage(chartId, `${title.toLowerCase().replace(/\s+/g, "-")}.png`)
          break
        case "csv":
          exportChartDataAsCSV(data, labels, title)
          break
        case "pdf":
          await exportChartsAsPDF([chartId], title)
          break
      }
    } catch (error) {
      console.error(`Error exporting chart as ${type}:`, error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isExporting} className={className}>
          {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isExporting} onClick={() => handleExport("image")}>
          <ImageIcon className="mr-2 h-4 w-4" />
          <span>Export as Image</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isExporting} onClick={() => handleExport("csv")}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Export as CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isExporting} onClick={() => handleExport("pdf")}>
          <FilePdf className="mr-2 h-4 w-4" />
          <span>Export as PDF</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
