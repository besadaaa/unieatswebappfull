"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type AnnotationFormData, DEFAULT_ANNOTATION_COLORS, type ChartAnnotation } from "@/lib/annotation-types"

interface AnnotationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AnnotationFormData) => void
  chartLabels: string[]
  initialData?: ChartAnnotation
  chartType: "line" | "bar" | "pie" | "doughnut"
}

export function AnnotationForm({
  open,
  onOpenChange,
  onSubmit,
  chartLabels,
  initialData,
  chartType,
}: AnnotationFormProps) {
  const [formData, setFormData] = useState<AnnotationFormData>({
    type: "point",
    xIndex: 0,
    label: "",
    color: DEFAULT_ANNOTATION_COLORS[0],
    description: "",
  })

  // Reset form when dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          type: initialData.type,
          xIndex: initialData.xIndex,
          xRange: initialData.xRange,
          yValue: initialData.yValue,
          label: initialData.label,
          color: initialData.color || DEFAULT_ANNOTATION_COLORS[0],
          description: initialData.description || "",
        })
      } else {
        setFormData({
          type: "point",
          xIndex: 0,
          label: "",
          color: DEFAULT_ANNOTATION_COLORS[0],
          description: "",
        })
      }
    }
  }, [open, initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onOpenChange(false)
  }

  const handleChange = (field: keyof AnnotationFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Annotation" : "Add Annotation"}</DialogTitle>
          <DialogDescription>Highlight important points or trends on your chart.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">Annotation Type</Label>
            <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="point">Point</SelectItem>
                {chartType !== "pie" && chartType !== "doughnut" && (
                  <>
                    <SelectItem value="line">Line</SelectItem>
                    <SelectItem value="range">Range</SelectItem>
                    <SelectItem value="threshold">Threshold</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {(formData.type === "point" || formData.type === "line") && (
            <div className="space-y-2">
              <Label htmlFor="xIndex">Data Point</Label>
              <Select
                value={formData.xIndex?.toString() || "0"}
                onValueChange={(value) => handleChange("xIndex", Number.parseInt(value))}
              >
                <SelectTrigger id="xIndex">
                  <SelectValue placeholder="Select data point" />
                </SelectTrigger>
                <SelectContent>
                  {chartLabels.map((label, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.type === "range" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rangeStart">Range Start</Label>
                <Select
                  value={(formData.xRange?.[0] || 0).toString()}
                  onValueChange={(value) =>
                    handleChange("xRange", [Number.parseInt(value), formData.xRange?.[1] || chartLabels.length - 1])
                  }
                >
                  <SelectTrigger id="rangeStart">
                    <SelectValue placeholder="Start" />
                  </SelectTrigger>
                  <SelectContent>
                    {chartLabels.map((label, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rangeEnd">Range End</Label>
                <Select
                  value={(formData.xRange?.[1] || chartLabels.length - 1).toString()}
                  onValueChange={(value) => handleChange("xRange", [formData.xRange?.[0] || 0, Number.parseInt(value)])}
                >
                  <SelectTrigger id="rangeEnd">
                    <SelectValue placeholder="End" />
                  </SelectTrigger>
                  <SelectContent>
                    {chartLabels.map((label, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {formData.type === "threshold" && (
            <div className="space-y-2">
              <Label htmlFor="yValue">Threshold Value</Label>
              <Input
                id="yValue"
                type="number"
                value={formData.yValue || 0}
                onChange={(e) => handleChange("yValue", Number.parseFloat(e.target.value))}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => handleChange("label", e.target.value)}
              placeholder="e.g., Peak Sales, Anomaly, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_ANNOTATION_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-6 h-6 rounded-full border-2 ${
                    formData.color === color ? "border-white ring-2 ring-black" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleChange("color", color)}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Add more details about this annotation..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{initialData ? "Update" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
