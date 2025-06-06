import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    
    console.log('Fixing reports table structure...')

    // First, let's check what columns exist
    const { data: existingReports, error: selectError } = await supabaseAdmin
      .from('reports')
      .select('*')
      .limit(1)

    if (selectError) {
      console.error('Error checking reports table:', selectError)
      return NextResponse.json({ 
        error: 'Cannot access reports table',
        details: selectError.message 
      }, { status: 500 })
    }

    console.log('Reports table exists, checking structure...')

    // Try to insert a test record with all required fields to see what's missing
    const testReportId = `test_${Date.now()}`
    
    const { error: testInsertError } = await supabaseAdmin
      .from('reports')
      .insert([{
        id: testReportId,
        name: 'Test Report',
        type: 'Revenue',
        period: 'Test',
        format: 'PDF',
        file_url: '/test',
        file_path: '/test/path',
        file_size: 1024,
        total_records: 10,
        status: 'completed',
        metadata: { test: true }
      }])

    if (testInsertError) {
      console.log('Test insert failed (expected):', testInsertError.message)
      
      // Parse the error to see which columns are missing
      const missingColumns = []
      if (testInsertError.message.includes('file_url')) missingColumns.push('file_url')
      if (testInsertError.message.includes('file_path')) missingColumns.push('file_path')
      if (testInsertError.message.includes('file_size')) missingColumns.push('file_size')
      if (testInsertError.message.includes('total_records')) missingColumns.push('total_records')
      if (testInsertError.message.includes('metadata')) missingColumns.push('metadata')

      return NextResponse.json({
        success: false,
        error: 'Reports table is missing required columns',
        missing_columns: missingColumns,
        current_error: testInsertError.message,
        sql_to_run: `
-- Run this SQL in your Supabase SQL Editor to fix the reports table:

ALTER TABLE reports ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS total_records INTEGER DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Update existing records to have default values
UPDATE reports SET 
  file_url = COALESCE(file_url, '/api/reports/generate?type=financial&format=excel'),
  file_path = COALESCE(file_path, ''),
  file_size = COALESCE(file_size, 0),
  total_records = COALESCE(total_records, 0),
  metadata = COALESCE(metadata, '{}')
WHERE file_url IS NULL OR file_path IS NULL OR file_size IS NULL OR total_records IS NULL OR metadata IS NULL;
        `
      }, { status: 400 })
    } else {
      // Test insert succeeded, clean up and return success
      await supabaseAdmin
        .from('reports')
        .delete()
        .eq('id', testReportId)

      console.log('Reports table structure is correct')

      return NextResponse.json({
        success: true,
        message: 'Reports table structure is correct and ready to use'
      })
    }

  } catch (error) {
    console.error('Error checking reports table:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
