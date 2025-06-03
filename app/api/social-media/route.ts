// Social Media Integration API Endpoint
import { NextRequest, NextResponse } from 'next/server'
import { 
  connectSocialMediaAccount, 
  createSocialMediaPost, 
  publishPost,
  createPostTemplate,
  generatePostFromTemplate,
  getSocialMediaAnalytics,
  syncEngagementData
} from '@/lib/social-media-integration'
import { withRateLimit } from '@/lib/rate-limiting'

async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const cafeteriaId = searchParams.get('cafeteriaId')

    if (!cafeteriaId) {
      return NextResponse.json(
        { error: 'Cafeteria ID is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'analytics':
        const platform = searchParams.get('platform') as 'tiktok' | 'instagram' | undefined
        const timeRange = parseInt(searchParams.get('timeRange') || '30')

        const analyticsResult = await getSocialMediaAnalytics(cafeteriaId, platform, timeRange)
        return NextResponse.json({
          success: analyticsResult.success,
          data: analyticsResult.data,
          error: analyticsResult.error
        })

      case 'sync_engagement':
        await syncEngagementData(cafeteriaId)
        return NextResponse.json({
          success: true,
          message: 'Engagement data sync initiated'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in social media GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function postHandler(request: NextRequest) {
  try {
    const formData = await request.formData()
    const action = formData.get('action') as string
    const cafeteriaId = formData.get('cafeteriaId') as string

    if (!cafeteriaId) {
      return NextResponse.json(
        { error: 'Cafeteria ID is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'connect_account':
        const platform = formData.get('platform') as 'tiktok' | 'instagram'
        const accountDataStr = formData.get('accountData') as string

        if (!platform || !accountDataStr) {
          return NextResponse.json(
            { error: 'Platform and account data are required' },
            { status: 400 }
          )
        }

        const accountData = JSON.parse(accountDataStr)
        const connectResult = await connectSocialMediaAccount(cafeteriaId, platform, accountData)

        return NextResponse.json({
          success: connectResult.success,
          account: connectResult.account,
          error: connectResult.error
        })

      case 'create_post':
        const postDataStr = formData.get('postData') as string
        if (!postDataStr) {
          return NextResponse.json(
            { error: 'Post data is required' },
            { status: 400 }
          )
        }

        const postData = JSON.parse(postDataStr)

        // Get media files
        const mediaFiles: File[] = []
        const fileKeys = Array.from(formData.keys()).filter(key => key.startsWith('media_'))
        for (const key of fileKeys) {
          const file = formData.get(key) as File
          if (file) mediaFiles.push(file)
        }

        postData.media_files = mediaFiles

        const createResult = await createSocialMediaPost(cafeteriaId, postData)
        return NextResponse.json({
          success: createResult.success,
          post: createResult.post,
          error: createResult.error
        })

      case 'publish_post':
        const postId = formData.get('postId') as string
        if (!postId) {
          return NextResponse.json(
            { error: 'Post ID is required' },
            { status: 400 }
          )
        }

        const publishResult = await publishPost(postId)
        return NextResponse.json({
          success: publishResult.success,
          platform_post_id: publishResult.platform_post_id,
          error: publishResult.error
        })

      case 'create_template':
        const templateDataStr = formData.get('templateData') as string
        if (!templateDataStr) {
          return NextResponse.json(
            { error: 'Template data is required' },
            { status: 400 }
          )
        }

        const templateData = JSON.parse(templateDataStr)
        const templateResult = await createPostTemplate(cafeteriaId, templateData)

        return NextResponse.json({
          success: templateResult.success,
          template: templateResult.template,
          error: templateResult.error
        })

      case 'generate_from_template':
        const templateId = formData.get('templateId') as string
        const variablesStr = formData.get('variables') as string

        if (!templateId || !variablesStr) {
          return NextResponse.json(
            { error: 'Template ID and variables are required' },
            { status: 400 }
          )
        }

        const variables = JSON.parse(variablesStr)
        const generateResult = await generatePostFromTemplate(templateId, variables)

        return NextResponse.json({
          success: generateResult.success,
          postData: generateResult.postData,
          error: generateResult.error
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in social media POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit('api')(getHandler)
export const POST = withRateLimit('api')(postHandler)
