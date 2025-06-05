"use client"

import { useTheme } from "@/components/theme-context"

// Base color palettes
const lightModeColors = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#84cc16", // lime-500
  "#6366f1", // indigo-500
]

const darkModeColors = [
  "#60a5fa", // blue-400
  "#34d399", // emerald-400
  "#fbbf24", // amber-400
  "#f87171", // red-400
  "#a78bfa", // violet-400
  "#f472b6", // pink-400
  "#22d3ee", // cyan-400
  "#fb923c", // orange-400
  "#a3e635", // lime-400
  "#818cf8", // indigo-400
]

// Transparent versions for backgrounds
const lightModeBackgroundColors = lightModeColors.map((color) => `${color}20`) // 20 = 12.5% opacity
const darkModeBackgroundColors = darkModeColors.map((color) => `${color}30`) // 30 = 18.75% opacity

export function useChartColors() {
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"

  return {
    // Primary colors for lines, bars, etc.
    primary: isDarkMode ? darkModeColors : lightModeColors,

    // Background colors for areas, fills, etc.
    background: isDarkMode ? darkModeBackgroundColors : lightModeBackgroundColors,

    // Grid and axis colors
    grid: isDarkMode ? "#374151" : "#e5e7eb", // gray-700 : gray-200

    // Text colors
    text: isDarkMode ? "#d1d5db" : "#374151", // gray-300 : gray-700

    // Get a specific color by index
    getColor: (index: number) => {
      const colors = isDarkMode ? darkModeColors : lightModeColors
      return colors[index % colors.length]
    },

    // Get a specific background color by index
    getBackgroundColor: (index: number) => {
      const colors = isDarkMode ? darkModeBackgroundColors : lightModeBackgroundColors
      return colors[index % colors.length]
    },

    // Get a color palette of n colors
    getPalette: (n: number) => {
      const colors = isDarkMode ? darkModeColors : lightModeColors
      return Array.from({ length: n }, (_, i) => colors[i % colors.length])
    },

    // Get a background color palette of n colors
    getBackgroundPalette: (n: number) => {
      const colors = isDarkMode ? darkModeBackgroundColors : lightModeBackgroundColors
      return Array.from({ length: n }, (_, i) => colors[i % colors.length])
    },
  }
}
