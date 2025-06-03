"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, Edit, Trash2, MessageSquare } from "lucide-react"
import { useAnnotations } from "@/contexts/annotation-context"
import { AnnotationForm } from "@/components/annotation-form"
import type { ChartAnnotation, AnnotationFormData } from "@/lib/annotation-types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AnnotationManagerProps {
  chartId: string
  chartLabels: string[]
  chartType: "line" | "bar" | "pie" | "doughnut"
}

export function AnnotationManager({ chartId, chartLabels, chartType }: AnnotationManagerProps) {
  const { getAnnotationsForChart, addAnnotation, updateAnnotation, deleteAnnotation } = useAnnotations()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedAnnotation, setSelectedAnnotation] = useState<ChartAnnotation | undefined>()
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true)

  const annotations = getAnnotationsForChart(chartId)

  const handleAddAnnotation = (data: AnnotationFormData) => {
    addAnnotation(chartId, data)
  }

  const handleEditAnnotation = (data: AnnotationFormData) => {
    if (selectedAnnotation) {
      updateAnnotation(selectedAnnotation.id, data)
    }
  }

  const handleDeleteAnnotation = (id: string) => {
    deleteAnnotation(id)
  }

  const openEditForm = (annotation: ChartAnnotation) => {
    setSelectedAnnotation(annotation)
    setIsFormOpen(true)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedAnnotation(undefined)
                  setIsFormOpen(true)
                }}
                aria-label="Add annotation"
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add annotation</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {annotations.length > 0 && (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showAnnotations ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setShowAnnotations(!showAnnotations)}
                    aria-label={showAnnotations ? "Hide annotations" : "Show annotations"}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {annotations.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {annotations.length}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{showAnnotations ? "Hide annotations" : "Show annotations"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Manage annotations">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Manage Annotations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {annotations.map((annotation) => (
                  <DropdownMenuItem key={annotation.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: annotation.color || "#ef4444" }}
                      ></div>
                      <span className="truncate max-w-[150px]">{annotation.label}</span>
                    </div>
                    <div className="flex items-center ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditForm(annotation)
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteAnnotation(annotation.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      <AnnotationForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={selectedAnnotation ? handleEditAnnotation : handleAddAnnotation}
        chartLabels={chartLabels}
        initialData={selectedAnnotation}
        chartType={chartType}
      />

      {/* This component will be used to pass the showAnnotations state to the chart */}
      {showAnnotations && <input type="hidden" id={`show-annotations-${chartId}`} value="true" />}
    </>
  )
}
