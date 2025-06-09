export interface TrendResult {
  slope: number
  intercept: number
  rSquared: number
  volatility: number
  trendline: number[]
  slopePercentage: number
  forecast?: number[]
  forecastLabels?: string[]
}

// Function to calculate linear regression trendline with forecasting
export function calculateTrend(data: number[], forecastPeriods: number = 0): TrendResult {
  const n = data.length

  if (n < 2) {
    return {
      slope: 0,
      intercept: 0,
      rSquared: 0,
      volatility: 0,
      trendline: [],
      slopePercentage: 0,
      forecast: [],
      forecastLabels: []
    }
  }

  let xSum = 0
  let ySum = 0
  let xySum = 0
  let x2Sum = 0

  for (let i = 0; i < n; i++) {
    xSum += i + 1
    ySum += data[i]
    xySum += (i + 1) * data[i]
    x2Sum += (i + 1) * (i + 1)
  }

  const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum)
  const intercept = ySum / n - (slope * xSum) / n

  let ssRes = 0
  let ssTot = 0

  for (let i = 0; i < n; i++) {
    const fittedY = slope * (i + 1) + intercept
    ssRes += (data[i] - fittedY) ** 2
    ssTot += (data[i] - ySum / n) ** 2
  }

  const rSquared = 1 - ssRes / ssTot

  // Calculate volatility (standard deviation of residuals)
  let volatility = 0
  for (let i = 0; i < n; i++) {
    const fittedY = slope * (i + 1) + intercept
    volatility += (data[i] - fittedY) ** 2
  }
  volatility = Math.sqrt(volatility / n) / (ySum / n)

  // Generate trendline data
  const trendline: number[] = []
  for (let i = 0; i < n; i++) {
    trendline.push(slope * (i + 1) + intercept)
  }

  // Generate forecast data if requested
  const forecast: number[] = []
  const forecastLabels: string[] = []
  if (forecastPeriods > 0) {
    for (let i = 1; i <= forecastPeriods; i++) {
      const forecastValue = slope * (n + i) + intercept
      // Add some realistic variance to forecast (±10% based on volatility)
      const variance = volatility * (ySum / n) * 0.1 * (Math.random() - 0.5)
      forecast.push(Math.max(0, forecastValue + variance))
      forecastLabels.push(`Day +${i}`)
    }
  }

  return {
    slope,
    intercept,
    rSquared,
    volatility,
    trendline,
    slopePercentage: (slope / (ySum / n)) * 100,
    forecast,
    forecastLabels
  }
}
