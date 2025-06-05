import { createSupabaseAdmin } from '../lib/supabase'

const supabaseAdmin = createSupabaseAdmin()

const testUsers = [
  {
    email: 'admin@unieats.com',
    password: 'admin123',
    role: 'admin',
    full_name: 'UniEats Administrator',
    phone: '+1234567890'
  },
  {
    email: 'student@unieats.com', 
    password: 'student123',
    role: 'student',
    full_name: 'John Student',
    phone: '+1234567891',
    university: 'Egyptian University of Informatics',
    year: '3rd Year'
  },
  {
    email: 'cafeteria@unieats.com',
    password: 'cafeteria123', 
    role: 'cafeteria_manager',
    full_name: 'Cafeteria Manager',
    phone: '+1234567892'
  }
]

async function setupTestUsers() {
  console.log('Setting up test users...')

  for (const user of testUsers) {
    try {
      console.log(`\nProcessing user: ${user.email}`)

      // Check if user already exists in auth.users
      const { data: existingAuthUser } = await supabaseAdmin.auth.admin.getUserByEmail(user.email)
      
      let authUserId: string

      if (existingAuthUser.user) {
        console.log(`Auth user already exists: ${user.email}`)
        authUserId = existingAuthUser.user.id

        // Update password for existing user
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          authUserId,
          { password: user.password }
        )

        if (updateError) {
          console.error(`Error updating password for ${user.email}:`, updateError)
        } else {
          console.log(`Password updated for ${user.email}`)
        }
      } else {
        // Create new auth user
        console.log(`Creating new auth user: ${user.email}`)
        const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true
        })

        if (authError) {
          console.error(`Error creating auth user ${user.email}:`, authError)
          continue
        }

        authUserId = newAuthUser.user!.id
        console.log(`Created auth user: ${user.email} with ID: ${authUserId}`)
      }

      // Check if profile exists
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', authUserId)
        .single()

      if (existingProfile) {
        console.log(`Profile already exists for: ${user.email}`)
        
        // Update existing profile
        const { error: updateProfileError } = await supabaseAdmin
          .from('profiles')
          .update({
            full_name: user.full_name,
            role: user.role,
            phone: user.phone,
            university: user.role === 'student' ? user.university : null,
            year: user.role === 'student' ? user.year : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', authUserId)

        if (updateProfileError) {
          console.error(`Error updating profile for ${user.email}:`, updateProfileError)
        } else {
          console.log(`Profile updated for: ${user.email}`)
        }
      } else {
        // Create new profile
        console.log(`Creating profile for: ${user.email}`)
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: authUserId,
            full_name: user.full_name,
            role: user.role,
            phone: user.phone,
            university: user.role === 'student' ? user.university : null,
            year: user.role === 'student' ? user.year : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.error(`Error creating profile for ${user.email}:`, profileError)
        } else {
          console.log(`Profile created for: ${user.email}`)
        }
      }

      // If cafeteria manager, ensure cafeteria record exists
      if (user.role === 'cafeteria_manager') {
        const { data: existingCafeteria } = await supabaseAdmin
          .from('cafeterias')
          .select('*')
          .eq('owner_id', authUserId)
          .single()

        if (!existingCafeteria) {
          console.log(`Creating cafeteria record for: ${user.email}`)
          const { error: cafeteriaError } = await supabaseAdmin
            .from('cafeterias')
            .insert({
              name: 'Test Cafeteria',
              location: 'Campus Building A',
              description: 'A test cafeteria for demonstration purposes',
              owner_id: authUserId,
              approval_status: 'approved',
              is_active: true,
              is_open: true,
              rating: 4.5,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (cafeteriaError) {
            console.error(`Error creating cafeteria for ${user.email}:`, cafeteriaError)
          } else {
            console.log(`Cafeteria created for: ${user.email}`)
          }
        } else {
          console.log(`Cafeteria already exists for: ${user.email}`)
        }
      }

    } catch (error) {
      console.error(`Error processing user ${user.email}:`, error)
    }
  }

  console.log('\n✅ Test users setup completed!')
  console.log('\nTest Credentials:')
  testUsers.forEach(user => {
    console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`)
  })
}

// Run the setup
setupTestUsers().catch(console.error)
