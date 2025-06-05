export interface ChartAnnotation {
  id: string
  chartId: string
  type: "point" | "line" | "range" | "threshold"
  xIndex?: number // For point, line annotations
  xRange?: [number, number] // For range annotations
  yValue?: number // For threshold annotations
  label: string
  color?: string
  description?: string
  createdAt: Date
}

export interface AnnotationFormData {
  type: "point" | "line" | "range" | "threshold"
  xIndex?: number
  xRange?: [number, number]
  yValue?: number
  label: string
  color: string
  description: string
}

export const DEFAULT_ANNOTATION_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#d946ef", // fuchsia
]
