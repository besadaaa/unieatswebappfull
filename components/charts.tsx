"use client"

import { useEffect, useRef, useId, useState } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart, registerables } from "chart.js"
import { ChartExportMenu } from "@/components/chart-export-menu"
import { useChartColors } from "@/lib/chart-colors"
import { AnnotationManager } from "@/components/annotation-manager"
import { ChartAnnotations } from "@/components/chart-annotations"
import { useAnnotations } from "@/contexts/annotation-context"
import {
  getCurrentUser,
  trackAnalyticsEvent,
  logUserActivity,
  getChartConfigurations,
  saveChartConfiguration
} from "@/lib/supabase"

Chart.register(...registerables)

interface LineChartProps {
  data: number[] | { name: string; value: number }[] | number[][]
  labels?: string[]
  xKey?: string
  yKey?: string
  height: number
  lineColor?: string | string[]
  fillColor?: string | string[]
  className?: string
}

export function LineChart({ data, labels = [], xKey, yKey, height, lineColor, fillColor, className }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { LINE_CHART_COLORS, LINE_CHART_FILL_COLORS } = useChartColors()
  const chartId = useId()

  // Use provided colors or default to theme-aware colors
  const actualLineColor = lineColor || LINE_CHART_COLORS[0]
  const actualFillColor = fillColor || LINE_CHART_FILL_COLORS[0]

  // Track chart view
  useEffect(() => {
    const trackChartView = async () => {
      try {
        const user = await getCurrentUser()
        await trackAnalyticsEvent(
          user?.id || null,
          'chart_view',
          {
            chart_type: 'line',
            chart_id: chartId,
            data_points: Array.isArray(data) ? data.length : 0,
            has_labels: labels.length > 0
          },
          window.location.pathname
        )
      } catch (error) {
        console.error('Error tracking chart view:', error)
      }
    }

    trackChartView()
  }, [chartId, data, labels])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Improve resolution with device pixel ratio
    const devicePixelRatio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * devicePixelRatio
    canvas.height = rect.height * devicePixelRatio
    ctx.scale(devicePixelRatio, devicePixelRatio)

    const drawChart = () => {
      if (!ctx || !canvas) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const width = rect.width
      const chartHeight = rect.height
      const padding = { top: 20, right: 20, bottom: 30, left: 40 }
      const chartWidth = width - padding.left - padding.right
      const chartArea = chartHeight - padding.top - padding.bottom

      // Draw grid with improved clarity
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
      ctx.lineWidth = 1

      // Horizontal grid lines
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartArea / 4) * i
        ctx.beginPath()
        ctx.moveTo(padding.left, y)
        ctx.lineTo(width - padding.right, y)
        ctx.stroke()
      }

      // Check if data is multi-line (array of arrays)
      const isMultiLine = Array.isArray(data) && data.length > 0 && Array.isArray(data[0])

      // Handle different data formats
      let dataPoints: number[][] = []

      if (isMultiLine) {
        // Multi-line data
        dataPoints = data as number[][]
      } else if (Array.isArray(data) && typeof data[0] === "number") {
        // Single line data as array of numbers
        dataPoints = [data as number[]]
      } else {
        // Object data with name/value pairs
        const objData = data as { name: string; value: number }[]
        dataPoints = [objData.map((item) => item.value)]

        // If no labels provided, use names from objects
        if (labels.length === 0) {
          labels = objData.map((item) => item.name)
        }
      }

      // Ensure we have labels
      if (labels.length === 0) {
        // Generate default labels if none provided
        labels = Array.from({ length: dataPoints[0].length }, (_, i) => `Item ${i + 1}`)
      }

      // Vertical grid lines
      for (let i = 0; i < labels.length; i++) {
        const x = padding.left + (chartWidth / (labels.length - 1 || 1)) * i
        ctx.beginPath()
        ctx.moveTo(x, padding.top)
        ctx.lineTo(x, chartHeight - padding.bottom)
        ctx.stroke()
      }

      // Draw x-axis labels with better font
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"

      labels.forEach((label, i) => {
        const x = padding.left + (chartWidth / (labels.length - 1 || 1)) * i
        ctx.fillText(label, x, chartHeight - padding.bottom + 20)
      })

      // Find min and max values across all datasets
      const minValue = 0
      let maxValue = 0

      dataPoints.forEach((points) => {
        const localMax = Math.max(...points)
        if (localMax > maxValue) maxValue = localMax
      })

      maxValue *= 1.1 // Add 10% padding

      // Draw each line
      dataPoints.forEach((points, lineIndex) => {
        const currentLineColor = Array.isArray(actualLineColor)
          ? actualLineColor[lineIndex % actualLineColor.length]
          : lineIndex === 0
            ? actualLineColor
            : LINE_CHART_COLORS[lineIndex % LINE_CHART_COLORS.length]

        const currentFillColor = Array.isArray(actualFillColor)
          ? actualFillColor[lineIndex % actualFillColor.length]
          : lineIndex === 0
            ? actualFillColor
            : LINE_CHART_FILL_COLORS[lineIndex % LINE_CHART_FILL_COLORS.length]

        // Draw line
        ctx.strokeStyle = currentLineColor
        ctx.lineWidth = 2
        ctx.beginPath()

        points.forEach((value, i) => {
          // Ensure we don't exceed the number of labels
          if (i >= labels.length) return

          const x = padding.left + (chartWidth / (labels.length - 1 || 1)) * i
          const y = padding.top + chartArea - ((value - minValue) / (maxValue - minValue || 1)) * chartArea

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })

        ctx.stroke()

        // Draw fill
        const gradient = ctx.createLinearGradient(0, padding.top, 0, chartHeight - padding.bottom)
        gradient.addColorStop(0, currentFillColor)
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

        ctx.fillStyle = gradient
        ctx.beginPath()

        points.forEach((value, i) => {
          // Ensure we don't exceed the number of labels
          if (i >= labels.length) return

          const x = padding.left + (chartWidth / (labels.length - 1 || 1)) * i
          const y = padding.top + chartArea - ((value - minValue) / (maxValue - minValue || 1)) * chartArea

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })

        ctx.lineTo(
          padding.left + (chartWidth * (Math.min(points.length, labels.length) - 1)) / (labels.length - 1 || 1),
          chartHeight - padding.bottom,
        )
        ctx.lineTo(padding.left, chartHeight - padding.bottom)
        ctx.closePath()
        ctx.fill()

        // Draw points
        ctx.fillStyle = currentLineColor

        points.forEach((value, i) => {
          // Ensure we don't exceed the number of labels
          if (i >= labels.length) return

          const x = padding.left + (chartWidth / (labels.length - 1 || 1)) * i
          const y = padding.top + chartArea - ((value - minValue) / (maxValue - minValue || 1)) * chartArea

          // Outer circle
          ctx.beginPath()
          ctx.arc(x, y, 4, 0, Math.PI * 2)
          ctx.fill()

          // Inner circle
          ctx.beginPath()
          ctx.arc(x, y, 2, 0, Math.PI * 2)
          ctx.fillStyle = "#fff"
          ctx.fill()
          ctx.fillStyle = currentLineColor
        })
      })
    }

    drawChart()

    const handleResize = () => {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * devicePixelRatio
      canvas.height = rect.height * devicePixelRatio
      ctx.scale(devicePixelRatio, devicePixelRatio)
      drawChart()
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [data, labels, actualLineColor, actualFillColor, xKey, yKey, LINE_CHART_COLORS, LINE_CHART_FILL_COLORS])

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}

