import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Debug: Checking Supabase storage configuration...')
    
    const supabaseAdmin = createSupabaseAdmin()
    
    // List all storage buckets
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError)
      return NextResponse.json({ 
        error: 'Failed to list buckets',
        details: bucketsError 
      }, { status: 500 })
    }

    console.log('📦 Available storage buckets:', buckets)

    // Check if profile-photos bucket exists
    const profilePhotosBucket = buckets?.find(bucket => bucket.name === 'profile-photos')
    
    if (!profilePhotosBucket) {
      console.log('⚠️ profile-photos bucket does not exist, creating it...')
      
      // Create the bucket
      const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket('profile-photos', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 5242880 // 5MB
      })

      if (createError) {
        console.error('Error creating bucket:', createError)
        return NextResponse.json({ 
          error: 'Failed to create profile-photos bucket',
          details: createError 
        }, { status: 500 })
      }

      console.log('✅ Created profile-photos bucket:', newBucket)
    } else {
      console.log('✅ profile-photos bucket exists:', profilePhotosBucket)
    }

    // Test upload a small file to check permissions
    const testFileName = `test-${Date.now()}.txt`
    const testContent = new Blob(['test content'], { type: 'text/plain' })
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('profile-photos')
      .upload(`test/${testFileName}`, testContent)

    if (uploadError) {
      console.error('Error testing upload:', uploadError)
      return NextResponse.json({
        success: false,
        buckets,
        profilePhotosBucket,
        testUpload: {
          error: uploadError,
          message: 'Upload test failed'
        }
      })
    }

    console.log('✅ Test upload successful:', uploadData)

    // Clean up test file
    await supabaseAdmin.storage
      .from('profile-photos')
      .remove([`test/${testFileName}`])

    console.log('🧹 Test file cleaned up')

    // Get bucket details
    const { data: bucketDetails, error: detailsError } = await supabaseAdmin.storage
      .from('profile-photos')
      .list('', { limit: 5 })

    return NextResponse.json({
      success: true,
      data: {
        buckets,
        profilePhotosBucket,
        testUpload: {
          success: true,
          path: uploadData.path
        },
        bucketContents: bucketDetails || [],
        message: 'Storage configuration is working correctly'
      }
    })

  } catch (error) {
    console.error('Storage debug API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    console.log('🧪 Testing avatar upload functionality...')
    
    const supabaseAdmin = createSupabaseAdmin()
    
    // Create a test image blob
    const canvas = new OffscreenCanvas(100, 100)
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ff0000'
      ctx.fillRect(0, 0, 100, 100)
    }
    
    const testImageBlob = await canvas.convertToBlob({ type: 'image/png' })
    const testUserId = 'test-user-' + Date.now()
    const fileName = `${testUserId}_${Date.now()}.png`
    const filePath = `avatars/${fileName}`

    console.log('📤 Uploading test avatar:', filePath)

    // Test the upload
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('profile-photos')
      .upload(filePath, testImageBlob, {
        cacheControl: '3600',
        upsert: true
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
        message: 'Avatar upload test successful'
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
