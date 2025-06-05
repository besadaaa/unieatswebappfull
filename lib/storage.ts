"use client"

import { supabase } from './supabase'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @returns Promise with upload result
 */
export async function uploadFile(
  file: File,
  bucket: string,
  path: string
): Promise<UploadResult> {
  try {
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size must be less than 5MB'
      }
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Only JPEG, PNG, WebP, and GIF images are allowed'
      }
    }

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true // Replace existing file
      })

    if (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return {
      success: true,
      url: urlData.publicUrl
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: 'Failed to upload file'
    }
  }
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @returns Promise with deletion result
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return {
      success: false,
      error: 'Failed to delete file'
    }
  }
}

/**
 * Upload cafeteria profile photo
 * @param file - The image file to upload
 * @param cafeteriaId - The cafeteria ID
 * @returns Promise with upload result
 */
export async function uploadCafeteriaPhoto(
  file: File,
  cafeteriaId: string
): Promise<UploadResult> {
  const timestamp = Date.now()
  const fileExt = file.name.split('.').pop()
  const fileName = `${cafeteriaId}_${timestamp}.${fileExt}`
  const filePath = `cafeterias/${fileName}`

  return uploadFile(file, 'profile-photos', filePath)
}

/**
 * Upload user avatar
 * @param file - The image file to upload
 * @param userId - The user ID
 * @returns Promise with upload result
 */
export async function uploadUserAvatar(
  file: File,
  userId: string
): Promise<UploadResult> {
  const timestamp = Date.now()
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}_${timestamp}.${fileExt}`
  const filePath = `avatars/${fileName}`

  return uploadFile(file, 'profile-photos', filePath)
}
