"use client"

import { MoreVertical, Edit, Trash, Utensils } from "lucide-react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Rating } from "@/components/menu-item-rating"

interface MenuItem {
  id: string
  name: string
  description: string
  price: string
  image: string
  available: boolean
  rating?: number
  totalRatings?: number
}

interface MenuItemCardProps {
  item: MenuItem
  onEdit: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
  onToggleAvailability: (item: MenuItem) => void
  isOwnerView?: boolean
}

export function MenuItemCard({ item, onEdit, onDelete, onToggleAvailability, isOwnerView = true }: MenuItemCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(item)
      setConfirmDelete(false)
    } else {
      setConfirmDelete(true)
      // Reset after 3 seconds
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  const handleRatingChange = (newRating: number) => {
    // In a real app, this would call an API to save the rating
    console.log(`New rating for ${item.name}: ${newRating}`)
  }

  return (
    <Card className={`overflow-hidden ${!item.available ? "opacity-60" : ""}`}>
      <div className="relative h-40 bg-gray-100">
        <div className="h-32 w-full bg-gray-700 rounded-md flex items-center justify-center">
          <Utensils size={32} className="text-gray-400" />
        </div>
        {isOwnerView && (
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="bg-white/80 hover:bg-white">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleAvailability(item)}>
                  {item.available ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Mark as Unavailable
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Mark as Available
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-500">
                  <Trash className="mr-2 h-4 w-4" />
                  {confirmDelete ? "Confirm Delete?" : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg">{item.name}</CardTitle>
        <CardDescription className="text-sm">{item.price}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-gray-500">{item.description}</p>
        <div className="mt-2">
          <Rating
            initialRating={item.rating || 0}
            totalRatings={item.totalRatings || 0}
            itemId={item.id}
            readOnly={isOwnerView}
            onRatingChange={handleRatingChange}
          />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="flex items-center">
          <span className={`w-3 h-3 rounded-full mr-2 ${item.available ? "bg-green-500" : "bg-red-500"}`}></span>
          <span className="text-xs text-gray-500">{item.available ? "Available" : "Unavailable"}</span>
        </div>
      </CardFooter>
    </Card>
  )
}
