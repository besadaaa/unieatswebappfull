"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { ChartAnnotation, AnnotationFormData } from "@/lib/annotation-types"
import { v4 as uuidv4 } from "uuid"

interface AnnotationContextType {
  annotations: ChartAnnotation[]
  addAnnotation: (chartId: string, data: AnnotationFormData) => void
  updateAnnotation: (id: string, data: Partial<AnnotationFormData>) => void
  deleteAnnotation: (id: string) => void
  getAnnotationsForChart: (chartId: string) => ChartAnnotation[]
}

const AnnotationContext = createContext<AnnotationContextType | undefined>(undefined)

export function AnnotationProvider({ children }: { children: React.ReactNode }) {
  const [annotations, setAnnotations] = useState<ChartAnnotation[]>([])

  // Load annotations from localStorage on mount
  useEffect(() => {
    const savedAnnotations = localStorage.getItem("chart-annotations")
    if (savedAnnotations) {
      try {
        const parsed = JSON.parse(savedAnnotations)
        // Convert string dates back to Date objects
        const withDates = parsed.map((ann: any) => ({
          ...ann,
          createdAt: new Date(ann.createdAt),
        }))
        setAnnotations(withDates)
      } catch (error) {
        console.error("Failed to parse saved annotations:", error)
      }
    }
  }, [])

  // Save annotations to localStorage when they change
  useEffect(() => {
    if (annotations.length > 0) {
      localStorage.setItem("chart-annotations", JSON.stringify(annotations))
    }
  }, [annotations])

  const addAnnotation = (chartId: string, data: AnnotationFormData) => {
    const newAnnotation: ChartAnnotation = {
      id: uuidv4(),
      chartId,
      ...data,
      createdAt: new Date(),
    }
    setAnnotations((prev) => [...prev, newAnnotation])
  }

  const updateAnnotation = (id: string, data: Partial<AnnotationFormData>) => {
    setAnnotations((prev) => prev.map((ann) => (ann.id === id ? { ...ann, ...data, updatedAt: new Date() } : ann)))
  }

  const deleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((ann) => ann.id !== id))
  }

  const getAnnotationsForChart = (chartId: string) => {
    return annotations.filter((ann) => ann.chartId === chartId)
  }

  return (
    <AnnotationContext.Provider
      value={{
        annotations,
        addAnnotation,
        updateAnnotation,
        deleteAnnotation,
        getAnnotationsForChart,
      }}
    >
      {children}
    </AnnotationContext.Provider>
  )
}

export function useAnnotations() {
  const context = useContext(AnnotationContext)
  if (context === undefined) {
    throw new Error("useAnnotations must be used within an AnnotationProvider")
  }
  return context
}
