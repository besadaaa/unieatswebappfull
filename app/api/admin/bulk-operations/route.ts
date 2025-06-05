// Bulk User Operations API Endpoint
import { NextRequest, NextResponse } from 'next/server'
import { 
  importUsersFromFile, 
  exportUsersToExcel, 
  bulkUpdateUsers, 
  bulkDeleteUsers 
} from '@/lib/bulk-user-operations'
import { withRateLimit } from '@/lib/rate-limiting'

async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'export') {
      // Export users to Excel
      const filters = {
        role: searchParams.get('role') || undefined,
        cafeteria_id: searchParams.get('cafeteriaId') || undefined,
        is_active: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
        created_after: searchParams.get('createdAfter') || undefined
      }

      const result = await exportUsersToExcel(filters)

      if (!result.success || !result.blob) {
        return NextResponse.json(
          { error: result.error || 'Failed to export users' },
          { status: 500 }
        )
      }

      const filename = `users-export-${new Date().toISOString().split('T')[0]}.xlsx`

      return new NextResponse(result.blob, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache'
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in bulk operations GET API:', error)
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
    const adminUserId = formData.get('adminUserId') as string

    if (!adminUserId) {
      return NextResponse.json(
        { error: 'Admin user ID is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'import':
        const file = formData.get('file') as File
        if (!file) {
          return NextResponse.json(
            { error: 'File is required for import' },
            { status: 400 }
          )
        }

        const importResult = await importUsersFromFile(file, adminUserId)
        return NextResponse.json({
          success: importResult.success,
          data: importResult,
          message: importResult.success 
            ? `Import completed: ${importResult.successful} successful, ${importResult.failed} failed`
            : 'Import failed'
        })

      case 'bulk_update':
        const updateData = JSON.parse(formData.get('updateData') as string)
        const userIds = JSON.parse(formData.get('userIds') as string)

        if (!updateData || !userIds || !Array.isArray(userIds)) {
          return NextResponse.json(
            { error: 'Update data and user IDs are required' },
            { status: 400 }
          )
        }

        const updateResult = await bulkUpdateUsers(userIds, updateData, adminUserId)
        return NextResponse.json({
          success: updateResult.success,
          data: updateResult,
          message: updateResult.success 
            ? `Update completed: ${updateResult.successful} successful, ${updateResult.failed} failed`
            : 'Update failed'
        })

      case 'bulk_delete':
        const deleteUserIds = JSON.parse(formData.get('userIds') as string)

        if (!deleteUserIds || !Array.isArray(deleteUserIds)) {
          return NextResponse.json(
            { error: 'User IDs are required' },
            { status: 400 }
          )
        }

        const deleteResult = await bulkDeleteUsers(deleteUserIds, adminUserId)
        return NextResponse.json({
          success: deleteResult.success,
          data: deleteResult,
          message: deleteResult.success 
            ? `Delete completed: ${deleteResult.successful} successful, ${deleteResult.failed} failed`
            : 'Delete failed'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in bulk operations POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit('admin')(getHandler)
export const POST = withRateLimit('admin')(postHandler)
