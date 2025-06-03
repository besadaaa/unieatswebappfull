// Bulk User Operations System
import { supabase } from './supabase'
import * as XLSX from 'xlsx'
import { logUserActivity } from './financial'

export interface BulkUserData {
  email: string
  full_name: string
  role: 'admin' | 'cafeteria_manager' | 'student'
  phone?: string
  student_id?: string
  cafeteria_id?: string
  is_active?: boolean
}

export interface BulkOperationResult {
  success: boolean
  total_processed: number
  successful: number
  failed: number
  errors: BulkOperationError[]
  created_users?: string[]
  updated_users?: string[]
  deleted_users?: string[]
}

export interface BulkOperationError {
  row: number
  email?: string
  error: string
  data?: any
}

export interface ImportValidationResult {
  valid: boolean
  errors: BulkOperationError[]
  data: BulkUserData[]
  total_rows: number
}

// Import users from Excel/CSV file
export const importUsersFromFile = async (
  file: File,
  adminUserId: string
): Promise<BulkOperationResult> => {
  try {
    // Parse file
    const parseResult = await parseUserFile(file)
    if (!parseResult.valid) {
      return {
        success: false,
        total_processed: parseResult.total_rows,
        successful: 0,
        failed: parseResult.total_rows,
        errors: parseResult.errors
      }
    }

    // Process users in batches
    const batchSize = 50
    const results: BulkOperationResult = {
      success: true,
      total_processed: parseResult.data.length,
      successful: 0,
      failed: 0,
      errors: [],
      created_users: []
    }

    for (let i = 0; i < parseResult.data.length; i += batchSize) {
      const batch = parseResult.data.slice(i, i + batchSize)
      const batchResult = await processBatchImport(batch, i)
      
      results.successful += batchResult.successful
      results.failed += batchResult.failed
      results.errors.push(...batchResult.errors)
      results.created_users?.push(...(batchResult.created_users || []))
    }

    // Log the bulk operation
    await logUserActivity(
      adminUserId,
      'bulk_user_import',
      'user_management',
      null,
      {
        total_processed: results.total_processed,
        successful: results.successful,
        failed: results.failed
      }
    )

    return results
  } catch (error) {
    console.error('Error importing users from file:', error)
    return {
      success: false,
      total_processed: 0,
      successful: 0,
      failed: 0,
      errors: [{ row: 0, error: error instanceof Error ? error.message : 'Unknown error' }]
    }
  }
}

