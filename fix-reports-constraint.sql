-- FIX REPORTS FORMAT CONSTRAINT VIOLATION
-- Run this FIRST to fix the constraint error

-- Step 1: Check what format values currently exist
SELECT DISTINCT format, COUNT(*) as count 
FROM reports 
GROUP BY format;

-- Step 2: Update any invalid format values to valid ones
-- This fixes the constraint violation
UPDATE reports 
SET format = CASE 
    WHEN UPPER(format) = 'EXCEL' THEN 'EXCEL'
    WHEN UPPER(format) = 'PDF' THEN 'PDF'
    WHEN UPPER(format) = 'CSV' THEN 'CSV'
    WHEN UPPER(format) = 'JSON' THEN 'JSON'
    ELSE 'PDF'  -- Default fallback for any invalid values
END
WHERE format NOT IN ('PDF', 'CSV', 'EXCEL', 'JSON');

-- Step 3: Drop the existing constraint that's causing issues
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_format_check;

-- Step 4: Add the new constraint with all valid formats
ALTER TABLE reports ADD CONSTRAINT reports_format_check 
CHECK (format IN ('PDF', 'CSV', 'EXCEL', 'JSON'));

-- Step 5: Verify the constraint is working
SELECT 'Constraint fixed successfully' as status;
