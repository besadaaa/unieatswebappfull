import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

// Function to export data as CSV
export async function exportAsCSV(data: any[], labels: string[], title: string) {
  // Create CSV header row
  let csvContent = "data:text/csv;charset=utf-8,"
  csvContent += `${title}\n`
  csvContent += `Date,Value\n`

  // Add data rows
  data.forEach((value, index) => {
    const label = labels[index] || `Item ${index + 1}`
    csvContent += `${label},${value}\n`
  })

  // Create download link
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute(
    "download",
    `${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`,
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  return true
}

// Function to export multiple datasets as CSV
export async function exportMultipleAsCSV(datasets: { title: string; data: any[]; labels: string[] }[]) {
  // Create CSV header row
  let csvContent = "data:text/csv;charset=utf-8,"
  csvContent += `UniEats Analytics Export - ${new Date().toLocaleDateString()}\n\n`

  // Add each dataset
  for (const dataset of datasets) {
    csvContent += `${dataset.title}\n`
    csvContent += `Date,Value\n`

    // Add data rows
    dataset.data.forEach((value, index) => {
      const label = dataset.labels[index] || `Item ${index + 1}`
      csvContent += `${label},${value}\n`
    })

    csvContent += `\n\n`
  }

  // Create download link
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", `unieats-analytics-export-${new Date().toISOString().split("T")[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  return true
}

// Function to export charts as PDF
export async function exportAsPDF(elementIds: string[], title: string) {
  try {
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
    for (let i = 0; i < elementIds.length; i++) {
      const element = document.getElementById(elementIds[i])
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
    pdf.save(`${title.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`)

    return true
  } catch (error) {
    console.error("Error generating PDF:", error)
    return false
  }
}

// Function to export all analytics as PDF
export async function exportAllAnalyticsAsPDF(tabId: string) {
  try {
    // Show loading toast
    const loadingToast = document.createElement("div")
    loadingToast.className =
      "fixed bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2"
    loadingToast.innerHTML = `
      <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Generating PDF report...</span>
    `
    document.body.appendChild(loadingToast)

    // Get active tab content
    const tabContent = document.querySelector(`[data-state="active"][data-tab="${tabId}"]`)
    if (!tabContent) {
      document.body.removeChild(loadingToast)
      throw new Error("Tab content not found")
    }

    // Create PDF document
    const pdf = new jsPDF("p", "mm", "a4")
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10

    // Add title and header
    pdf.setFontSize(20)
    pdf.text("UniEats Analytics Report", margin, margin + 10)

    pdf.setFontSize(12)
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, margin + 20)
    pdf.text(`Tab: ${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`, margin, margin + 28)

    let yPosition = margin + 40

    // Find all chart containers in the tab
    const chartContainers = tabContent.querySelectorAll(".chart-container")

    // For each chart
    for (let i = 0; i < chartContainers.length; i++) {
      const container = chartContainers[i] as HTMLElement

      // Get chart title
      const titleElement = container.querySelector(".chart-title")
      const chartTitle = titleElement ? titleElement.textContent || `Chart ${i + 1}` : `Chart ${i + 1}`

      try {
        // Capture chart as canvas
        const canvas = await html2canvas(container, {
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
      } catch (err) {
        console.error(`Error capturing chart ${i}:`, err)
      }
    }

    // Remove loading toast
    document.body.removeChild(loadingToast)

    // Show success toast
    const successToast = document.createElement("div")
    successToast.className = "fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50"
    successToast.textContent = "PDF report generated successfully!"
    document.body.appendChild(successToast)

    // Remove success toast after 3 seconds
    setTimeout(() => {
      document.body.removeChild(successToast)
    }, 3000)

    // Save PDF
    pdf.save(`unieats-analytics-${tabId}-${new Date().toISOString().split("T")[0]}.pdf`)

    return true
  } catch (error) {
    console.error("Error generating PDF:", error)

    // Show error toast
    const errorToast = document.createElement("div")
    errorToast.className = "fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50"
    errorToast.textContent = "Error generating PDF report. Please try again."
    document.body.appendChild(errorToast)

    // Remove error toast after 3 seconds
    setTimeout(() => {
      document.body.removeChild(errorToast)
    }, 3000)

    return false
  }
}

// Function to export data as Excel
export async function exportAsExcel(datasets: { title: string; data: any[]; labels: string[] }[]) {
  try {
    // Show loading toast
    const loadingToast = document.createElement("div")
    loadingToast.className =
      "fixed bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2"
    loadingToast.innerHTML = `
      <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Generating Excel file...</span>
    `
    document.body.appendChild(loadingToast)

    // Create CSV content with Excel compatibility
    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += `UniEats Analytics Export\n`
    csvContent += `Generated on,${new Date().toLocaleDateString()}\n\n`

    // Add each dataset
    for (const dataset of datasets) {
      csvContent += `${dataset.title}\n`
      csvContent += `Date,Value\n`

      // Add data rows
      dataset.data.forEach((value, index) => {
        const label = dataset.labels[index] || `Item ${index + 1}`
        csvContent += `${label},${value}\n`
      })

      csvContent += `\n\n`
    }

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `unieats-analytics-excel-${new Date().toISOString().split("T")[0]}.csv`)

    // Remove loading toast
    document.body.removeChild(loadingToast)

    // Show success toast
    const successToast = document.createElement("div")
    successToast.className = "fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50"
    successToast.textContent = "Excel file generated successfully!"
    document.body.appendChild(successToast)

    // Remove success toast after 3 seconds
    setTimeout(() => {
      document.body.removeChild(successToast)
    }, 3000)

    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    return true
  } catch (error) {
    console.error("Error generating Excel file:", error)

    // Show error toast
    const errorToast = document.createElement("div")
    errorToast.className = "fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50"
    errorToast.textContent = "Error generating Excel file. Please try again."
    document.body.appendChild(errorToast)

    // Remove error toast after 3 seconds
    setTimeout(() => {
      document.body.removeChild(errorToast)
    }, 3000)

    return false
  }
}
