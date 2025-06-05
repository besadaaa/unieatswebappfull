"use client"

import FileSaver from "file-saver"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { useTheme } from "@/components/theme-context"
import { createExportLog, updateExportLog, getCurrentUser } from "./supabase"

// Helper function to get chart data from a Chart.js instance
export const getChartData = (chartInstance: any) => {
  if (!chartInstance) return null

  const labels = chartInstance.data.labels
  const datasets = chartInstance.data.datasets

  return {
    labels,
    datasets,
  }
}

// Export chart as PNG image
export const exportChartAsPNG = async (chartId: string, fileName: string) => {
  const chartElement = document.getElementById(chartId)
  if (!chartElement) {
    console.error(`Chart element with ID ${chartId} not found`)
    return
  }

  let exportLogId: string | null = null

  try {
    // Create export log
    const user = await getCurrentUser()
    if (user) {
      exportLogId = await createExportLog({
        user_id: user.id,
        export_type: 'chart',
        file_format: 'png',
        file_name: `${fileName}.png`,
        status: 'pending'
      })
    }

    const canvas = await html2canvas(chartElement, {
      backgroundColor: null, // Transparent background
      scale: 2, // Higher resolution
    })

    canvas.toBlob(async (blob) => {
      if (blob) {
        FileSaver.saveAs(blob, `${fileName}.png`)

        // Update export log on success
        if (exportLogId) {
          await updateExportLog(exportLogId, {
            status: 'completed',
            file_size: blob.size
          })
        }
      }
    })
  } catch (error) {
    console.error("Error exporting chart as PNG:", error)

    // Update export log on error
    if (exportLogId) {
      await updateExportLog(exportLogId, {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

// Export chart data as CSV
export const exportChartAsCSV = async (chartInstance: any, fileName: string) => {
  const chartData = getChartData(chartInstance)
  if (!chartData) {
    console.error("No chart data available")
    return
  }

  let exportLogId: string | null = null

  try {
    // Create export log
    const user = await getCurrentUser()
    if (user) {
      exportLogId = await createExportLog({
        user_id: user.id,
        export_type: 'chart',
        file_format: 'csv',
        file_name: `${fileName}.csv`,
        status: 'pending'
      })
    }

    const { labels, datasets } = chartData

    // Create CSV header row
    let csvContent = "Labels"
    datasets.forEach((dataset: any) => {
      csvContent += `,${dataset.label || "Dataset"}`
    })
    csvContent += "\n"

    // Add data rows
    labels.forEach((label: string, index: number) => {
      csvContent += `${label}`
      datasets.forEach((dataset: any) => {
        csvContent += `,${dataset.data[index]}`
      })
      csvContent += "\n"
    })

    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    FileSaver.saveAs(blob, `${fileName}.csv`)

    // Update export log on success
    if (exportLogId) {
      await updateExportLog(exportLogId, {
        status: 'completed',
        file_size: blob.size
      })
    }
  } catch (error) {
    console.error("Error exporting chart as CSV:", error)

    // Update export log on error
    if (exportLogId) {
      await updateExportLog(exportLogId, {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

// Export chart data as Excel
export const exportChartAsExcel = (chartInstance: any, fileName: string) => {
  const chartData = getChartData(chartInstance)
  if (!chartData) {
    console.error("No chart data available")
    return
  }

  const { labels, datasets } = chartData

  // Create worksheet data
  const wsData = [["Labels", ...datasets.map((d: any) => d.label || "Dataset")]]

  labels.forEach((label: string, index: number) => {
    wsData.push([label, ...datasets.map((dataset: any) => dataset.data[index])])
  })

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Chart Data")

  // Generate and download Excel file
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

// Export chart as PDF
export const exportChartAsPDF = async (chartId: string, fileName: string, title?: string) => {
  const chartElement = document.getElementById(chartId)
  if (!chartElement) {
    console.error(`Chart element with ID ${chartId} not found`)
    return
  }

  try {
    const canvas = await html2canvas(chartElement, {
      backgroundColor: null,
      scale: 2,
    })

    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
    })

    // Add title if provided
    if (title) {
      pdf.setFontSize(16)
      pdf.text(title, 14, 15)
      pdf.setFontSize(12)
    }

    // Calculate dimensions to maintain aspect ratio
    const imgWidth = 280
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // Add image to PDF
    pdf.addImage(imgData, "PNG", 10, title ? 25 : 10, imgWidth, imgHeight)

    // Save PDF
    pdf.save(`${fileName}.pdf`)
  } catch (error) {
    console.error("Error exporting chart as PDF:", error)
  }
}

// Export all charts from a container
export const exportAllChartsAsPNG = async (containerId: string, fileNamePrefix: string) => {
  const container = document.getElementById(containerId)
  if (!container) {
    console.error(`Container with ID ${containerId} not found`)
    return
  }

  const chartElements = container.querySelectorAll('[id^="chart-"]')

  for (let i = 0; i < chartElements.length; i++) {
    const chartElement = chartElements[i] as HTMLElement
    const chartId = chartElement.id
    const chartTitle = chartElement.getAttribute("data-title") || `chart-${i + 1}`

    await exportChartAsPNG(chartId, `${fileNamePrefix}-${chartTitle}`)
  }
}

// Export all charts as a single PDF
export const exportAllChartsAsPDF = async (containerId: string, fileName: string) => {
  const container = document.getElementById(containerId)
  if (!container) {
    console.error(`Container with ID ${containerId} not found`)
    return
  }

  const chartElements = container.querySelectorAll('[id^="chart-"]')
  if (chartElements.length === 0) {
    console.error("No charts found in container")
    return
  }

  try {
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
    })

    let currentPage = 0

    for (let i = 0; i < chartElements.length; i++) {
      const chartElement = chartElements[i] as HTMLElement
      const chartTitle = chartElement.getAttribute("data-title") || `Chart ${i + 1}`

      // Add new page if not the first chart
      if (i > 0) {
        pdf.addPage()
        currentPage++
      }

      // Add title
      pdf.setFontSize(16)
      pdf.text(chartTitle, 14, 15)

      // Convert chart to image
      const canvas = await html2canvas(chartElement, {
        backgroundColor: null,
        scale: 2,
      })

      const imgData = canvas.toDataURL("image/png")

      // Calculate dimensions to maintain aspect ratio
      const imgWidth = 280
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Add image to PDF
      pdf.addImage(imgData, "PNG", 10, 25, imgWidth, imgHeight)
    }

    // Save PDF
    pdf.save(`${fileName}.pdf`)
  } catch (error) {
    console.error("Error exporting charts as PDF:", error)
  }
}

// Hook for theme-aware chart export
export function useChartExport() {
  const { theme } = useTheme()

  return {
    exportChartAsPNG,
    exportChartAsCSV,
    exportChartAsExcel,
    exportChartAsPDF,
    exportAllChartsAsPNG,
    exportAllChartsAsPDF,

    // Theme-aware export options
    getExportOptions: () => ({
      backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
      color: theme === "dark" ? "#ffffff" : "#000000",
    }),
  }
}

// Function to export chart as image (PNG)
export async function exportChartAsImage(chartId: string, fileName?: string) {
  const chartElement = document.getElementById(chartId)
  if (!chartElement) {
    console.error(`Chart element with ID ${chartId} not found`)
    return
  }

  try {
    const canvas = await html2canvas(chartElement, {
      backgroundColor: null, // Transparent background
      scale: 2, // Higher resolution
    })

    canvas.toBlob((blob) => {
      if (blob) {
        FileSaver.saveAs(blob, fileName || `chart-${new Date().toISOString().split("T")[0]}.png`)
      }
    })
  } catch (error) {
    console.error("Error exporting chart as PNG:", error)
  }
}

// Function to export chart data as CSV
export function exportChartDataAsCSV(data: number[], labels: string[], title: string, fileName?: string) {
  try {
    // Show loading toast
    showToast("Generating CSV...", "loading")

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += `${title}\n`
    csvContent += "Label,Value\n"

    // Add data rows
    data.forEach((value, index) => {
      const label = labels[index] || `Item ${index + 1}`
      csvContent += `"${label}",${value}\n`
    })

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute(
      "download",
      fileName || `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast("CSV exported successfully", "success")
    return true
  } catch (error) {
    console.error("Error exporting chart data as CSV:", error)
    showToast("Failed to export CSV", "error")
    return false
  }
}

// Function to export multiple charts as PDF
export async function exportChartsAsPDF(chartIds: string[], title: string, fileName?: string) {
  try {
    // Show loading toast
    showToast("Generating PDF...", "loading")

    // Create PDF document
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10

    // Add title
    pdf.setFontSize(18)
    pdf.text(title, margin, margin + 10)
    pdf.setFontSize(12)
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, margin + 18)

    let yPosition = margin + 30

    // For each chart element
    for (let i = 0; i < chartIds.length; i++) {
      const element = document.getElementById(chartIds[i])
      if (!element) continue

      // Get chart title
      const titleElement = element.querySelector(".chart-title")
      const chartTitle = titleElement ? titleElement.textContent || `Chart ${i + 1}` : `Chart ${i + 1}`

      // Capture chart as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      })

      // Calculate dimensions to fit in PDF
      const imgWidth = pageWidth - margin * 2
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Check if chart will fit on current page
      if (yPosition + imgHeight + 10 > pageHeight) {
        pdf.addPage()
        yPosition = margin
      }

      // Add chart title
      pdf.setFontSize(14)
      pdf.text(chartTitle, margin, yPosition + 5)
      yPosition += 10

      // Add chart image
      const imgData = canvas.toDataURL("image/png")
      pdf.addImage(imgData, "PNG", margin, yPosition, imgWidth, imgHeight)

      // Update position for next chart
      yPosition += imgHeight + 15
    }

    // Save PDF
    pdf.save(fileName || `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`)

    showToast("PDF exported successfully", "success")
    return true
  } catch (error) {
    console.error("Error generating PDF:", error)
    showToast("Failed to export PDF", "error")
    return false
  }
}

// Function to export chart data as Excel (XLSX)
export function exportChartDataAsExcel(
  datasets: { title: string; data: number[]; labels: string[] }[],
  fileName?: string,
) {
  try {
    // Show loading toast
    showToast("Generating Excel file...", "loading")

    // Create CSV content with Excel compatibility
    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += `UniEats Analytics Export\n`
    csvContent += `Generated on,${new Date().toLocaleDateString()}\n\n`

    // Add each dataset
    for (const dataset of datasets) {
      csvContent += `${dataset.title}\n`
      csvContent += "Label,Value\n"

      // Add data rows
      dataset.data.forEach((value, index) => {
        const label = dataset.labels[index] || `Item ${index + 1}`
        csvContent += `"${label}",${value}\n`
      })

      csvContent += `\n\n`
    }

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", fileName || `unieats-analytics-excel-${new Date().toISOString().split("T")[0]}.csv`)

    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast("Excel file exported successfully", "success")
    return true
  } catch (error) {
    console.error("Error generating Excel file:", error)
    showToast("Failed to export Excel file", "error")
    return false
  }
}

// Toast notification helper
function showToast(message: string, type: "success" | "error" | "loading") {
  // Remove any existing toasts
  const existingToast = document.querySelector(".export-toast")
  if (existingToast) {
    document.body.removeChild(existingToast)
  }

  // Create toast element
  const toast = document.createElement("div")
  toast.className = `export-toast fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg z-50 ${
    type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-black/80"
  } text-white flex items-center gap-2`

  // Add icon based on type
  if (type === "loading") {
    toast.innerHTML = `
      <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    `
  } else if (type === "success") {
    toast.innerHTML = `
      <svg class="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    `
  } else {
    toast.innerHTML = `
      <svg class="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    `
  }

  // Add message
  const messageSpan = document.createElement("span")
  messageSpan.textContent = message
  toast.appendChild(messageSpan)

  // Add to document
  document.body.appendChild(toast)

  // Remove after delay (except for loading)
  if (type !== "loading") {
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast)
      }
    }, 3000)
  }

  return toast
}
