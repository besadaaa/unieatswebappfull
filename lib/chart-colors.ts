"use client"

import { useTheme } from "@/components/theme-context"

// Theme-aware color palettes
export const LIGHT_THEME_COLORS = {
  // Primary colors - Professional blue palette
  primary: "#2563eb", // Blue-600
  secondary: "#059669", // Emerald-600
  tertiary: "#7c3aed", // Violet-600
  quaternary: "#d97706", // Amber-600

  // Accent colors - Vibrant but professional
  accent1: "#dc2626", // Red-600
  accent2: "#0891b2", // Cyan-600
  accent3: "#ea580c", // Orange-600
  accent4: "#65a30d", // Lime-600

  // Status colors
  success: "#16a34a", // Green-600
  warning: "#ca8a04", // Yellow-600
  error: "#dc2626", // Red-600
  info: "#0284c7", // Sky-600

  // Neutral colors
  neutral1: "#6b7280", // Gray-500
  neutral2: "#9ca3af", // Gray-400
  neutral3: "#d1d5db", // Gray-300

  // Background and text
  background: "#ffffff",
  text: "#1f2937",
  textMuted: "#6b7280",
}

export const DARK_THEME_COLORS = {
  // Primary colors - brighter and more vibrant for dark mode
  primary: "#3b82f6", // Blue-500
  secondary: "#10b981", // Emerald-500
  tertiary: "#8b5cf6", // Violet-500
  quaternary: "#f59e0b", // Amber-500

  // Accent colors - vibrant for dark mode
  accent1: "#ef4444", // Red-500
  accent2: "#06b6d4", // Cyan-500
  accent3: "#f97316", // Orange-500
  accent4: "#84cc16", // Lime-500

  // Status colors - bright for dark mode
  success: "#22c55e", // Green-500
  warning: "#eab308", // Yellow-500
  error: "#ef4444", // Red-500
  info: "#0ea5e9", // Sky-500

  // Neutral colors - lighter for dark mode
  neutral1: "#9ca3af", // Gray-400
  neutral2: "#d1d5db", // Gray-300
  neutral3: "#e5e7eb", // Gray-200

  // Background and text
  background: "#1f2937",
  text: "#f9fafb",
  textMuted: "#d1d5db",
}

// Helper function to get theme-specific colors
export function useChartColors() {
  const { theme } = useTheme()
  const colors = theme === "dark" ? DARK_THEME_COLORS : LIGHT_THEME_COLORS

  // Color sets for different chart types
  const LINE_CHART_COLORS = [colors.primary, colors.secondary, colors.tertiary, colors.quaternary, colors.accent1]

  const LINE_CHART_FILL_COLORS = [
    `${colors.primary}20`, // 20 = 12% opacity
    `${colors.secondary}20`,
    `${colors.tertiary}20`,
    `${colors.quaternary}20`,
    `${colors.accent1}20`,
  ]

  const BAR_CHART_COLORS = [colors.primary, colors.secondary, colors.tertiary, colors.quaternary, colors.accent1]

  const PIE_CHART_COLORS = [
    colors.primary,      // Blue
    colors.secondary,    // Green
    colors.accent3,      // Orange
    colors.success,      // Bright Green
    colors.tertiary,     // Purple
    colors.accent1,      // Red
    colors.accent2,      // Cyan
    colors.warning,      // Yellow
    colors.accent4,      // Lime
    colors.info,         // Sky Blue
  ]

  // Color maps for specific data categories
  const CATEGORY_COLOR_MAP: Record<string, string> = {
    // Payment methods
    "Credit Card": colors.accent3,
    "Mobile Wallet": colors.secondary,
    Cash: colors.tertiary,
    "Meal Plan": colors.quaternary,

    // User types
    Students: colors.primary,
    Faculty: colors.secondary,
    Staff: colors.tertiary,

    // Device types
    Mobile: colors.primary,
    Desktop: colors.secondary,
    Tablet: colors.tertiary,

    // Order statuses
    Completed: colors.success,
    "In Progress": colors.warning,
    Cancelled: colors.error,
    Refunded: colors.info,
    New: colors.primary,
    Preparing: colors.warning,
    Ready: colors.info,

    // Marketing channels
    Direct: colors.primary,
    "Social Media": colors.accent1,
    Referrals: colors.tertiary,
    "Campus Events": colors.accent3,

    // System components
    Network: colors.primary,
    Database: colors.secondary,
    Authentication: colors.tertiary,
    Payment: colors.accent3,
    Other: colors.error,

    // Food categories - High contrast colors for better differentiation
    "Main Dishes": colors.primary,        // Blue
    "Main Course": colors.primary,        // Blue
    Sandwiches: colors.secondary,         // Green
    Beverages: colors.info,               // Sky Blue
    Sides: colors.tertiary,               // Purple
    Desserts: colors.accent3,             // Orange
    Salads: colors.success,               // Bright Green
    Appetizers: colors.accent1,           // Red
    Breakfast: colors.warning,            // Yellow
    Lunch: colors.accent2,                // Cyan
    Snacks: colors.accent4,               // Lime
    Pizza: colors.accent1,                // Red
    Pasta: colors.accent2,                // Cyan
    Burgers: colors.warning,              // Yellow

    // Menu item specific colors for better pie chart differentiation
    "Mediterranean Grilled Chicken": colors.primary,     // Blue
    "Eggplant Parmigiana": colors.secondary,            // Green
    "Tuscan Pasta Primavera": colors.accent3,           // Orange
    "Tiramisu": colors.tertiary,                        // Purple
    "Italian Espresso": colors.accent1,                 // Red

    // Feedback
    Satisfied: colors.success,
    Neutral: colors.warning,
    Unsatisfied: colors.error,

    // Expenses
    Ingredients: colors.primary,
    Labor: colors.secondary,
    Utilities: colors.tertiary,
    Other: colors.neutral1,
  }

  // Generate background colors with transparency for Chart.js
  const generateBackgroundColors = (colors: string[]): string[] => {
    return colors.map((color) => `${color}40`) // 40 = 25% opacity
  }

  // Generate a color for any category, with fallback to primary colors
  const getCategoryColor = (category: string): string => {
    return CATEGORY_COLOR_MAP[category] || colors.primary
  }

  // Generate a gradient for a specific color
  const createGradient = (ctx: CanvasRenderingContext2D, color: string): CanvasGradient => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400)
    gradient.addColorStop(0, `${color}80`) // 80 = 50% opacity
    gradient.addColorStop(1, `${color}10`) // 10 = 6% opacity
    return gradient
  }

  // Return all color utilities
  return {
    colors,
    LINE_CHART_COLORS,
    LINE_CHART_FILL_COLORS,
    BAR_CHART_COLORS,
    PIE_CHART_COLORS,
    CATEGORY_COLOR_MAP,
    generateBackgroundColors,
    getCategoryColor,
    createGradient,
  }
}

