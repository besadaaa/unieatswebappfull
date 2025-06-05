// Social Media Integration for TikTok and Instagram
import { supabase } from './supabase'

export interface SocialMediaPost {
  id: string
  cafeteria_id: string
  platform: 'tiktok' | 'instagram'
  post_type: 'image' | 'video' | 'story' | 'reel'
  content: {
    caption: string
    media_urls: string[]
    hashtags: string[]
    mentions: string[]
  }
  scheduling: {
    scheduled_for?: string
    published_at?: string
    status: 'draft' | 'scheduled' | 'published' | 'failed'
  }
  engagement: {
    likes: number
    comments: number
    shares: number
    views: number
  }
  created_at: string
  updated_at: string
}

export interface SocialMediaAccount {
  id: string
  cafeteria_id: string
  platform: 'tiktok' | 'instagram'
  username: string
  display_name: string
  profile_picture_url?: string
  follower_count: number
  following_count: number
  post_count: number
  is_verified: boolean
  is_business_account: boolean
  access_token?: string // Encrypted
  refresh_token?: string // Encrypted
  token_expires_at?: string
  connected_at: string
  last_sync_at?: string
  is_active: boolean
}

export interface PostTemplate {
  id: string
  cafeteria_id: string
  name: string
  description: string
  template_type: 'menu_showcase' | 'daily_special' | 'behind_scenes' | 'customer_review' | 'promotion'
  content_template: {
    caption_template: string
    hashtags: string[]
    media_requirements: {
      type: 'image' | 'video'
      count: number
      dimensions?: { width: number; height: number }
    }
  }
  platforms: ('tiktok' | 'instagram')[]
  is_active: boolean
  created_at: string
}

