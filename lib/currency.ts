// Currency formatting utilities for EGP (Egyptian Pound)

export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numAmount)) return '0.00 EGP'
  return `${numAmount.toFixed(2)} EGP`
}

export function formatCurrencyShort(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numAmount)) return '0 EGP'
  
  if (numAmount >= 1000000) {
    return `${(numAmount / 1000000).toFixed(1)}M EGP`
  } else if (numAmount >= 1000) {
    return `${(numAmount / 1000).toFixed(1)}K EGP`
  } else {
    return `${numAmount.toFixed(0)} EGP`
  }
}

export function parseCurrency(currencyString: string): number {
  // Remove EGP and any non-numeric characters except decimal point
  const cleanString = currencyString.replace(/[^0-9.]/g, '')
  const amount = parseFloat(cleanString)
  return isNaN(amount) ? 0 : amount
}

export const CURRENCY_SYMBOL = 'EGP'
export const CURRENCY_CODE = 'EGP'
export const CURRENCY_NAME = 'Egyptian Pound'
