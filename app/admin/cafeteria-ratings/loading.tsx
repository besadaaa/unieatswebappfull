import { Header } from "@/components/admin/header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

export default function CafeteriaRatingsLoading() {
  return (
    <div className="min-h-screen bg-[#0f1424]">
      <Header title="Cafeteria Ratings" />

      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" disabled>
              Overview
            </TabsTrigger>
            <TabsTrigger value="cafeterias" disabled>
              Cafeterias
            </TabsTrigger>
            <TabsTrigger value="items" disabled>
              Menu Items
            </TabsTrigger>
            <TabsTrigger value="reviews" disabled>
              Recent Reviews
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="bg-[#1a1f36] border-0">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                      <div className="flex">
                        {Array(5)
                          .fill(0)
                          .map((_, i) => (
                            <Skeleton key={i} className="h-4 w-4 rounded-full mr-1" />
                          ))}
                      </div>
                      <Skeleton className="h-3 w-20" />

                      <div className="pt-2 space-y-1">
                        {Array(4)
                          .fill(0)
                          .map((_, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-4 w-8" />
                            </div>
                          ))}
                      </div>

                      <Skeleton className="h-8 w-full mt-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </Tabs>
      </main>
    </div>
  )
}
