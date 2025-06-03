import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ComparisonChartSkeletonProps {
  title: string
  description?: string
  height?: number
}

export function ComparisonChartSkeleton({ title, description, height = 300 }: ComparisonChartSkeletonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[300px] relative">
          {/* Y-axis */}
          <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between pb-6">
            <div className="h-5 w-8 bg-muted rounded animate-pulse"></div>
            <div className="h-5 w-6 bg-muted rounded animate-pulse"></div>
            <div className="h-5 w-7 bg-muted rounded animate-pulse"></div>
            <div className="h-5 w-5 bg-muted rounded animate-pulse"></div>
          </div>

          {/* Grid lines */}
          <div className="absolute left-12 right-0 top-0 bottom-6 flex flex-col justify-between">
            <div className="w-full h-[1px] bg-muted/30"></div>
            <div className="w-full h-[1px] bg-muted/30"></div>
            <div className="w-full h-[1px] bg-muted/30"></div>
            <div className="w-full h-[1px] bg-muted/30"></div>
            <div className="w-full h-[1px] bg-muted/30"></div>
          </div>

          {/* X-axis labels */}
          <div className="absolute left-12 right-0 bottom-0 h-6 flex justify-between">
            <div className="h-4 w-8 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-8 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-8 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-8 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-8 bg-muted rounded animate-pulse"></div>
          </div>

          {/* Current period line */}
          <svg className="absolute left-12 right-0 top-0 bottom-6 w-[calc(100%-48px)] h-[calc(100%-24px)]">
            <path
              d="M0,120 C20,100 40,180 60,150 C80,120 100,90 120,110 C140,130 160,50 180,30 C200,10 220,40 240,20 C260,0 280,30 300,20"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              className="animate-pulse"
            />
          </svg>

          {/* Previous period line */}
          <svg className="absolute left-12 right-0 top-0 bottom-6 w-[calc(100%-48px)] h-[calc(100%-24px)]">
            <path
              d="M0,150 C20,130 40,160 60,140 C80,120 100,130 120,150 C140,170 160,90 180,70 C200,50 220,80 240,60 C260,40 280,70 300,60"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="animate-dash"
            />
          </svg>

          {/* Legend */}
          <div className="absolute top-2 right-2 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-primary animate-pulse"></div>
              <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-muted animate-pulse"></div>
              <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
