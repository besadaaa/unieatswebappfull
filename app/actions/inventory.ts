"use client"

import { supabase } from '@/lib/supabase'
import type { InventoryItem } from '@/lib/supabase'

// Get inventory items from Supabase
export async function getInventoryItems(cafeteriaId?: string): Promise<InventoryItem[]> {
  try {
    let query = supabase
      .from('inventory_items')
      .select('*')
      .order('name', { ascending: true })

    if (cafeteriaId) {
      query = query.eq('cafeteria_id', cafeteriaId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching inventory items:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching inventory items:', error)
    return []
  }
}

export async function addInventoryItem(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const category = formData.get("category") as string
    const quantity = Number.parseFloat(formData.get("quantity") as string)
    const unit = formData.get("unit") as string
    const min_quantity = Number.parseFloat(formData.get("min_quantity") as string)
    const cafeteriaId = formData.get("cafeteria_id") as string || "1"

    let status: 'in_stock' | 'low_stock' | 'out_of_stock' = "in_stock"
    if (quantity <= 0) {
      status = "out_of_stock"
    } else if (quantity < min_quantity) {
      status = "low_stock"
    }

    const itemData = {
      cafeteria_id: cafeteriaId,
      name,
      category,
      quantity,
      unit,
      min_quantity,
      status,
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .insert([itemData])
      .select()
      .single()

    if (error) {
      console.error('Error adding inventory item:', error)
      return { success: false, message: error.message }
    }

    return { success: true, message: "Inventory item added successfully", data }
  } catch (error) {
    console.error('Error adding inventory item:', error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function updateInventoryItem(id: string, formData: FormData) {
  try {
    const name = formData.get("name") as string
    const category = formData.get("category") as string
    const quantity = Number.parseFloat(formData.get("quantity") as string)
    const unit = formData.get("unit") as string
    const min_quantity = Number.parseFloat(formData.get("min_quantity") as string)

    let status: 'in_stock' | 'low_stock' | 'out_of_stock' = "in_stock"
    if (quantity <= 0) {
      status = "out_of_stock"
    } else if (quantity < min_quantity) {
      status = "low_stock"
    }

    const updateData = {
      name,
      category,
      quantity,
      unit,
      min_quantity,
      status,
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating inventory item:', error)
      return { success: false, message: error.message }
    }

    return { success: true, message: "Inventory item updated successfully", data }
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function deleteInventoryItem(id: string) {
  try {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting inventory item:', error)
      return { success: false, message: error.message }
    }

    return { success: true, message: "Inventory item deleted successfully" }
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return { success: false, message: "An unexpected error occurred" }
  }
}
