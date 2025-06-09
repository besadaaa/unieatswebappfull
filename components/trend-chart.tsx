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
} from "chart.js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateTrend, type TrendResult } from "@/lib/trend-analysis"
import { useChartColors } from "@/lib/theme-aware-colors"
import { useTheme } from "@/components/theme-context"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface TrendChartProps {
  data: number[]
  labels: string[]
  title: string
  description?: string
  id?: string
  className?: string
  showTrendline?: boolean
  showTrendSummary?: boolean
  height?: number
  forecastPeriods?: number
  valueFormatter?: (value: number) => string
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  labels,
  title,
  description,
  id = "trend-chart",
  className = "",
  showTrendline = true,
  showTrendSummary = true,
  height = 300,
  forecastPeriods = 0,
  valueFormatter = (value: number) => value.toString(),
}) => {
  const chartRef = useRef<ChartJS>(null)
  const chartColors = useChartColors()
  const { theme } = useTheme()
  const [trendResult, setTrendResult] = useState<TrendResult | null>(null)

  // Validate and normalize data and labels
  let normalizedData = data || []
  let normalizedLabels = labels || []

  // Handle empty or invalid data
  if (!normalizedData.length || !normalizedLabels.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  // Ensure data and labels have the same length
  if (normalizedData.length !== normalizedLabels.length) {
    const minLength = Math.min(normalizedData.length, normalizedLabels.length)
    if (minLength === 0) {
      return (
        <Card className={className}>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No data available
            </div>
          </CardContent>
        </Card>
      )
    }

    // Trim to the shorter length
    normalizedData = normalizedData.slice(0, minLength)
    normalizedLabels = normalizedLabels.slice(0, minLength)
    console.warn(`TrendChart: Data and labels length mismatch. Trimmed to ${minLength} items.`)
  }

  // Calculate trend analysis
  useEffect(() => {
    if (normalizedData && normalizedData.length > 1) {
      setTrendResult(calculateTrend(normalizedData, forecastPeriods))
    }
  }, [normalizedData, forecastPeriods])

  const trendlineData = trendResult?.trendline || []
  const forecastData = trendResult?.forecast || []
  const forecastLabels = trendResult?.forecastLabels || []

  // Combine labels for chart (actual + forecast)
  const allLabels = [...normalizedLabels, ...forecastLabels]

  // Prepare datasets with forecast
  const actualDataWithGaps = [...normalizedData, ...new Array(forecastLabels.length).fill(null)]
  const trendlineWithForecast = [...trendlineData, ...forecastData]
  const forecastDataWithGaps = [...new Array(normalizedData.length).fill(null), ...forecastData]

  const chartData = {
    labels: allLabels,
    datasets: [
      {
        label: "Actual Data",
        data: actualDataWithGaps,
        borderColor: chartColors.getColor(0),
        backgroundColor: chartColors.getBackgroundColor(0),
        tension: 0.4,
        fill: true,
        spanGaps: false,
      },
      ...(showTrendline && trendlineData.length > 0
        ? [
            {
              label: "Trend Line",
              data: trendlineWithForecast,
              borderColor: chartColors.getColor(1),
              borderWidth: 2,
              borderDash: [5, 5],
              fill: false,
              pointRadius: 0,
            },
          ]
        : []),
      ...(forecastPeriods > 0 && forecastData.length > 0
        ? [
            {
              label: "Forecast",
              data: forecastDataWithGaps,
              borderColor: chartColors.getColor(2),
              backgroundColor: chartColors.getBackgroundColor(2, 0.3),
              borderWidth: 2,
              borderDash: [10, 5],
              fill: false,
              pointRadius: 4,
              pointStyle: 'triangle',
              spanGaps: false,
            },
          ]
        : []),
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
          <Line ref={chartRef} data={chartData} options={options} />
        </div>
        {showTrendSummary && trendResult && (
          <div className="mt-4 text-sm">
            <p>
              <span className="font-medium">Trend:</span>{" "}
              <span className={trendResult.slope > 0 ? "text-green-500" : trendResult.slope < 0 ? "text-red-500" : ""}>
                {trendResult.slope > 0 ? "Upward" : trendResult.slope < 0 ? "Downward" : "Flat"}
              </span>{" "}
              ({Math.abs(trendResult.slopePercentage).toFixed(2)}% {trendResult.slope > 0 ? "increase" : "decrease"})
            </p>
            <p>
              <span className="font-medium">Volatility:</span>{" "}
              {trendResult.volatility < 0.1 ? "Low" : trendResult.volatility < 0.25 ? "Moderate" : "High"} (
              {(trendResult.volatility * 100).toFixed(2)}%)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
