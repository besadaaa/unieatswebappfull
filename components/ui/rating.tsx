"use client"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Star } from "lucide-react"

interface RatingProps {
  initialRating?: number
  totalRatings?: number
  itemId: string
  readOnly?: boolean
  size?: "sm" | "md" | "lg"
}

const Rating = ({ initialRating = 0, totalRatings = 0, itemId, readOnly = false, size = "md" }: RatingProps) => {
  const [rating, setRating] = useState(initialRating)
  const [hoverRating, setHoverRating] = useState(0)

  const starSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  }

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={starSizes[size]}
          className={cn(
            "text-gray-300 transition-colors",
            (hoverRating ? star <= hoverRating : star <= rating) && "text-yellow-400 fill-yellow-400",
            !readOnly && "cursor-pointer",
          )}
          onMouseEnter={() => !readOnly && setHoverRating(star)}
          onMouseLeave={() => !readOnly && setHoverRating(0)}
          onClick={() => !readOnly && setRating(star)}
        />
      ))}
    </div>
  )
}

export { Rating }
