import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TrendChartSkeletonProps {
  title: string
  description?: string
  height?: number
}

export function TrendChartSkeleton({ title, description, height = 300 }: TrendChartSkeletonProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-5 w-16 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
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

          {/* Historical line */}
          <svg className="absolute left-12 top-0 w-[60%] h-[calc(100%-24px)]">
            <path
              d="M0,120 C20,100 40,180 60,150 C80,120 100,90 120,110 C140,130 160,50 180,30"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              className="animate-pulse"
            />
          </svg>

          {/* Forecast line */}
          <svg className="absolute left-[calc(12px+60%)] right-0 top-0 w-[40%] h-[calc(100%-24px)]">
            <path
              d="M0,30 C20,20 40,40 60,30 C80,20 100,10 120,20"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="animate-dash"
            />
          </svg>

          {/* Divider line */}
          <div
            className="absolute top-0 bottom-6 w-[1px] bg-muted/50 animate-pulse"
            style={{ left: "calc(12px + 60%)" }}
          ></div>

          {/* Forecast label */}
          <div
            className="absolute top-2 h-5 w-16 bg-muted rounded animate-pulse"
            style={{ left: "calc(12px + 60% + 8px)" }}
          ></div>
        </div>

        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <div className="h-4 w-32 bg-muted rounded animate-pulse mb-2"></div>
          <div className="h-3 w-48 bg-muted rounded animate-pulse mb-3"></div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="h-3 w-24 bg-muted rounded animate-pulse mb-1"></div>
              <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
            </div>
            <div>
              <div className="h-3 w-24 bg-muted rounded animate-pulse mb-1"></div>
              <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
