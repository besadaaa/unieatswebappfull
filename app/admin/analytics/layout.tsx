import type React from "react"
import { AnnotationProvider } from "@/contexts/annotation-context"

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <AnnotationProvider>{children}</AnnotationProvider>
}