interface BarChartProps {
  data: { item: string; value: number }[] | number[]
  labels?: string[]
  height: number
  horizontal?: boolean
  barColor?: string
  className?: string
}

export function BarChart({ data, labels = [], height, horizontal = false, barColor, className }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { BAR_CHART_COLORS, getCategoryColor } = useChartColors()

  // Use provided color or default to theme-aware color
  const actualBarColor = barColor || BAR_CHART_COLORS[0]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const devicePixelRatio = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * devicePixelRatio
    canvas.height = canvas.offsetHeight * devicePixelRatio
    ctx.scale(devicePixelRatio, devicePixelRatio)

    const drawChart = () => {
      if (!ctx || !canvas) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const width = canvas.offsetWidth
      const chartHeight = canvas.offsetHeight
      const padding = horizontal
        ? { top: 10, right: 20, bottom: 10, left: 100 }
        : { top: 20, right: 20, bottom: 60, left: 40 }
      const chartWidth = width - padding.left - padding.right
      const chartArea = chartHeight - padding.top - padding.bottom

      // Process data
      let chartData: { label: string; value: number }[]

      if (Array.isArray(data) && typeof data[0] === "number") {
        // If labels aren't provided or don't match data length, generate default labels
        const numericData = data as number[]
        let chartLabels = labels

        if (chartLabels.length !== numericData.length) {
          chartLabels = Array.from({ length: numericData.length }, (_, i) => `Item ${i + 1}`)
        }

        chartData = numericData.map((value, i) => ({
          label: chartLabels[i],
          value,
        }))
      } else {
        chartData = (data as { item: string; value: number }[]).map((item) => ({
          label: item.item,
          value: item.value,
        }))
      }

      // Draw grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
      ctx.lineWidth = 1

      if (horizontal) {
        // Vertical grid lines
        for (let i = 0; i <= 4; i++) {
          const x = padding.left + (chartWidth / 4) * i
          ctx.beginPath()
          ctx.moveTo(x, padding.top)
          ctx.lineTo(x, chartHeight - padding.bottom)
          ctx.stroke()
        }
      } else {
        // Horizontal grid lines
        for (let i = 0; i <= 4; i++) {
          const y = padding.top + (chartArea / 4) * i
          ctx.beginPath()
          ctx.moveTo(padding.left, y)
          ctx.lineTo(width - padding.right, y)
          ctx.stroke()
        }
      }

      // Find max value
      const maxValue = Math.max(...chartData.map((d) => d.value)) * 1.1

      if (horizontal) {
        // Draw y-axis labels (item names)
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
        ctx.font = "12px sans-serif"
        ctx.textAlign = "right"

        const barHeight = Math.min(30, chartArea / chartData.length)
        const barSpacing =
          chartData.length > 1 ? (chartArea - barHeight * chartData.length) / (chartData.length - 1) : 0

        chartData.forEach((item, i) => {
          const y = padding.top + i * (barHeight + barSpacing) + barHeight / 2
          ctx.fillText(item.label, padding.left - 10, y + 4)
        })

        // Draw x-axis labels (values)
        ctx.textAlign = "center"
        for (let i = 0; i <= 4; i++) {
          const value = (maxValue / 4) * i
          const x = padding.left + (chartWidth / 4) * i
          ctx.fillText(value.toFixed(0), x, chartHeight - padding.bottom + 20)
        }

        // Draw bars
        chartData.forEach((item, i) => {
          const barWidth = (item.value / maxValue) * chartWidth
          const y = padding.top + i * (barHeight + barSpacing)

          // Use category color if available, otherwise use provided barColor
          const color = getCategoryColor(item.label) || actualBarColor
          ctx.fillStyle = color

          ctx.fillRect(padding.left, y, barWidth, barHeight)
        })
      } else {
        // Draw x-axis labels (item names)
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
        ctx.font = "12px sans-serif"
        ctx.textAlign = "center"
        ctx.save()

        const barWidth = Math.min(50, chartWidth / chartData.length)
        const barSpacing =
          chartData.length > 1 ? (chartWidth - barWidth * chartData.length) / (chartData.length - 1) : 0

        chartData.forEach((item, i) => {
          const x = padding.left + i * (barWidth + barSpacing) + barWidth / 2
          ctx.translate(x, chartHeight - padding.bottom + 10)
          ctx.rotate(-Math.PI / 4)
          ctx.fillText(item.label, 0, 0)
          ctx.rotate(Math.PI / 4)
          ctx.translate(-x, -(chartHeight - padding.bottom + 10))
        })

        ctx.restore()

        // Draw y-axis labels (values)
        ctx.textAlign = "right"
        for (let i = 0; i <= 4; i++) {
          const value = (maxValue / 4) * (4 - i)
          const y = padding.top + (chartArea / 4) * i
          ctx.fillText(value.toFixed(0), padding.left - 10, y + 4)
        }

        // Draw bars with different colors
        chartData.forEach((item, i) => {
          const barHeight = (item.value / maxValue) * chartArea
          const x = padding.left + i * (barWidth + barSpacing)

          // Use category color if available, otherwise use provided barColor or cycle through colors
          const color =
            getCategoryColor(item.label) ||
            (chartData.length <= 5 ? BAR_CHART_COLORS[i % BAR_CHART_COLORS.length] : actualBarColor)
          ctx.fillStyle = color

          ctx.fillRect(x, chartHeight - padding.bottom - barHeight, barWidth, barHeight)
        })
      }
    }

    drawChart()

    const handleResize = () => {
      if (!canvas) return
      canvas.width = canvas.offsetWidth * devicePixelRatio
      canvas.height = canvas.offsetHeight * devicePixelRatio
      ctx.scale(devicePixelRatio, devicePixelRatio)
      drawChart()
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [data, labels, horizontal, actualBarColor, BAR_CHART_COLORS, getCategoryColor])

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}