// Export users to Excel file
export const exportUsersToExcel = async (
  filters?: {
    role?: string
    cafeteria_id?: string
    is_active?: boolean
    created_after?: string
  }
): Promise<{ success: boolean; blob?: Blob; error?: string }> => {
  try {
    // Build query
    let query = supabase
      .from('profiles')
      .select(`
        *,
        cafeterias(name)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.role) {
      query = query.eq('role', filters.role)
    }
    if (filters?.cafeteria_id) {
      query = query.eq('cafeteria_id', filters.cafeteria_id)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    if (filters?.created_after) {
      query = query.gte('created_at', filters.created_after)
    }

    const { data: users, error } = await query

    if (error) throw error

    // Prepare data for Excel
    const excelData = users?.map(user => ({
      'Email': user.email,
      'Full Name': user.full_name,
      'Role': user.role,
      'Phone': user.phone || '',
      'Student ID': user.student_id || '',
      'Cafeteria': user.cafeterias?.name || '',
      'Active': user.is_active ? 'Yes' : 'No',
      'Created At': new Date(user.created_at).toLocaleDateString(),
      'Last Login': user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'
    })) || []

    // Create workbook
    const workbook = XLSX.utils.book_new()
    
    // Users sheet
    const usersSheet = XLSX.utils.json_to_sheet(excelData)
    
    // Set column widths
    usersSheet['!cols'] = [
      { width: 25 }, // Email
      { width: 20 }, // Full Name
      { width: 15 }, // Role
      { width: 15 }, // Phone
      { width: 15 }, // Student ID
      { width: 20 }, // Cafeteria
      { width: 10 }, // Active
      { width: 15 }, // Created At
      { width: 15 }  // Last Login
    ]

    XLSX.utils.book_append_sheet(workbook, usersSheet, 'Users')

    // Summary sheet
    const summary = generateUserSummary(users || [])
    const summarySheet = XLSX.utils.json_to_sheet(summary)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

    // Template sheet for imports
    const templateData = [
      {
        'email': 'student@students.eui.edu.eg',
        'full_name': 'John Doe',
        'role': 'student',
        'phone': '+201234567890',
        'student_id': 'STU001',
        'cafeteria_id': '',
        'is_active': 'true'
      }
    ]
    const templateSheet = XLSX.utils.json_to_sheet(templateData)
    XLSX.utils.book_append_sheet(workbook, templateSheet, 'Import Template')

    // Generate blob
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })

    return { success: true, blob }
  } catch (error) {
    console.error('Error exporting users to Excel:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Bulk update users
export const bulkUpdateUsers = async (
  userIds: string[],
  updates: Partial<BulkUserData>,
  adminUserId: string
): Promise<BulkOperationResult> => {
  try {
    const results: BulkOperationResult = {
      success: true,
      total_processed: userIds.length,
      successful: 0,
      failed: 0,
      errors: [],
      updated_users: []
    }

    // Process in batches
    const batchSize = 20
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize)
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .in('id', batch)
          .select('id, email')

        if (error) throw error

        results.successful += data?.length || 0
        results.updated_users?.push(...(data?.map(u => u.id) || []))
      } catch (error) {
        results.failed += batch.length
        results.errors.push({
          row: i,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: batch
        })
      }
    }

    // Log the bulk operation
    await logUserActivity(
      adminUserId,
      'bulk_user_update',
      'user_management',
      null,
      {
        total_processed: results.total_processed,
        successful: results.successful,
        failed: results.failed,
        updates
      }
    )

    return results
  } catch (error) {
    console.error('Error in bulk update users:', error)
    return {
      success: false,
      total_processed: userIds.length,
      successful: 0,
      failed: userIds.length,
      errors: [{ row: 0, error: error instanceof Error ? error.message : 'Unknown error' }]
    }
  }
}

// Bulk delete users
export const bulkDeleteUsers = async (
  userIds: string[],
  adminUserId: string
): Promise<BulkOperationResult> => {
  try {
    const results: BulkOperationResult = {
      success: true,
      total_processed: userIds.length,
      successful: 0,
      failed: 0,
      errors: [],
      deleted_users: []
    }

    // Get user details before deletion for logging
    const { data: usersToDelete } = await supabase
      .from('profiles')
      .select('id, email, role')
      .in('id', userIds)

    // Process in batches
    const batchSize = 20
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize)
      
      try {
        // Soft delete by setting is_active to false
        const { data, error } = await supabase
          .from('profiles')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .in('id', batch)
          .select('id')

        if (error) throw error

        results.successful += data?.length || 0
        results.deleted_users?.push(...(data?.map(u => u.id) || []))
      } catch (error) {
        results.failed += batch.length
        results.errors.push({
          row: i,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: batch
        })
      }
    }

    // Log the bulk operation
    await logUserActivity(
      adminUserId,
      'bulk_user_delete',
      'user_management',
      null,
      {
        total_processed: results.total_processed,
        successful: results.successful,
        failed: results.failed,
        deleted_users: usersToDelete?.map(u => ({ id: u.id, email: u.email, role: u.role }))
      }
    )

    return results
  } catch (error) {
    console.error('Error in bulk delete users:', error)
    return {
      success: false,
      total_processed: userIds.length,
      successful: 0,
      failed: userIds.length,
      errors: [{ row: 0, error: error instanceof Error ? error.message : 'Unknown error' }]
    }
  }
}

// Parse user file (Excel/CSV)
const parseUserFile = async (file: File): Promise<ImportValidationResult> => {
  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    if (jsonData.length < 2) {
      return {
        valid: false,
        errors: [{ row: 0, error: 'File must contain at least a header row and one data row' }],
        data: [],
        total_rows: 0
      }
    }

    const headers = jsonData[0] as string[]
    const dataRows = jsonData.slice(1) as any[][]

    // Validate headers
    const requiredHeaders = ['email', 'full_name', 'role']
    const missingHeaders = requiredHeaders.filter(h => 
      !headers.some(header => header.toLowerCase().includes(h))
    )

    if (missingHeaders.length > 0) {
      return {
        valid: false,
        errors: [{ row: 0, error: `Missing required headers: ${missingHeaders.join(', ')}` }],
        data: [],
        total_rows: dataRows.length
      }
    }

    // Map headers to indices
    const headerMap = {
      email: findHeaderIndex(headers, 'email'),
      full_name: findHeaderIndex(headers, 'full_name') || findHeaderIndex(headers, 'name'),
      role: findHeaderIndex(headers, 'role'),
      phone: findHeaderIndex(headers, 'phone'),
      student_id: findHeaderIndex(headers, 'student_id') || findHeaderIndex(headers, 'student'),
      cafeteria_id: findHeaderIndex(headers, 'cafeteria_id') || findHeaderIndex(headers, 'cafeteria'),
      is_active: findHeaderIndex(headers, 'is_active') || findHeaderIndex(headers, 'active')
    }

    // Parse and validate data
    const users: BulkUserData[] = []
    const errors: BulkOperationError[] = []

    dataRows.forEach((row, index) => {
      const rowNumber = index + 2 // +2 because we start from row 2 (after header)
      
      try {
        const user: BulkUserData = {
          email: row[headerMap.email]?.toString().trim(),
          full_name: row[headerMap.full_name]?.toString().trim(),
          role: row[headerMap.role]?.toString().toLowerCase().trim() as any
        }

        // Optional fields
        if (headerMap.phone !== -1 && row[headerMap.phone]) {
          user.phone = row[headerMap.phone].toString().trim()
        }
        if (headerMap.student_id !== -1 && row[headerMap.student_id]) {
          user.student_id = row[headerMap.student_id].toString().trim()
        }
        if (headerMap.cafeteria_id !== -1 && row[headerMap.cafeteria_id]) {
          user.cafeteria_id = row[headerMap.cafeteria_id].toString().trim()
        }
        if (headerMap.is_active !== -1 && row[headerMap.is_active]) {
          const activeValue = row[headerMap.is_active].toString().toLowerCase()
          user.is_active = activeValue === 'true' || activeValue === 'yes' || activeValue === '1'
        }

        // Validate user data
        const validation = validateUserData(user, rowNumber)
        if (validation.valid) {
          users.push(user)
        } else {
          errors.push(...validation.errors)
        }
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: `Error parsing row: ${error instanceof Error ? error.message : 'Unknown error'}`,
          data: row
        })
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      data: users,
      total_rows: dataRows.length
    }
  } catch (error) {
    console.error('Error parsing user file:', error)
    return {
      valid: false,
      errors: [{ row: 0, error: error instanceof Error ? error.message : 'Unknown error' }],
      data: [],
      total_rows: 0
    }
  }
}

// Process batch import
const processBatchImport = async (
  users: BulkUserData[],
  startIndex: number
): Promise<BulkOperationResult> => {
  const results: BulkOperationResult = {
    success: true,
    total_processed: users.length,
    successful: 0,
    failed: 0,
    errors: [],
    created_users: []
  }

  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    const rowNumber = startIndex + i + 2

    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user.email)
        .single()

      if (existingUser) {
        results.failed++
        results.errors.push({
          row: rowNumber,
          email: user.email,
          error: 'User with this email already exists'
        })
        continue
      }

      // Create user in auth.users first (simplified - in production you'd use proper auth)
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: generateTemporaryPassword(),
        email_confirm: true
      })

      if (authError) throw authError

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authUser.user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          phone: user.phone,
          student_id: user.student_id,
          cafeteria_id: user.cafeteria_id,
          is_active: user.is_active !== false
        }])

      if (profileError) throw profileError

      results.successful++
      results.created_users?.push(authUser.user.id)
    } catch (error) {
      results.failed++
      results.errors.push({
        row: rowNumber,
        email: user.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return results
}

// Helper functions
const findHeaderIndex = (headers: string[], searchTerm: string): number => {
  return headers.findIndex(header => 
    header.toLowerCase().includes(searchTerm.toLowerCase())
  )
}

const validateUserData = (user: BulkUserData, rowNumber: number): { valid: boolean; errors: BulkOperationError[] } => {
  const errors: BulkOperationError[] = []

  if (!user.email || !isValidEmail(user.email)) {
    errors.push({ row: rowNumber, email: user.email, error: 'Invalid email address' })
  }

  if (!user.full_name || user.full_name.length < 2) {
    errors.push({ row: rowNumber, email: user.email, error: 'Full name must be at least 2 characters' })
  }

  if (!['admin', 'cafeteria_manager', 'student'].includes(user.role)) {
    errors.push({ row: rowNumber, email: user.email, error: 'Role must be admin, cafeteria_manager, or student' })
  }

  return { valid: errors.length === 0, errors }
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const generateTemporaryPassword = (): string => {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
}

const generateUserSummary = (users: any[]) => {
  const summary = {
    'Total Users': users.length,
    'Active Users': users.filter(u => u.is_active).length,
    'Inactive Users': users.filter(u => !u.is_active).length,
    'Students': users.filter(u => u.role === 'student').length,
    'Cafeteria Managers': users.filter(u => u.role === 'cafeteria_manager').length,
    'Admins': users.filter(u => u.role === 'admin').length,
    'Users with Phone': users.filter(u => u.phone).length,
    'Users without Phone': users.filter(u => !u.phone).length
  }

  return Object.entries(summary).map(([key, value]) => ({ Metric: key, Value: value }))
}
