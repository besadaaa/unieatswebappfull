import { cn } from "@/lib/utils"

interface ChartSkeletonProps {
  type: "line" | "bar" | "pie" | "doughnut"
  className?: string
  height?: number
  title?: string
  description?: string
}

export function ChartSkeleton({
  type,
  className,
  height = 300,
  title = "Loading chart data...",
  description,
}: ChartSkeletonProps) {
  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <div className="h-4 w-16 animate-pulse rounded bg-muted"></div>
        </div>
      </div>
      <div className="p-6 pt-0">
        <div className="flex items-center justify-center w-full overflow-hidden" style={{ height: `${height}px` }}>
          {type === "line" && <LineChartSkeleton />}
          {type === "bar" && <BarChartSkeleton />}
          {type === "pie" && <PieChartSkeleton />}
          {type === "doughnut" && <DoughnutChartSkeleton />}
        </div>
      </div>
    </div>
  )
}

function LineChartSkeleton() {
  return (
    <div className="w-full h-full relative">
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

      {/* Line path */}
      <svg className="absolute left-12 right-0 top-0 bottom-6 w-[calc(100%-48px)] h-[calc(100%-24px)]">
        <path
          d="M0,120 C20,100 40,180 60,150 C80,120 100,90 120,110 C140,130 160,50 180,30 C200,10 220,40 240,20 C260,0 280,30 300,20"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="2"
          strokeDasharray="5,5"
          className="animate-dash"
        />
      </svg>

      {/* Data points */}
      <div className="absolute left-12 right-0 top-0 bottom-6 flex justify-between items-end pb-[10%]">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
      </div>
    </div>
  )
}

function BarChartSkeleton() {
  return (
    <div className="w-full h-full relative">
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

      {/* Bars */}
      <div className="absolute left-12 right-0 top-0 bottom-6 flex justify-around items-end pb-[1px]">
        <div className="w-12 bg-primary/20 rounded-t animate-pulse" style={{ height: "60%" }}></div>
        <div className="w-12 bg-primary/20 rounded-t animate-pulse" style={{ height: "80%" }}></div>
        <div className="w-12 bg-primary/20 rounded-t animate-pulse" style={{ height: "40%" }}></div>
        <div className="w-12 bg-primary/20 rounded-t animate-pulse" style={{ height: "70%" }}></div>
        <div className="w-12 bg-primary/20 rounded-t animate-pulse" style={{ height: "50%" }}></div>
      </div>
    </div>
  )
}

function PieChartSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="10"
            strokeDasharray="283"
            strokeDashoffset="0"
            className="animate-pulse"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="10"
            strokeDasharray="283"
            strokeDashoffset="200"
            className="animate-dash"
            style={{ animationDuration: "2s" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-16 bg-muted rounded animate-pulse"></div>
        </div>
      </div>

      {/* Legend */}
      <div className="ml-8 space-y-2">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-sm bg-primary/60 animate-pulse"></div>
          <div className="ml-2 h-4 w-16 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-sm bg-primary/40 animate-pulse"></div>
          <div className="ml-2 h-4 w-20 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-sm bg-primary/20 animate-pulse"></div>
          <div className="ml-2 h-4 w-12 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

function DoughnutChartSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="10"
            strokeDasharray="283"
            strokeDashoffset="0"
            className="animate-pulse"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="10"
            strokeDasharray="283"
            strokeDashoffset="200"
            className="animate-dash"
            style={{ animationDuration: "2s" }}
          />
          <circle cx="50" cy="50" r="35" fill="hsl(var(--background))" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-16 bg-muted rounded animate-pulse"></div>
        </div>
      </div>

      {/* Legend */}
      <div className="ml-8 space-y-2">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-sm bg-primary/60 animate-pulse"></div>
          <div className="ml-2 h-4 w-16 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-sm bg-primary/40 animate-pulse"></div>
          <div className="ml-2 h-4 w-20 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-sm bg-primary/20 animate-pulse"></div>
          <div className="ml-2 h-4 w-12 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
