"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { Pie } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, type ChartOptions, type ChartData } from "chart.js"
import { useChartColors } from "@/lib/theme-aware-colors"
import { useTheme } from "@/components/theme-context"

ChartJS.register(ArcElement, Tooltip, Legend)

interface PieChartProps {
  data: number[]
  labels: string[]
  title?: string
  showLegend?: boolean
  legendPosition?: "top" | "bottom" | "left" | "right"
  height?: number
  width?: number
  className?: string
  id?: string
  borderWidth?: number
  cutout?: string | number
  hoverOffset?: number
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  labels,
  title = "",
  showLegend = true,
  legendPosition = "right",
  height = 300,
  width = 300,
  className = "",
  id = "pie-chart",
  borderWidth = 1,
  cutout = 0,
  hoverOffset = 10,
}) => {
  const chartRef = useRef<ChartJS>(null)
  const chartColors = useChartColors()
  const { theme } = useTheme()
  const [chartData, setChartData] = useState<ChartData<"pie">>({
    labels: [],
    datasets: [],
  })
  const [chartOptions, setChartOptions] = useState<ChartOptions<"pie">>({})

  // Update chart data when props change
  useEffect(() => {
    // Validate and normalize data and labels
    let normalizedData = data || []
    let normalizedLabels = labels || []

    if (!normalizedData.length || !normalizedLabels.length) {
      return
    }

    // Ensure data and labels have the same length
    if (normalizedData.length !== normalizedLabels.length) {
      const minLength = Math.min(normalizedData.length, normalizedLabels.length)
      if (minLength === 0) return

      normalizedData = normalizedData.slice(0, minLength)
      normalizedLabels = normalizedLabels.slice(0, minLength)
    }

    const chartData: ChartData<"pie"> = {
      labels: normalizedLabels,
      datasets: [
        {
          data: normalizedData,
          backgroundColor: chartColors.getPalette(normalizedData.length),
          borderColor: theme === "dark" ? "#1f2937" : "#ffffff",
          borderWidth,
          hoverOffset,
        },
      ],
    }

    const options: ChartOptions<"pie"> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showLegend,
          position: legendPosition,
          labels: {
            color: chartColors.text,
            padding: 20,
            font: {
              size: 12,
            },
          },
        },
        title: {
          display: !!title,
          text: title,
          color: chartColors.text,
          font: {
            size: 16,
            weight: "bold",
          },
          padding: {
            top: 10,
            bottom: 20,
          },
        },
        tooltip: {
          backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
          titleColor: theme === "dark" ? "#ffffff" : "#000000",
          bodyColor: theme === "dark" ? "#d1d5db" : "#374151",
          borderColor: theme === "dark" ? "#374151" : "#e5e7eb",
          borderWidth: 1,
          padding: 10,
          cornerRadius: 6,
          displayColors: true,
          callbacks: {
            label: (context) => {
              const label = context.label || ""
              const value = context.raw as number
              const total = (context.chart.data.datasets[0].data as number[]).reduce((a, b) => a + b, 0)
              const percentage = Math.round((value / total) * 100)
              return `${label}: ${value} (${percentage}%)`
            },
          },
        },
      },
      cutout: cutout,
    }

    setChartData(chartData)
    setChartOptions(options)
  }, [data, labels, title, showLegend, legendPosition, borderWidth, cutout, hoverOffset, theme, chartColors])

  // Validate and normalize data and labels
  let normalizedData = data || []
  let normalizedLabels = labels || []

  // Handle empty or invalid data
  if (!normalizedData.length || !normalizedLabels.length) {
    return (
      <div className={`relative ${className}`} style={{ height, width }} id={id}>
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          No data available
        </div>
      </div>
    )
  }

  // Ensure data and labels have the same length
  if (normalizedData.length !== normalizedLabels.length) {
    const minLength = Math.min(normalizedData.length, normalizedLabels.length)
    if (minLength === 0) {
      return (
        <div className={`relative ${className}`} style={{ height, width }} id={id}>
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            No data available
          </div>
        </div>
      )
    }

    // Trim to the shorter length
    normalizedData = normalizedData.slice(0, minLength)
    normalizedLabels = normalizedLabels.slice(0, minLength)
    console.warn(`PieChart: Data and labels length mismatch. Trimmed to ${minLength} items.`)
  }

  return (
    <div className={`relative ${className}`} style={{ height, width }} id={id}>
      <Pie ref={chartRef} data={chartData} options={chartOptions} />
    </div>
  )
}
