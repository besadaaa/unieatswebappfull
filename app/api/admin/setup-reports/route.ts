import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin()
    
    console.log('Setting up reports table...')

    // Try to create a test report to see if table exists
    const { error: testError } = await supabaseAdmin
      .from('reports')
      .select('id')
      .limit(1)

    if (testError && testError.code === 'PGRST106') {
      // Table doesn't exist, we need to create it manually
      console.log('Reports table does not exist. Please create it manually using the SQL script.')
      return NextResponse.json({
        error: 'Reports table does not exist',
        message: 'Please run the create-reports-table.sql script in your Supabase SQL editor',
        sql: `
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  period TEXT NOT NULL,
  format TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER DEFAULT 0,
  total_records INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for admins
CREATE POLICY "Admins can manage reports" ON reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
        `
      }, { status: 400 })
    }

    // If we get here, table exists
    console.log('Reports table already exists and is accessible')

    return NextResponse.json({
      success: true,
      message: 'Reports table is ready and accessible'
    })

  } catch (error) {
    console.error('Error setting up reports table:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
