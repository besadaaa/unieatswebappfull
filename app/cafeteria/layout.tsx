import type { ReactNode } from "react"
import { Sidebar } from "@/components/cafeteria/sidebar"
import { AnnotationProvider } from "@/contexts/annotation-context"

export default function CafeteriaLayout({ children }: { children: ReactNode }) {
  return (
    <AnnotationProvider>
      <div className="flex min-h-screen relative">
        {/* Enhanced floating gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="floating-orb w-96 h-96 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 -top-48 -right-48 animate-float"></div>
          <div className="floating-orb w-80 h-80 bg-gradient-to-br from-blue-500/12 to-indigo-500/12 -bottom-40 -left-40 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="floating-orb w-72 h-72 bg-gradient-to-br from-purple-500/10 to-violet-500/10 top-1/2 right-1/4 animate-float" style={{ animationDelay: '4s' }}></div>
          <div className="floating-orb w-64 h-64 bg-gradient-to-br from-cyan-500/8 to-teal-500/8 top-1/4 left-1/3 animate-float" style={{ animationDelay: '1s' }}></div>
        </div>

        <Sidebar />
        <div className="flex-1 overflow-auto relative z-10">
          <div className="animate-fade-in">
            {children}
          </div>
        </div>
      </div>
    </AnnotationProvider>
  )
}
