-- SQL to fix the reports table structure
-- Run this in your Supabase SQL Editor

-- Add missing columns to reports table
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

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'reports' 
ORDER BY ordinal_position;
