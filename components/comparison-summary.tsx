import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface ComparisonSummaryProps {
  title: string
  currentValue: number
  previousValue: number
  percentageChange: number
  valueFormatter?: (value: number) => string
  className?: string
}

export function ComparisonSummary({
  title,
  currentValue,
  previousValue,
  percentageChange,
  valueFormatter = (value) => value.toLocaleString(),
  className,
}: ComparisonSummaryProps) {
  const isPositive = percentageChange >= 0

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold">{valueFormatter(currentValue)}</p>
          <div className={`flex items-center text-xs font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
            {isPositive ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
            <span>{Math.abs(percentageChange).toFixed(1)}%</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Previous: {valueFormatter(previousValue)}</p>
      </CardContent>
    </Card>
  )
}
