"use client"

import type React from "react"
import { useRef } from "react"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useChartColors } from "@/lib/theme-aware-colors"
import { useTheme } from "@/components/theme-context"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface ComparisonChartProps {
  currentData: number[]
  previousData: number[]
  labels: string[]
  title: string
  description?: string
  currentPeriodLabel?: string
  previousPeriodLabel?: string
  id?: string
  className?: string
  height?: number
  type?: "bar" | "line"
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  currentData,
  previousData,
  labels,
  title,
  description,
  currentPeriodLabel = "Current Period",
  previousPeriodLabel = "Previous Period",
  id = "comparison-chart",
  className = "",
  height = 300,
  type = "bar",
}) => {
  const chartRef = useRef<ChartJS>(null)
  const chartColors = useChartColors()
  const { theme } = useTheme()

  // Validate and normalize data and labels
  let normalizedCurrentData = currentData || []
  let normalizedPreviousData = previousData || []
  let normalizedLabels = labels || []

  // Handle empty or invalid data
  if (!normalizedCurrentData.length || !normalizedPreviousData.length || !normalizedLabels.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No data available for comparison
          </div>
        </CardContent>
      </Card>
    )
  }

  // Ensure all arrays have the same length
  const minLength = Math.min(
    normalizedCurrentData.length,
    normalizedPreviousData.length,
    normalizedLabels.length
  )

  if (minLength === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No data available for comparison
          </div>
        </CardContent>
      </Card>
    )
  }

  // Trim all arrays to the same length
  if (
    normalizedCurrentData.length !== minLength ||
    normalizedPreviousData.length !== minLength ||
    normalizedLabels.length !== minLength
  ) {
    normalizedCurrentData = normalizedCurrentData.slice(0, minLength)
    normalizedPreviousData = normalizedPreviousData.slice(0, minLength)
    normalizedLabels = normalizedLabels.slice(0, minLength)
    console.warn(`ComparisonChart: Data arrays length mismatch. Trimmed to ${minLength} items.`)
  }

  const chartData = {
    labels: normalizedLabels,
    datasets: [
      {
        label: currentPeriodLabel,
        data: normalizedCurrentData,
        backgroundColor: chartColors.getColor(0),
        borderColor: chartColors.getColor(0),
        borderWidth: 1,
      },
      {
        label: previousPeriodLabel,
        data: normalizedPreviousData,
        backgroundColor: chartColors.getColor(1),
        borderColor: chartColors.getColor(1),
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: chartColors.text,
        },
      },
      tooltip: {
        backgroundColor: theme === "dark" ? "#1f2937" : "#ffffff",
        titleColor: theme === "dark" ? "#ffffff" : "#000000",
        bodyColor: theme === "dark" ? "#d1d5db" : "#374151",
        borderColor: theme === "dark" ? "#374151" : "#e5e7eb",
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || ""
            const value = context.raw as number
            return `${label}: ${value}`
          },
          afterBody: (context) => {
            const index = context[0].dataIndex
            const current = normalizedCurrentData[index]
            const previous = normalizedPreviousData[index]

            if (previous === 0) return ["No comparison available (previous value is 0)"]

            const change = current - previous
            const percentChange = (change / previous) * 100

            return [
              `Change: ${change > 0 ? "+" : ""}${change.toFixed(2)}`,
              `Percent: ${percentChange > 0 ? "+" : ""}${percentChange.toFixed(2)}%`,
            ]
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: chartColors.grid,
        },
        ticks: {
          color: chartColors.text,
        },
      },
      y: {
        grid: {
          color: chartColors.grid,
        },
        ticks: {
          color: chartColors.text,
        },
        beginAtZero: true,
      },
    },
  }

  return (
    <Card className={className} id={id}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <Bar ref={chartRef} data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}