interface PieChartProps {
  data: { name: string; value: number }[]
  height: number
  className?: string
}

export function PieChart({ data, height, className }: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { getCategoryColor } = useChartColors()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const devicePixelRatio = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * devicePixelRatio
    canvas.height = canvas.offsetHeight * devicePixelRatio
    ctx.scale(devicePixelRatio, devicePixelRatio)

    const drawChart = () => {
      if (!ctx || !canvas) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const width = canvas.offsetWidth
      const chartHeight = canvas.offsetHeight
      const radius = Math.min(width, chartHeight) / 2
      const centerX = width / 2
      const centerY = chartHeight / 2

      let startAngle = 0
      const total = data.reduce((sum, item) => sum + item.value, 0)

      data.forEach((item) => {
        const sliceAngle = (2 * Math.PI * item.value) / total
        const endAngle = startAngle + sliceAngle

        // Draw slice
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, startAngle, endAngle)
        ctx.lineTo(centerX, centerY)
        ctx.fillStyle = getCategoryColor(item.name) // Use our color mapping function
        ctx.fill()

        // Update start angle for the next slice
        startAngle = endAngle
      })
    }

    drawChart()

    const handleResize = () => {
      if (!canvas) return
      canvas.width = canvas.offsetWidth * devicePixelRatio
      canvas.height = canvas.offsetHeight * devicePixelRatio
      ctx.scale(devicePixelRatio, devicePixelRatio)
      drawChart()
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [data, getCategoryColor])

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}

