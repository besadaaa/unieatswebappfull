-- Fix missing columns in production database
-- Run this in Supabase SQL Editor

-- 1. Add missing email column to profiles table (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE profiles ADD COLUMN email TEXT;
        
        -- Update email from auth.users table
        UPDATE profiles 
        SET email = auth_users.email 
        FROM auth.users AS auth_users 
        WHERE profiles.id = auth_users.id;
        
        RAISE NOTICE 'Added email column to profiles table';
    ELSE
        RAISE NOTICE 'Email column already exists in profiles table';
    END IF;
END $$;

-- 2. Add missing status column to cafeterias table (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cafeterias' AND column_name = 'status'
    ) THEN
        ALTER TABLE cafeterias ADD COLUMN status TEXT DEFAULT 'active';
        
        -- Set default status for existing cafeterias
        UPDATE cafeterias SET status = 'active' WHERE status IS NULL;
        
        RAISE NOTICE 'Added status column to cafeterias table';
    ELSE
        RAISE NOTICE 'Status column already exists in cafeterias table';
    END IF;
END $$;

-- 3. Ensure profiles table has all necessary columns
DO $$
BEGIN
    -- Add full_name if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN full_name TEXT;
        RAISE NOTICE 'Added full_name column to profiles table';
    END IF;
    
    -- Add role if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'student';
        RAISE NOTICE 'Added role column to profiles table';
    END IF;
    
    -- Add phone if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
        RAISE NOTICE 'Added phone column to profiles table';
    END IF;
    
    -- Add avatar_url if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column to profiles table';
    END IF;
    
    -- Add created_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to profiles table';
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to profiles table';
    END IF;
END $$;

-- 4. Ensure cafeterias table has all necessary columns
DO $$
BEGIN
    -- Add name if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cafeterias' AND column_name = 'name'
    ) THEN
        ALTER TABLE cafeterias ADD COLUMN name TEXT NOT NULL DEFAULT 'Unnamed Cafeteria';
        RAISE NOTICE 'Added name column to cafeterias table';
    END IF;
    
    -- Add location if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cafeterias' AND column_name = 'location'
    ) THEN
        ALTER TABLE cafeterias ADD COLUMN location TEXT;
        RAISE NOTICE 'Added location column to cafeterias table';
    END IF;
    
    -- Add owner_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cafeterias' AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE cafeterias ADD COLUMN owner_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added owner_id column to cafeterias table';
    END IF;
    
    -- Add created_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cafeterias' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE cafeterias ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to cafeterias table';
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cafeterias' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE cafeterias ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to cafeterias table';
    END IF;
END $$;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_cafeterias_status ON cafeterias(status);
CREATE INDEX IF NOT EXISTS idx_cafeterias_owner_id ON cafeterias(owner_id);

-- 6. Update RLS policies to work with new columns
-- Enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafeterias ENABLE ROW LEVEL SECURITY;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Show completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Database schema fixes completed successfully!';
    RAISE NOTICE '📊 You can now test your admin portal functions.';
END $$;