// For backward compatibility and non-React contexts
export const CHART_COLORS = LIGHT_THEME_COLORS
export const LINE_CHART_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  CHART_COLORS.quaternary,
  CHART_COLORS.accent1,
]
export const LINE_CHART_FILL_COLORS = [
  `${CHART_COLORS.primary}20`,
  `${CHART_COLORS.secondary}20`,
  `${CHART_COLORS.tertiary}20`,
  `${CHART_COLORS.quaternary}20`,
  `${CHART_COLORS.accent1}20`,
]
export const BAR_CHART_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  CHART_COLORS.quaternary,
  CHART_COLORS.accent1,
]
export const PIE_CHART_COLORS = [
  CHART_COLORS.primary,      // Blue
  CHART_COLORS.secondary,    // Green
  CHART_COLORS.accent3,      // Orange
  CHART_COLORS.success,      // Bright Green
  CHART_COLORS.tertiary,     // Purple
  CHART_COLORS.accent1,      // Red
  CHART_COLORS.accent2,      // Cyan
  CHART_COLORS.warning,      // Yellow
  CHART_COLORS.accent4,      // Lime
  CHART_COLORS.info,         // Sky Blue
]
export const CATEGORY_COLOR_MAP: Record<string, string> = {
  // Payment methods
  "Credit Card": CHART_COLORS.accent3,
  "Mobile Wallet": CHART_COLORS.secondary,
  Cash: CHART_COLORS.tertiary,
  "Meal Plan": CHART_COLORS.quaternary,

  // User types
  Students: CHART_COLORS.primary,
  Faculty: CHART_COLORS.secondary,
  Staff: CHART_COLORS.tertiary,

  // Food categories - High contrast colors
  "Main Dishes": CHART_COLORS.primary,        // Blue
  "Main Course": CHART_COLORS.primary,        // Blue
  Sandwiches: CHART_COLORS.secondary,         // Green
  Beverages: CHART_COLORS.info,               // Sky Blue
  Sides: CHART_COLORS.tertiary,               // Purple
  Desserts: CHART_COLORS.accent3,             // Orange
  Salads: CHART_COLORS.success,               // Bright Green
  Appetizers: CHART_COLORS.accent1,           // Red

  // Menu item specific colors
  "Mediterranean Grilled Chicken": CHART_COLORS.primary,     // Blue
  "Eggplant Parmigiana": CHART_COLORS.secondary,            // Green
  "Tuscan Pasta Primavera": CHART_COLORS.accent3,           // Orange
  "Tiramisu": CHART_COLORS.tertiary,                        // Purple
  "Italian Espresso": CHART_COLORS.accent1,                 // Red
}

// Export the utility functions for non-React contexts
export function generateBackgroundColors(colors: string[]): string[] {
  return colors.map((color) => `${color}40`) // 40 = 25% opacity
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLOR_MAP[category] || CHART_COLORS.primary
}

export function createGradient(ctx: CanvasRenderingContext2D, color: string): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400)
  gradient.addColorStop(0, `${color}80`) // 80 = 50% opacity
  gradient.addColorStop(1, `${color}10`) // 10 = 6% opacity
  return gradient
}
