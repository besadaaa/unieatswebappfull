"use client"

import { useState, useEffect } from "react"
import SettingsService from "@/lib/settings-service"

interface DynamicCategoriesProps {
  type: 'menu' | 'inventory' | 'cafeteria'
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
  className?: string
  children?: (categories: string[], loading: boolean) => React.ReactNode
}

export function DynamicCategories({ 
  type, 
  selectedCategory, 
  onCategoryChange, 
  className = "",
  children 
}: DynamicCategoriesProps) {
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [type])

  const loadCategories = async () => {
    try {
      setLoading(true)
      let categoryList: string[] = []
      
      switch (type) {
        case 'menu':
          categoryList = await SettingsService.getMenuCategories()
          break
        case 'inventory':
          categoryList = await SettingsService.getInventoryCategories()
          break
        case 'cafeteria':
          categoryList = await SettingsService.getCafeteriaCategories()
          break
      }
      
      setCategories(categoryList)
    } catch (error) {
      console.error(`Error loading ${type} categories:`, error)
      // Fallback to default categories
      switch (type) {
        case 'menu':
          setCategories([
            "Breakfast", "Lunch", "Dinner", "Snacks", 
            "Beverages", "Desserts", "Vegan", "Vegetarian"
          ])
          break
        case 'inventory':
          setCategories([
            "produce", "meat", "dairy", "bakery", "grains",
            "beverages", "condiments", "frozen", "other"
          ])
          break
        case 'cafeteria':
          setCategories([
            "All", "Fast Food", "Healthy", "Desserts", "Beverages", "Asian"
          ])
          break
      }
    } finally {
      setLoading(false)
    }
  }

  // If children function is provided, use render prop pattern
  if (children) {
    return <>{children(categories, loading)}</>
  }

  // Default rendering as buttons
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {loading ? (
        <div className="text-sm text-gray-400">Loading categories...</div>
      ) : (
        categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange?.(category)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {category}
          </button>
        ))
      )}
    </div>
  )
}

// Hook for using categories in components
export function useCategories(type: 'menu' | 'inventory' | 'cafeteria') {
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true)
        let categoryList: string[] = []
        
        switch (type) {
          case 'menu':
            categoryList = await SettingsService.getMenuCategories()
            break
          case 'inventory':
            categoryList = await SettingsService.getInventoryCategories()
            break
          case 'cafeteria':
            categoryList = await SettingsService.getCafeteriaCategories()
            break
        }
        
        setCategories(categoryList)
      } catch (error) {
        console.error(`Error loading ${type} categories:`, error)
        // Fallback to default categories
        switch (type) {
          case 'menu':
            setCategories([
              "Breakfast", "Lunch", "Dinner", "Snacks", 
              "Beverages", "Desserts", "Vegan", "Vegetarian"
            ])
            break
          case 'inventory':
            setCategories([
              "produce", "meat", "dairy", "bakery", "grains",
              "beverages", "condiments", "frozen", "other"
            ])
            break
          case 'cafeteria':
            setCategories([
              "All", "Fast Food", "Healthy", "Desserts", "Beverages", "Asian"
            ])
            break
        }
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [type])

  return { categories, loading }
}