interface DonutChartProps {
  data: { name: string; value: number }[]
  height: number
  className?: string
}

export function DonutChart({ data, height, className }: DonutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { getCategoryColor } = useChartColors()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const devicePixelRatio = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * devicePixelRatio
    canvas.height = canvas.offsetHeight * devicePixelRatio
    ctx.scale(devicePixelRatio, devicePixelRatio)

    const drawChart = () => {
      if (!ctx || !canvas) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const width = canvas.offsetWidth
      const chartHeight = canvas.offsetHeight
      const radius = Math.min(width, chartHeight) / 2
      const innerRadius = radius * 0.5 // Adjust for donut hole size
      const centerX = width / 2
      const centerY = chartHeight / 2

      let startAngle = 0
      const total = data.reduce((sum, item) => sum + item.value, 0)

      data.forEach((item) => {
        const sliceAngle = (2 * Math.PI * item.value) / total
        const endAngle = startAngle + sliceAngle

        // Draw slice
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, startAngle, endAngle)
        ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true) // Create inner arc
        ctx.closePath()
        ctx.fillStyle = getCategoryColor(item.name) // Use our color mapping function
        ctx.fill()

        // Update start angle for the next slice
        startAngle = endAngle
      })
    }

    drawChart()

    const handleResize = () => {
      if (!canvas) return
      canvas.width = canvas.offsetWidth * devicePixelRatio
      canvas.height = canvas.offsetHeight * devicePixelRatio
      ctx.scale(devicePixelRatio, devicePixelRatio)
      drawChart()
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [data, getCategoryColor])

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}

