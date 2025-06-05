"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

interface RatingProps {
  initialRating?: number
  totalRatings?: number
  itemId: string
  readOnly?: boolean
  size?: "sm" | "md" | "lg"
  onRatingChange?: (rating: number) => void
}

export function Rating({
  initialRating = 0,
  totalRatings = 0,
  itemId,
  readOnly = false,
  size = "md",
  onRatingChange,
}: RatingProps) {
  const [rating, setRating] = useState(initialRating)
  const [hoverRating, setHoverRating] = useState(0)
  const [hasRated, setHasRated] = useState(false)

  const starSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  }

  const handleRating = (newRating: number) => {
    if (readOnly) return

    // Show loading state
    toast({
      title: "Submitting rating...",
      description: "Please wait while we save your rating.",
    })

    // Simulate API call
    setTimeout(() => {
      setRating(newRating)
      setHasRated(true)

      if (onRatingChange) {
        onRatingChange(newRating)
      }

      // In a real app, this would call an API to save the rating
      toast({
        title: "Rating submitted",
        description: `You rated this item ${newRating} stars. Thank you for your feedback!`,
      })
    }, 1000)
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Button
            key={star}
            variant="ghost"
            size="sm"
            className={cn("p-0 h-auto hover:bg-transparent", readOnly && "cursor-default")}
            onClick={() => handleRating(star)}
            onMouseEnter={() => !readOnly && setHoverRating(star)}
            onMouseLeave={() => !readOnly && setHoverRating(0)}
            disabled={readOnly || hasRated}
          >
            <Star
              size={starSizes[size]}
              className={cn(
                "text-gray-300 transition-colors",
                (hoverRating ? star <= hoverRating : star <= rating) && "text-yellow-400 fill-yellow-400",
              )}
            />
          </Button>
        ))}
        {totalRatings > 0 && <span className="text-xs text-gray-500 ml-2">({totalRatings})</span>}
      </div>
    </div>
  )
}
