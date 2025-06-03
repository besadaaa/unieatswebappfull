import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()

    // Test users to create/update
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

    const results = []

    for (const user of testUsers) {
      try {
        // Check if user already exists in auth.users
        const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers({
          filter: `email.eq.${user.email}`
        })

        let authUserId: string

        if (existingAuthUser.users && existingAuthUser.users.length > 0) {
          authUserId = existingAuthUser.users[0].id

          // Update password for existing user
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            authUserId,
            { password: user.password }
          )

          if (updateError) {
            console.error(`Error updating password for ${user.email}:`, updateError)
          }
        } else {
          // Create new auth user
          const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true
          })

          if (authError) {
            console.error(`Error creating auth user ${user.email}:`, authError)
            results.push({ email: user.email, status: 'error', error: authError.message })
            continue
          }

          authUserId = newAuthUser.user!.id
        }

        // Create or update profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: authUserId,
            full_name: user.full_name,
            role: user.role,
            phone: user.phone,
            created_at: new Date().toISOString()
          })

        if (profileError) {
          console.error(`Error upserting profile for ${user.email}:`, profileError)
          results.push({ email: user.email, status: 'error', error: profileError.message })
          continue
        }

        // If cafeteria manager, ensure cafeteria record exists
        if (user.role === 'cafeteria_manager') {
          const { data: existingCafeteria } = await supabaseAdmin
            .from('cafeterias')
            .select('*')
            .eq('owner_id', authUserId)
            .single()

          if (!existingCafeteria) {
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
            }
          }
        }

        results.push({ email: user.email, status: 'success', password: user.password })

      } catch (error: any) {
        console.error(`Error processing user ${user.email}:`, error)
        results.push({ email: user.email, status: 'error', error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User setup completed',
      results,
      credentials: testUsers.map(u => ({ email: u.email, password: u.password, role: u.role }))
    })

  } catch (error: any) {
    console.error('Error in setup-users API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Setup Users API',
    instructions: 'Send a POST request to setup test users',
    testCredentials: [
      { email: 'admin@unieats.com', password: 'admin123', role: 'admin' },
      { email: 'student@unieats.com', password: 'student123', role: 'student' },
      { email: 'cafeteria@unieats.com', password: 'cafeteria123', role: 'cafeteria_manager' }
    ]
  })
}
