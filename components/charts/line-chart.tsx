"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type ChartData,
} from "chart.js"
import { useChartColors } from "@/lib/theme-aware-colors"
import { useTheme } from "@/components/theme-context"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface LineChartProps {
  data: number[]
  labels: string[]
  title?: string
  fill?: boolean
  tension?: number
  borderWidth?: number
  pointRadius?: number
  showLegend?: boolean
  legendPosition?: "top" | "bottom" | "left" | "right"
  height?: number
  width?: number
  yAxisTitle?: string
  xAxisTitle?: string
  datasetLabel?: string
  className?: string
  id?: string
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  labels,
  title = "",
  fill = false,
  tension = 0.4,
  borderWidth = 2,
  pointRadius = 3,
  showLegend = true,
  legendPosition = "top",
  height = 300,
  width = 600,
  yAxisTitle = "",
  xAxisTitle = "",
  datasetLabel = "Data",
  className = "",
  id = "line-chart",
}) => {
  const chartRef = useRef<ChartJS>(null)
  const chartColors = useChartColors()
  const { theme } = useTheme()
  const [chartData, setChartData] = useState<ChartData<"line">>({
    labels: [],
    datasets: [],
  })
  const [chartOptions, setChartOptions] = useState<ChartOptions<"line">>({})

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

    const chartData: ChartData<"line"> = {
      labels: normalizedLabels,
      datasets: [
        {
          label: datasetLabel,
          data: normalizedData,
          borderColor: chartColors.getColor(0),
          backgroundColor: fill ? chartColors.getBackgroundColor(0) : "transparent",
          tension,
          borderWidth,
          pointRadius,
          fill,
        },
      ],
    }

    const options: ChartOptions<"line"> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showLegend,
          position: legendPosition,
          labels: {
            color: chartColors.text,
          },
        },
        title: {
          display: !!title,
          text: title,
          color: chartColors.text,
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
        },
      },
      scales: {
        x: {
          title: {
            display: !!xAxisTitle,
            text: xAxisTitle,
            color: chartColors.text,
          },
          ticks: {
            color: chartColors.text,
          },
          grid: {
            color: chartColors.grid,
            drawBorder: false,
          },
        },
        y: {
          title: {
            display: !!yAxisTitle,
            text: yAxisTitle,
            color: chartColors.text,
          },
          ticks: {
            color: chartColors.text,
          },
          grid: {
            color: chartColors.grid,
            drawBorder: false,
          },
        },
      },
    }

    setChartData(chartData)
    setChartOptions(options)
  }, [
    data,
    labels,
    title,
    fill,
    tension,
    borderWidth,
    pointRadius,
    showLegend,
    legendPosition,
    yAxisTitle,
    xAxisTitle,
    datasetLabel,
    theme,
    chartColors,
  ])

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
    console.warn(`LineChart: Data and labels length mismatch. Trimmed to ${minLength} items.`)
  }

  return (
    <div className={`relative ${className}`} style={{ height, width }} id={id}>
      <Line ref={chartRef} data={chartData} options={chartOptions} />
    </div>
  )
}
