import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🧪 Testing avatar upload functionality...')
    
    const supabaseAdmin = createSupabaseAdmin()
    
    // Create a simple 1x1 pixel PNG image as a test
    // This is a valid PNG file in base64 format (1x1 transparent pixel)
    const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=='
    const pngBuffer = Buffer.from(base64PNG, 'base64')
    
    const testUserId = 'test-user-' + Date.now()
    const fileName = `${testUserId}_${Date.now()}.png`
    const filePath = `avatars/${fileName}`

    console.log('📤 Uploading test avatar:', filePath)

    // Test the upload
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('profile-photos')
      .upload(filePath, pngBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/png'
      })

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError)
      return NextResponse.json({
        success: false,
        error: 'Upload failed',
        details: uploadError
      }, { status: 500 })
    }

    console.log('✅ Upload successful:', uploadData)

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('profile-photos')
      .getPublicUrl(filePath)

    console.log('🔗 Public URL:', urlData.publicUrl)

    // Test updating a profile with the avatar URL
    const { data: profileUpdate, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', 'a9239cb0-7d3a-4ed7-a819-c5906444feb6') // Test cafeteria manager
      .select()

    if (profileError) {
      console.error('❌ Profile update failed:', profileError)
    } else {
      console.log('✅ Profile updated with avatar URL:', profileUpdate)
    }

    // Clean up test file
    await supabaseAdmin.storage
      .from('profile-photos')
      .remove([filePath])

    console.log('🧹 Test file cleaned up')

    return NextResponse.json({
      success: true,
      data: {
        uploadPath: uploadData.path,
        publicUrl: urlData.publicUrl,
        profileUpdate: profileUpdate || null,
        profileError: profileError || null,
        message: 'Avatar upload test completed successfully'
      }
    })

  } catch (error) {
    console.error('Avatar upload test error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}
