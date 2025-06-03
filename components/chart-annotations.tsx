"use client"

import { useRef, useEffect } from "react"
import type { ChartAnnotation } from "@/lib/annotation-types"

interface ChartAnnotationsProps {
  annotations: ChartAnnotation[]
  chartType: "line" | "bar" | "pie" | "doughnut"
  chartWidth: number
  chartHeight: number
  chartPadding: { top: number; right: number; bottom: number; left: number }
  dataLength: number
  yScale?: (value: number) => number
  maxValue?: number
}

export function ChartAnnotations({
  annotations,
  chartType,
  chartWidth,
  chartHeight,
  chartPadding,
  dataLength,
  yScale,
  maxValue = 100,
}: ChartAnnotationsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set up dimensions
    const chartArea = {
      width: chartWidth - chartPadding.left - chartPadding.right,
      height: chartHeight - chartPadding.top - chartPadding.bottom,
    }

    // Draw annotations
    annotations.forEach((annotation) => {
      ctx.save()
      ctx.strokeStyle = annotation.color || "#ef4444"
      ctx.fillStyle = annotation.color || "#ef4444"
      ctx.lineWidth = 2
      ctx.font = "12px sans-serif"

      switch (annotation.type) {
        case "point": {
          if (annotation.xIndex === undefined) return

          if (chartType === "pie" || chartType === "doughnut") {
            // For pie/doughnut charts, draw a marker at the edge of the slice
            const sliceAngle = (2 * Math.PI * annotation.xIndex) / dataLength
            const centerX = chartWidth / 2
            const centerY = chartHeight / 2
            const radius = Math.min(chartArea.width, chartArea.height) / 2

            const x = centerX + radius * 0.8 * Math.cos(sliceAngle)
            const y = centerY + radius * 0.8 * Math.sin(sliceAngle)

            // Draw marker
            ctx.beginPath()
            ctx.arc(x, y, 5, 0, 2 * Math.PI)
            ctx.fill()

            // Draw label
            ctx.fillText(annotation.label, x + 10, y)
          } else {
            // For line/bar charts, draw a vertical line at the data point
            const x = chartPadding.left + (chartArea.width / (dataLength - 1)) * annotation.xIndex

            // Draw vertical line
            ctx.beginPath()
            ctx.setLineDash([5, 3])
            ctx.moveTo(x, chartPadding.top)
            ctx.lineTo(x, chartHeight - chartPadding.bottom)
            ctx.stroke()

            // Draw marker
            ctx.beginPath()
            ctx.arc(x, chartPadding.top + 15, 5, 0, 2 * Math.PI)
            ctx.fill()

            // Draw label
            ctx.fillText(annotation.label, x + 10, chartPadding.top + 15)
          }
          break
        }

        case "line": {
          if (annotation.xIndex === undefined) return

          // Only for line/bar charts
          if (chartType === "pie" || chartType === "doughnut") return

          const x = chartPadding.left + (chartArea.width / (dataLength - 1)) * annotation.xIndex

          // Draw vertical line
          ctx.beginPath()
          ctx.setLineDash([5, 3])
          ctx.moveTo(x, chartPadding.top)
          ctx.lineTo(x, chartHeight - chartPadding.bottom)
          ctx.stroke()

          // Draw label background
          const labelWidth = ctx.measureText(annotation.label).width + 10
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
          ctx.fillRect(x - labelWidth / 2, chartPadding.top - 25, labelWidth, 20)

          // Draw label
          ctx.fillStyle = "#ffffff"
          ctx.textAlign = "center"
          ctx.fillText(annotation.label, x, chartPadding.top - 10)
          break
        }

        case "range": {
          if (!annotation.xRange) return

          // Only for line/bar charts
          if (chartType === "pie" || chartType === "doughnut") return

          const startX = chartPadding.left + (chartArea.width / (dataLength - 1)) * annotation.xRange[0]
          const endX = chartPadding.left + (chartArea.width / (dataLength - 1)) * annotation.xRange[1]

          // Draw range background
          ctx.fillStyle = `${annotation.color}33` // Add transparency
          ctx.fillRect(startX, chartPadding.top, endX - startX, chartArea.height)

          // Draw range borders
          ctx.beginPath()
          ctx.setLineDash([5, 3])
          ctx.moveTo(startX, chartPadding.top)
          ctx.lineTo(startX, chartHeight - chartPadding.bottom)
          ctx.stroke()

          ctx.beginPath()
          ctx.moveTo(endX, chartPadding.top)
          ctx.lineTo(endX, chartHeight - chartPadding.bottom)
          ctx.stroke()

          // Draw label
          ctx.fillStyle = annotation.color || "#ef4444"
          ctx.textAlign = "center"
          ctx.fillText(annotation.label, startX + (endX - startX) / 2, chartPadding.top + 15)
          break
        }

        case "threshold": {
          if (annotation.yValue === undefined || !yScale) return

          // Only for line/bar charts
          if (chartType === "pie" || chartType === "doughnut") return

          // Calculate y position
          const yPos = yScale(annotation.yValue)

          // Draw horizontal line
          ctx.beginPath()
          ctx.setLineDash([5, 3])
          ctx.moveTo(chartPadding.left, yPos)
          ctx.lineTo(chartWidth - chartPadding.right, yPos)
          ctx.stroke()

          // Draw label background
          const labelWidth = ctx.measureText(annotation.label).width + 10
          ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
          ctx.fillRect(chartWidth - chartPadding.right - labelWidth - 5, yPos - 10, labelWidth, 20)

          // Draw label
          ctx.fillStyle = "#ffffff"
          ctx.textAlign = "right"
          ctx.fillText(annotation.label, chartWidth - chartPadding.right - 10, yPos + 5)
          break
        }
      }

      ctx.restore()
    })
  }, [annotations, chartType, chartWidth, chartHeight, chartPadding, dataLength, yScale, maxValue])

  return (
    <canvas
      ref={canvasRef}
      width={chartWidth}
      height={chartHeight}
      className="absolute top-0 left-0 pointer-events-none"
    />
  )
}