interface AreaChartProps {
  data: { day: string; revenue: number; orders: number }[]
  height: number
  className?: string
}

export function AreaChart({ data, height, className }: AreaChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { colors } = useChartColors()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const devicePixelRatio = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * devicePixelRatio
    canvas.height = canvas.offsetHeight * devicePixelRatio
    ctx.scale(devicePixelRatio, devicePixelRatio)

    const drawChart = () => {
      if (!ctx || !canvas) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const width = canvas.offsetWidth
      const chartHeight = canvas.offsetHeight
      const padding = { top: 20, right: 20, bottom: 30, left: 40 }
      const chartWidth = width - padding.left - padding.right
      const chartArea = chartHeight - padding.top - padding.bottom

      // Find min and max values
      const revenues = data.map((item) => item.revenue)
      const maxRevenue = Math.max(...revenues) * 1.1
      const minRevenue = 0

      // Draw grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
      ctx.lineWidth = 1

      // Horizontal grid lines
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartArea / 4) * i
        ctx.beginPath()
        ctx.moveTo(padding.left, y)
        ctx.lineTo(width - padding.right, y)
        ctx.stroke()
      }

      // Draw x-axis labels
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "center"

      data.forEach((item, i) => {
        const x = padding.left + (chartWidth / (data.length - 1 || 1)) * i
        ctx.fillText(item.day, x, chartHeight - padding.bottom + 20)
      })

      // Draw area
      const gradient = ctx.createLinearGradient(0, padding.top, 0, chartHeight - padding.bottom)
      gradient.addColorStop(0, `${colors.primary}40`) // 40 = 25% opacity
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

      ctx.fillStyle = gradient
      ctx.beginPath()

      data.forEach((item, i) => {
        const x = padding.left + (chartWidth / (data.length - 1 || 1)) * i
        const y = padding.top + chartArea - ((item.revenue - minRevenue) / (maxRevenue - minRevenue || 1)) * chartArea

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.lineTo(padding.left + chartWidth, chartHeight - padding.bottom)
      ctx.lineTo(padding.left, chartHeight - padding.bottom)
      ctx.closePath()
      ctx.fill()

      // Draw line
      ctx.strokeStyle = colors.primary
      ctx.lineWidth = 2
      ctx.beginPath()

      data.forEach((item, i) => {
        const x = padding.left + (chartWidth / (data.length - 1 || 1)) * i
        const y = padding.top + chartArea - ((item.revenue - minRevenue) / (maxRevenue - minRevenue || 1)) * chartArea

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()
    }

    drawChart()

    const handleResize = () => {
      if (!canvas) return
      canvas.width = canvas.offsetWidth * devicePixelRatio
      canvas.height = canvas.offsetHeight * devicePixelRatio
      ctx.scale(devicePixelRatio, devicePixelRatio)
      drawChart()
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [data, colors])

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}

interface ChartProps {
  title: string
  description?: string
  type: "bar" | "line" | "pie" | "doughnut"
  data: number[]
  labels: string[]
  backgroundColor?: string[] | string
  borderColor?: string[] | string
  height?: number
  allowExport?: boolean
  allowAnnotations?: boolean
}

export function Charts({
  title,
  description,
  type,
  data,
  labels,
  backgroundColor,
  borderColor,
  height = 300,
  allowExport = true,
  allowAnnotations = true,
}: ChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const chartId = useId() // Generate unique ID for the chart
  const containerRef = useRef<HTMLDivElement>(null)
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 })
  const { getAnnotationsForChart } = useAnnotations ? useAnnotations() : { getAnnotationsForChart: () => [] }

  const { colors, PIE_CHART_COLORS, BAR_CHART_COLORS, getCategoryColor, generateBackgroundColors } = useChartColors()

  // Generate appropriate colors based on chart type if not provided
  const getBackgroundColors = () => {
    if (backgroundColor) return backgroundColor

    switch (type) {
      case "pie":
      case "doughnut":
        return PIE_CHART_COLORS.slice(0, data.length)
      case "bar":
        return data.length <= 5 ? BAR_CHART_COLORS.slice(0, data.length) : generateBackgroundColors([colors.primary])
      case "line":
        return generateBackgroundColors([colors.primary])
      default:
        return generateBackgroundColors([colors.primary])
    }
  }

  // Generate border colors based on chart type if not provided
  const getBorderColors = () => {
    if (borderColor) return borderColor

    switch (type) {
      case "pie":
      case "doughnut":
        return PIE_CHART_COLORS.slice(0, data.length)
      case "bar":
        return data.length <= 5 ? BAR_CHART_COLORS.slice(0, data.length) : [colors.primary]
      case "line":
        return [colors.primary]
      default:
        return [colors.primary]
    }
  }

  // Calculate y-scale function for annotations
  const calculateYScale = (value: number) => {
    if (!chartRef.current || !chartInstance.current) return 0

    const chart = chartInstance.current
    const chartArea = chart.chartArea
    const scales = chart.scales

    if (!scales.y) return 0

    return scales.y.getPixelForValue(value)
  }

  const drawChart = () => {
    if (!chartRef.current) return

    // Ensure labels and data have the same length
    if (!labels || labels.length === 0) {
      // Generate default labels if none provided
      labels = Array.from({ length: data.length }, (_, i) => `Item ${i + 1}`)
    }

    if (data.length !== labels.length) {
      console.error(`Labels length (${labels.length}) must match data length (${data.length})`)
      // Adjust data or labels to match lengths
      const adjustedLabels = [...labels]
      while (adjustedLabels.length < data.length) {
        adjustedLabels.push(`Item ${adjustedLabels.length + 1}`)
      }
      // Or trim data to match labels length
      const adjustedData = data.slice(0, Math.max(labels.length, 1))

      // Use the adjusted arrays
      labels = adjustedLabels
      data = adjustedData
    }

    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // Get colors based on chart type
    const bgColors = getBackgroundColors()
    const bdrColors = getBorderColors()

    // Use provided colors first, then category colors, then defaults
    const finalBgColors =
      type === "pie" || type === "doughnut"
        ? (backgroundColor && Array.isArray(backgroundColor) && backgroundColor.length > 0)
          ? backgroundColor // Use provided backgroundColor prop first
          : labels.map((label) => getCategoryColor(label) || (Array.isArray(bgColors) ? bgColors[0] : bgColors))
        : bgColors

    const finalBorderColors =
      type === "pie" || type === "doughnut"
        ? (borderColor && Array.isArray(borderColor) && borderColor.length > 0)
          ? borderColor // Use provided borderColor prop first
          : labels.map((label) => getCategoryColor(label) || (Array.isArray(bdrColors) ? bdrColors[0] : bdrColors))
        : bdrColors

    // Enhanced dataset configuration
    const dataset = {
      label: title,
      data,
      backgroundColor: finalBgColors,
      borderColor: finalBorderColors,
      borderWidth: type === "pie" || type === "doughnut" ? 3 : 2,
      ...(type === "line" && {
        pointBackgroundColor: finalBorderColors,
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.4,
      }),
      ...(type === "bar" && {
        borderRadius: 8,
        borderSkipped: false,
      }),
      ...(type === "pie" || type === "doughnut" && {
        hoverBorderWidth: 4,
        hoverOffset: 10,
      }),
    }

    chartInstance.current = new Chart(ctx, {
      type,
      data: {
        labels,
        datasets: [dataset],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        scales:
          type === "pie" || type === "doughnut"
            ? undefined
            : {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: "rgba(255, 255, 255, 0.1)",
                    drawBorder: false,
                  },
                  ticks: {
                    color: "rgba(255, 255, 255, 0.7)",
                    font: {
                      size: 12,
                      weight: '500',
                    },
                    padding: 10,
                  },
                  border: {
                    display: false,
                  },
                },
                x: {
                  grid: {
                    color: "rgba(255, 255, 255, 0.1)",
                    drawBorder: false,
                  },
                  ticks: {
                    color: "rgba(255, 255, 255, 0.7)",
                    font: {
                      size: 12,
                      weight: '500',
                    },
                    padding: 10,
                    maxRotation: 45,
                  },
                  border: {
                    display: false,
                  },
                },
              },
        plugins: {
          legend: {
            display: type === "pie" || type === "doughnut",
            position: "bottom",
            labels: {
              color: "rgba(255, 255, 255, 0.9)",
              padding: 20,
              usePointStyle: true,
              pointStyle: "circle",
              font: {
                size: 13,
                weight: '500',
              },
              boxWidth: 12,
              boxHeight: 12,
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            titleColor: "rgba(255, 255, 255, 0.95)",
            bodyColor: "rgba(255, 255, 255, 0.95)",
            borderColor: "rgba(255, 255, 255, 0.2)",
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            boxWidth: 12,
            boxHeight: 12,
            usePointStyle: true,
            titleFont: {
              size: 14,
              weight: '600',
            },
            bodyFont: {
              size: 13,
              weight: '500',
            },
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y ?? context.parsed;
                if (type === "pie" || type === "doughnut") {
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                }
                return `${label}: ${value}`;
              }
            }
          },
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart',
          onComplete: () => {
            if (chartRef.current && containerRef.current) {
              // Update chart dimensions for annotations
              setChartDimensions({
                width: chartRef.current.width,
                height: chartRef.current.height,
              })
            }
          },
        },
        elements: {
          point: {
            hoverRadius: 8,
          },
          bar: {
            borderRadius: 8,
          },
          arc: {
            borderWidth: 3,
            hoverBorderWidth: 4,
          },
        },
      },
    })
  }

  const { getAnnotationsForChart: safeGetAnnotationsForChart } = useAnnotations() || {
    getAnnotationsForChart: () => [],
  }
  const annotations = safeGetAnnotationsForChart(chartId)

  useEffect(() => {
    drawChart()
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, labels, type, colors])

  // Get chart padding based on chart type
  const getChartPadding = () => {
    if (type === "pie" || type === "doughnut") {
      return { top: 10, right: 10, bottom: 10, left: 10 }
    }
    return { top: 20, right: 20, bottom: 30, left: 40 }
  }

  return (
    <Card id={chartId} className="chart-container">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="chart-title">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="flex items-center gap-1">
          {allowAnnotations && <AnnotationManager chartId={chartId} chartLabels={labels} chartType={type} />}
          {allowExport && <ChartExportMenu chartId={chartId} data={data} labels={labels} title={title} />}
        </div>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} style={{ height, position: "relative" }}>
          <canvas ref={chartRef} />

          {/* Render annotations if there are any and they should be shown */}
          {annotations && annotations.length > 0 && document.getElementById(`show-annotations-${chartId}`) && (
            <ChartAnnotations
              annotations={annotations}
              chartType={type}
              chartWidth={chartDimensions.width}
              chartHeight={chartDimensions.height}
              chartPadding={getChartPadding()}
              dataLength={data.length}
              yScale={calculateYScale}
              maxValue={Math.max(...data)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
