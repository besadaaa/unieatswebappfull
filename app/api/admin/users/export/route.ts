import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const includeInactive = searchParams.get('includeInactive') === 'true'
    
    const supabase = createSupabaseAdmin()
    
    // Fetch all users with their profiles and cafeteria information
    let query = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        status,
        phone,
        created_at,
        updated_at,
        last_sign_in_at,
        cafeterias(name)
      `)
      .order('created_at', { ascending: false })
    
    if (!includeInactive) {
      query = query.eq('status', 'active')
    }
    
    const { data: users, error } = await query
    
    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
    
    // Transform data for export
    const exportData = users?.map(user => ({
      ID: user.id,
      'Full Name': user.full_name || 'N/A',
      Email: user.email || 'N/A',
      Role: user.role || 'student',
      Status: user.status || 'active',
      Phone: user.phone || 'N/A',
      Cafeteria: user.cafeterias?.name || 'N/A',
      'Created At': user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
      'Last Sign In': user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never',
    })) || []
    
    // Log export activity
    await supabase
      .from('audit_logs')
      .insert({
        action: 'user_export',
        entity_type: 'users',
        details: {
          format,
          count: exportData.length,
          includeInactive,
          timestamp: new Date().toISOString()
        }
      })
    
    if (format === 'excel') {
      // Create Excel file
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users')
      
      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.xlsx"`
        }
      })
    } else {
      // Create CSV file
      const headers = Object.keys(exportData[0] || {})
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value
          }).join(',')
        )
      ].join('\n')
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }
    
  } catch (error) {
    console.error('Error in user export API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint for custom export with filters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      format = 'csv', 
      filters = {}, 
      columns = [], 
      includeInactive = false 
    } = body
    
    const supabase = createSupabaseAdmin()
    
    // Build dynamic query based on filters
    let query = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        status,
        phone,
        created_at,
        updated_at,
        last_sign_in_at,
        cafeterias(name)
      `)
    
    // Apply filters
    if (filters.role && filters.role !== 'all') {
      query = query.eq('role', filters.role)
    }
    
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }
    
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }
    
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }
    
    if (!includeInactive) {
      query = query.eq('status', 'active')
    }
    
    const { data: users, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching filtered users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
    
    // Transform data based on selected columns
    const allColumns = {
      id: 'ID',
      full_name: 'Full Name',
      email: 'Email',
      role: 'Role',
      status: 'Status',
      phone: 'Phone',
      cafeteria: 'Cafeteria',
      created_at: 'Created At',
      last_sign_in_at: 'Last Sign In'
    }
    
    const selectedColumns = columns.length > 0 ? columns : Object.keys(allColumns)
    
    const exportData = users?.map(user => {
      const row: any = {}
      selectedColumns.forEach(col => {
        switch (col) {
          case 'id':
            row[allColumns.id] = user.id
            break
          case 'full_name':
            row[allColumns.full_name] = user.full_name || 'N/A'
            break
          case 'email':
            row[allColumns.email] = user.email || 'N/A'
            break
          case 'role':
            row[allColumns.role] = user.role || 'student'
            break
          case 'status':
            row[allColumns.status] = user.status || 'active'
            break
          case 'phone':
            row[allColumns.phone] = user.phone || 'N/A'
            break
          case 'cafeteria':
            row[allColumns.cafeteria] = user.cafeterias?.name || 'N/A'
            break
          case 'created_at':
            row[allColumns.created_at] = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'
            break
          case 'last_sign_in_at':
            row[allColumns.last_sign_in_at] = user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'
            break
        }
      })
      return row
    }) || []
    
    // Log export activity
    await supabase
      .from('audit_logs')
      .insert({
        action: 'user_export_filtered',
        entity_type: 'users',
        details: {
          format,
          filters,
          columns: selectedColumns,
          count: exportData.length,
          timestamp: new Date().toISOString()
        }
      })
    
    return NextResponse.json({
      success: true,
      data: exportData,
      count: exportData.length,
      format,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error in filtered user export API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