// Connect social media account
export const connectSocialMediaAccount = async (
  cafeteriaId: string,
  platform: 'tiktok' | 'instagram',
  accountData: {
    username: string
    display_name: string
    access_token: string
    refresh_token?: string
    profile_data: any
  }
): Promise<{ success: boolean; account?: SocialMediaAccount; error?: string }> => {
  try {
    // Check if account already connected
    const { data: existingAccount } = await supabase
      .from('social_media_accounts')
      .select('id')
      .eq('cafeteria_id', cafeteriaId)
      .eq('platform', platform)
      .eq('username', accountData.username)
      .single()

    if (existingAccount) {
      return {
        success: false,
        error: 'This account is already connected'
      }
    }

    // Create new social media account record
    const { data: account, error } = await supabase
      .from('social_media_accounts')
      .insert([{
        cafeteria_id: cafeteriaId,
        platform,
        username: accountData.username,
        display_name: accountData.display_name,
        profile_picture_url: accountData.profile_data.profile_picture_url,
        follower_count: accountData.profile_data.follower_count || 0,
        following_count: accountData.profile_data.following_count || 0,
        post_count: accountData.profile_data.post_count || 0,
        is_verified: accountData.profile_data.is_verified || false,
        is_business_account: accountData.profile_data.is_business_account || false,
        access_token: await encryptToken(accountData.access_token),
        refresh_token: accountData.refresh_token ? await encryptToken(accountData.refresh_token) : null,
        token_expires_at: accountData.profile_data.token_expires_at,
        is_active: true
      }])
      .select()
      .single()

    if (error) throw error

    return { success: true, account }
  } catch (error) {
    console.error('Error connecting social media account:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Create social media post
export const createSocialMediaPost = async (
  cafeteriaId: string,
  postData: {
    platform: 'tiktok' | 'instagram'
    post_type: 'image' | 'video' | 'story' | 'reel'
    caption: string
    media_files: File[]
    hashtags: string[]
    mentions: string[]
    scheduled_for?: string
  }
): Promise<{ success: boolean; post?: SocialMediaPost; error?: string }> => {
  try {
    // Upload media files
    const mediaUrls = await uploadMediaFiles(postData.media_files, cafeteriaId)

    // Create post record
    const { data: post, error } = await supabase
      .from('social_media_posts')
      .insert([{
        cafeteria_id: cafeteriaId,
        platform: postData.platform,
        post_type: postData.post_type,
        content: {
          caption: postData.caption,
          media_urls: mediaUrls,
          hashtags: postData.hashtags,
          mentions: postData.mentions
        },
        scheduling: {
          scheduled_for: postData.scheduled_for,
          status: postData.scheduled_for ? 'scheduled' : 'draft'
        },
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0
        }
      }])
      .select()
      .single()

    if (error) throw error

    // If scheduled, add to posting queue
    if (postData.scheduled_for) {
      await schedulePost(post.id, postData.scheduled_for)
    }

    return { success: true, post }
  } catch (error) {
    console.error('Error creating social media post:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Publish post to social media platform
export const publishPost = async (
  postId: string
): Promise<{ success: boolean; platform_post_id?: string; error?: string }> => {
  try {
    // Get post details
    const { data: post, error: postError } = await supabase
      .from('social_media_posts')
      .select(`
        *,
        social_media_accounts(*)
      `)
      .eq('id', postId)
      .single()

    if (postError || !post) {
      throw new Error('Post not found')
    }

    // Get connected account for the platform
    const { data: account } = await supabase
      .from('social_media_accounts')
      .select('*')
      .eq('cafeteria_id', post.cafeteria_id)
      .eq('platform', post.platform)
      .eq('is_active', true)
      .single()

    if (!account) {
      throw new Error(`No active ${post.platform} account connected`)
    }

    // Publish based on platform
    let platformPostId: string
    if (post.platform === 'instagram') {
      platformPostId = await publishToInstagram(post, account)
    } else if (post.platform === 'tiktok') {
      platformPostId = await publishToTikTok(post, account)
    } else {
      throw new Error('Unsupported platform')
    }

    // Update post status
    await supabase
      .from('social_media_posts')
      .update({
        scheduling: {
          ...post.scheduling,
          status: 'published',
          published_at: new Date().toISOString()
        },
        platform_post_id: platformPostId,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)

    return { success: true, platform_post_id: platformPostId }
  } catch (error) {
    console.error('Error publishing post:', error)
    
    // Update post status to failed
    await supabase
      .from('social_media_posts')
      .update({
        scheduling: {
          status: 'failed'
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Create post template
export const createPostTemplate = async (
  cafeteriaId: string,
  templateData: Omit<PostTemplate, 'id' | 'cafeteria_id' | 'created_at'>
): Promise<{ success: boolean; template?: PostTemplate; error?: string }> => {
  try {
    const { data: template, error } = await supabase
      .from('post_templates')
      .insert([{
        ...templateData,
        cafeteria_id: cafeteriaId
      }])
      .select()
      .single()

    if (error) throw error

    return { success: true, template }
  } catch (error) {
    console.error('Error creating post template:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Generate post from template
export const generatePostFromTemplate = async (
  templateId: string,
  variables: Record<string, string>
): Promise<{ success: boolean; postData?: any; error?: string }> => {
  try {
    const { data: template, error } = await supabase
      .from('post_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error || !template) {
      throw new Error('Template not found')
    }

    // Replace variables in caption template
    let caption = template.content_template.caption_template
    Object.entries(variables).forEach(([key, value]) => {
      caption = caption.replace(new RegExp(`{{${key}}}`, 'g'), value)
    })

    const postData = {
      caption,
      hashtags: template.content_template.hashtags,
      media_requirements: template.content_template.media_requirements,
      platforms: template.platforms
    }

    return { success: true, postData }
  } catch (error) {
    console.error('Error generating post from template:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get social media analytics
export const getSocialMediaAnalytics = async (
  cafeteriaId: string,
  platform?: 'tiktok' | 'instagram',
  timeRange: number = 30
): Promise<{
  success: boolean
  data?: {
    total_posts: number
    total_engagement: number
    average_engagement_rate: number
    follower_growth: number
    top_performing_posts: any[]
    engagement_by_day: any[]
    hashtag_performance: any[]
  }
  error?: string
}> => {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - timeRange)

    // Get posts
    let postsQuery = supabase
      .from('social_media_posts')
      .select('*')
      .eq('cafeteria_id', cafeteriaId)
      .gte('created_at', startDate.toISOString())

    if (platform) {
      postsQuery = postsQuery.eq('platform', platform)
    }

    const { data: posts, error: postsError } = await postsQuery

    if (postsError) throw postsError

    // Calculate analytics
    const totalPosts = posts?.length || 0
    const totalEngagement = posts?.reduce((sum, post) => 
      sum + post.engagement.likes + post.engagement.comments + post.engagement.shares, 0) || 0
    
    const averageEngagementRate = totalPosts > 0 ? totalEngagement / totalPosts : 0

    // Get top performing posts
    const topPerformingPosts = posts
      ?.sort((a, b) => {
        const aEngagement = a.engagement.likes + a.engagement.comments + a.engagement.shares
        const bEngagement = b.engagement.likes + b.engagement.comments + b.engagement.shares
        return bEngagement - aEngagement
      })
      .slice(0, 5) || []

    // Engagement by day
    const engagementByDay = posts?.reduce((acc, post) => {
      const date = new Date(post.created_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, engagement: 0, posts: 0 }
      }
      acc[date].engagement += post.engagement.likes + post.engagement.comments + post.engagement.shares
      acc[date].posts += 1
      return acc
    }, {} as Record<string, any>) || {}

    // Hashtag performance
    const hashtagPerformance = posts?.flatMap(post => 
      post.content.hashtags.map(hashtag => ({
        hashtag,
        engagement: post.engagement.likes + post.engagement.comments + post.engagement.shares
      }))
    ).reduce((acc, { hashtag, engagement }) => {
      if (!acc[hashtag]) {
        acc[hashtag] = { hashtag, total_engagement: 0, usage_count: 0 }
      }
      acc[hashtag].total_engagement += engagement
      acc[hashtag].usage_count += 1
      return acc
    }, {} as Record<string, any>) || {}

    return {
      success: true,
      data: {
        total_posts: totalPosts,
        total_engagement: totalEngagement,
        average_engagement_rate: averageEngagementRate,
        follower_growth: 0, // Would need historical data
        top_performing_posts: topPerformingPosts,
        engagement_by_day: Object.values(engagementByDay),
        hashtag_performance: Object.values(hashtagPerformance)
          .sort((a: any, b: any) => b.total_engagement - a.total_engagement)
          .slice(0, 10)
      }
    }
  } catch (error) {
    console.error('Error getting social media analytics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Helper functions
const uploadMediaFiles = async (files: File[], cafeteriaId: string): Promise<string[]> => {
  const urls: string[] = []
  
  for (const file of files) {
    try {
      const fileName = `${cafeteriaId}/social-media/${Date.now()}_${file.name}`
      const { data, error } = await supabase.storage
        .from('social-media-content')
        .upload(fileName, file)

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('social-media-content')
        .getPublicUrl(fileName)

      urls.push(urlData.publicUrl)
    } catch (error) {
      console.error('Error uploading media file:', error)
    }
  }
  
  return urls
}

const encryptToken = async (token: string): Promise<string> => {
  // In production, use proper encryption
  // For now, just base64 encode (NOT SECURE)
  return btoa(token)
}

const decryptToken = async (encryptedToken: string): Promise<string> => {
  // In production, use proper decryption
  // For now, just base64 decode
  return atob(encryptedToken)
}

const schedulePost = async (postId: string, scheduledFor: string): Promise<void> => {
  // In production, this would integrate with a job queue system
  // For now, we'll just store the schedule in the database
  console.log(`Post ${postId} scheduled for ${scheduledFor}`)
}

// Platform-specific publishing functions (simplified)
const publishToInstagram = async (post: any, account: any): Promise<string> => {
  // This would integrate with Instagram Basic Display API or Instagram Graph API
  // For now, return a mock post ID
  console.log('Publishing to Instagram:', post.content.caption)
  return `ig_${Date.now()}`
}

const publishToTikTok = async (post: any, account: any): Promise<string> => {
  // This would integrate with TikTok API for Business
  // For now, return a mock post ID
  console.log('Publishing to TikTok:', post.content.caption)
  return `tt_${Date.now()}`
}

// Sync engagement data from platforms
export const syncEngagementData = async (cafeteriaId: string): Promise<void> => {
  try {
    // Get all published posts for the cafeteria
    const { data: posts } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('cafeteria_id', cafeteriaId)
      .eq('scheduling.status', 'published')
      .not('platform_post_id', 'is', null)

    for (const post of posts || []) {
      try {
        // Fetch engagement data from platform APIs
        const engagementData = await fetchEngagementFromPlatform(post.platform, post.platform_post_id)
        
        // Update post with new engagement data
        await supabase
          .from('social_media_posts')
          .update({
            engagement: engagementData,
            updated_at: new Date().toISOString()
          })
          .eq('id', post.id)
      } catch (error) {
        console.error(`Error syncing engagement for post ${post.id}:`, error)
      }
    }
  } catch (error) {
    console.error('Error syncing engagement data:', error)
  }
}

const fetchEngagementFromPlatform = async (platform: string, platformPostId: string): Promise<any> => {
  // This would make actual API calls to get engagement data
  // For now, return mock data with some randomization
  return {
    likes: Math.floor(Math.random() * 1000),
    comments: Math.floor(Math.random() * 100),
    shares: Math.floor(Math.random() * 50),
    views: Math.floor(Math.random() * 5000)
  }
}
