// Debug script to check authentication issues
require('dotenv').config({ path: './uni web/.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugAuth() {
  try {
    console.log('🔍 Checking all profiles in database...')
    
    // Get all profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
    
    if (error) {
      console.error('❌ Error fetching profiles:', error)
      return
    }
    
    console.log('📋 All profiles found:')
    profiles.forEach(profile => {
      console.log(`  - ID: ${profile.id}`)
      console.log(`    Email: ${profile.email || 'N/A'}`)
      console.log(`    Name: ${profile.full_name || 'N/A'}`)
      console.log(`    Role: ${profile.role || 'N/A'}`)
      console.log(`    Created: ${profile.created_at || 'N/A'}`)
      console.log('    ---')
    })
    
    // Check for cafeteria manager profiles specifically
    const { data: cafeteriaProfiles, error: cafeteriaError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'cafeteria_manager')
    
    console.log('\n🏪 Cafeteria manager profiles:')
    if (cafeteriaError) {
      console.error('❌ Error:', cafeteriaError)
    } else {
      console.log(`Found ${cafeteriaProfiles.length} cafeteria manager profiles`)
      cafeteriaProfiles.forEach(profile => {
        console.log(`  - ${profile.full_name} (${profile.email})`)
      })
    }
    
    // Check auth users
    console.log('\n👤 Checking auth users...')
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching auth users:', usersError)
    } else {
      console.log(`Found ${users.length} auth users`)
      users.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id})`)
      })
    }
    
  } catch (error) {
    console.error('💥 Debug error:', error)
  }
}

debugAuth()
