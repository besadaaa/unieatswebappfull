-- COMPREHENSIVE DATABASE SCHEMA FIX
-- Run this in Supabase SQL Editor to fix all missing columns and constraints

-- =============================================================================
-- 1. FIX REPORTS TABLE
-- =============================================================================
-- Add missing columns
ALTER TABLE reports ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS date_range_end TIMESTAMPTZ;

-- Fix format constraint to include EXCEL
-- First, check what formats exist in the table
-- UPDATE any invalid formats to valid ones
UPDATE reports SET format = 'PDF' WHERE format NOT IN ('PDF', 'CSV', 'EXCEL', 'JSON');

-- Drop existing constraint
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_format_check;

-- Add new constraint with all valid formats
ALTER TABLE reports ADD CONSTRAINT reports_format_check
CHECK (format IN ('PDF', 'CSV', 'EXCEL', 'JSON'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_date_range_end ON reports(date_range_end);
CREATE INDEX IF NOT EXISTS idx_reports_file_url ON reports(file_url);

-- =============================================================================
-- 2. FIX ORDER_ITEMS TABLE
-- =============================================================================
-- Add missing foreign key column
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS menu_item_id UUID;

-- Add foreign key constraint
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS fk_order_items_menu_item;
ALTER TABLE order_items ADD CONSTRAINT fk_order_items_menu_item 
FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);

-- =============================================================================
-- 3. FIX CAFETERIA_APPLICATIONS TABLE
-- =============================================================================
-- Add all missing columns for approval workflow
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS cafeteria_name VARCHAR(255);
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS owner_first_name VARCHAR(255);
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS owner_last_name VARCHAR(255);
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255);
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS location VARCHAR(500);
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS cafeteria_location VARCHAR(500);
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS cafeteria_description TEXT;
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS website VARCHAR(500);
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS temp_password VARCHAR(255);
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE cafeteria_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add status constraint
ALTER TABLE cafeteria_applications DROP CONSTRAINT IF EXISTS cafeteria_applications_status_check;
ALTER TABLE cafeteria_applications ADD CONSTRAINT cafeteria_applications_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cafeteria_applications_status ON cafeteria_applications(status);
CREATE INDEX IF NOT EXISTS idx_cafeteria_applications_email ON cafeteria_applications(contact_email);
CREATE INDEX IF NOT EXISTS idx_cafeteria_applications_email2 ON cafeteria_applications(email);
CREATE INDEX IF NOT EXISTS idx_cafeteria_applications_submitted ON cafeteria_applications(submitted_at);

-- =============================================================================
-- 4. ENSURE PROFILES TABLE IS CORRECT (NO EMAIL COLUMN NEEDED)
-- =============================================================================
-- Profiles table should NOT have email column - it's in auth.users
-- Remove email column if it exists (it shouldn't but just in case)
-- ALTER TABLE profiles DROP COLUMN IF EXISTS email;

-- Ensure profiles has correct structure
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'student';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS university VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS year VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add role constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'cafeteria_owner', 'cafeteria_manager', 'student'));

-- Add status constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('active', 'suspended', 'inactive'));

-- =============================================================================
-- 5. ENSURE CAFETERIAS TABLE HAS CORRECT STRUCTURE
-- =============================================================================
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS location VARCHAR(500);
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS website VARCHAR(500);
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add foreign key constraint
ALTER TABLE cafeterias DROP CONSTRAINT IF EXISTS fk_cafeterias_owner;
ALTER TABLE cafeterias ADD CONSTRAINT fk_cafeterias_owner 
FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- =============================================================================
-- 6. ENSURE MENU_ITEMS TABLE HAS CORRECT STRUCTURE
-- =============================================================================
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS cafeteria_id UUID;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS ingredients TEXT[];
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS allergens TEXT[];
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS nutrition_info JSONB;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS preparation_time INTEGER;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add foreign key constraint
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS fk_menu_items_cafeteria;
ALTER TABLE menu_items ADD CONSTRAINT fk_menu_items_cafeteria 
FOREIGN KEY (cafeteria_id) REFERENCES cafeterias(id) ON DELETE CASCADE;

-- =============================================================================
-- 7. ENSURE ORDERS TABLE HAS CORRECT STRUCTURE
-- =============================================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS student_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cafeteria_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_revenue DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cafeteria_revenue DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_time TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform VARCHAR(20) DEFAULT 'web';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Add constraints
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'));

-- Add foreign key constraints
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_user;
ALTER TABLE orders ADD CONSTRAINT fk_orders_user 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_student;
ALTER TABLE orders ADD CONSTRAINT fk_orders_student 
FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_cafeteria;
ALTER TABLE orders ADD CONSTRAINT fk_orders_cafeteria 
FOREIGN KEY (cafeteria_id) REFERENCES cafeterias(id) ON DELETE SET NULL;

-- =============================================================================
-- 8. CREATE MISSING TABLES IF THEY DON'T EXIST
-- =============================================================================

-- Create admin_actions table for audit trail
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES profiles(id),
    action_type VARCHAR(100) NOT NULL,
    target_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system_notifications table
CREATE TABLE IF NOT EXISTS system_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_id UUID,
    entity_type VARCHAR(100),
    action VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    performed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_cafeterias_owner_id ON cafeterias(owner_id);
CREATE INDEX IF NOT EXISTS idx_cafeterias_status ON cafeterias(status);
CREATE INDEX IF NOT EXISTS idx_menu_items_cafeteria_id ON menu_items(cafeteria_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_cafeteria_id ON orders(cafeteria_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- =============================================================================
-- SCHEMA FIX COMPLETE
-- =============================================================================
