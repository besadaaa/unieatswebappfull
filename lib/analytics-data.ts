import type { DateRange } from "react-day-picker"
import { eachDayOfInterval, format, isSameDay, subDays, differenceInDays } from "date-fns"
import { getAnalyticsData } from "./supabase"

// Generate data for a given date range from Supabase
export async function generateDataForDateRange(
  dateRange: DateRange | undefined,
  metricType: string,
  cafeteriaId?: string,
  fallbackBaseValue: number = 50,
  fallbackVariance: number = 20
): Promise<number[]> {
  if (!dateRange?.from) {
    // Default to last 7 days if no date range is selected
    const to = new Date()
    const from = subDays(to, 6) // 7 days including today
    dateRange = { from, to }
  }

  const to = dateRange.to || dateRange.from
  const days = eachDayOfInterval({ start: dateRange.from, end: to })

  if (cafeteriaId) {
    try {
      // Fetch real data from Supabase
      const startDate = format(dateRange.from, 'yyyy-MM-dd')
      const endDate = format(to, 'yyyy-MM-dd')
      const analyticsData = await getAnalyticsData(cafeteriaId, metricType, startDate, endDate)

      // Create a map of dates to values
      const dataMap = new Map(analyticsData.map(item => [item.date, item.value]))

      // Fill in missing dates with interpolated values
      return days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd')
        return dataMap.get(dateStr) || 0
      })
    } catch (error) {
      console.error('Error fetching analytics data, falling back to generated data:', error)
    }
  }

  // Return zeros if no cafeteriaId or if fetch fails - no fallback data
  return days.map(() => 0)
}

// Legacy function for backward compatibility - now returns zeros instead of fake data
export function generateDataForDateRangeSync(dateRange: DateRange | undefined, baseValue: number, variance: number) {
  if (!dateRange?.from) {
    // Default to last 7 days if no date range is selected
    const to = new Date()
    const from = subDays(to, 6) // 7 days including today
    dateRange = { from, to }
  }

  const to = dateRange.to || dateRange.from
  const days = eachDayOfInterval({ start: dateRange.from, end: to })

  // Return zeros instead of generated data to ensure only real data is used
  return days.map(() => 0)
}

// Generate labels for a date range
export function generateLabelsForDateRange(dateRange: DateRange | undefined) {
  if (!dateRange?.from) {
    // Default to last 7 days if no date range is selected
    const to = new Date()
    const from = subDays(to, 6) // 7 days including today
    dateRange = { from, to }
  }

  const to = dateRange.to || dateRange.from
  const days = eachDayOfInterval({ start: dateRange.from, end: to })

  // Ensure we have at least one label
  if (days.length === 0) {
    return ["Today"]
  }

  return days.map((day) => format(day, "MMM dd"))
}

// Get a friendly description of the date range
export function getDateRangeDescription(dateRange: DateRange | undefined) {
  if (!dateRange?.from) {
    return "Last 7 days"
  }

  const to = dateRange.to || dateRange.from

  // Check if it's a single day
  if (isSameDay(dateRange.from, to)) {
    return format(dateRange.from, "MMMM d, yyyy")
  }

  return `${format(dateRange.from, "MMM d")} - ${format(to, "MMM d, yyyy")}`
}

// Generate predefined date ranges
export function getPredefinedDateRanges() {
  const today = new Date()

  return {
    today: {
      from: today,
      to: today,
    },
    yesterday: {
      from: subDays(today, 1),
      to: subDays(today, 1),
    },
    last7Days: {
      from: subDays(today, 6),
      to: today,
    },
    last30Days: {
      from: subDays(today, 29),
      to: today,
    },
    thisMonth: {
      from: new Date(today.getFullYear(), today.getMonth(), 1),
      to: today,
    },
    lastMonth: {
      from: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      to: new Date(today.getFullYear(), today.getMonth(), 0),
    },
  }
}

// Calculate the equivalent previous period for a given date range
export function calculatePreviousPeriod(dateRange: DateRange | undefined): DateRange | undefined {
  if (!dateRange?.from) return undefined

  const to = dateRange.to || dateRange.from
  const periodLength = differenceInDays(to, dateRange.from)

  // Calculate the previous period with the same length
  const previousTo = subDays(dateRange.from, 1)
  const previousFrom = subDays(previousTo, periodLength)

  return { from: previousFrom, to: previousTo }
}

// Calculate percentage change between two values
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// Calculate the average value of an array of numbers
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  const sum = values.reduce((acc, val) => acc + val, 0)
  return sum / values.length
}

// Calculate the total value of an array of numbers
export function calculateTotal(values: number[]): number {
  return values.reduce((acc, val) => acc + val, 0)
}

// Generate comparison data summary
export function generateComparisonSummary(currentData: number[], previousData: number[]) {
  const currentTotal = calculateTotal(currentData)
  const previousTotal = calculateTotal(previousData)
  const percentageChange = calculatePercentageChange(currentTotal, previousTotal)

  const currentAverage = calculateAverage(currentData)
  const previousAverage = calculateAverage(previousData)
  const averagePercentageChange = calculatePercentageChange(currentAverage, previousAverage)

  return {
    currentTotal,
    previousTotal,
    percentageChange,
    currentAverage,
    previousAverage,
    averagePercentageChange,
    isPositive: percentageChange >= 0,
  }
}
