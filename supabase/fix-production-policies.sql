-- Fix RLS policies for production deployment
-- Run this in Supabase SQL Editor if you have RLS issues

-- Ensure service role can access all tables (for API routes)
-- These policies allow the service role to bypass RLS for admin operations

-- Profiles table
DROP POLICY IF EXISTS "Service role can access all profiles" ON profiles;
CREATE POLICY "Service role can access all profiles" ON profiles
FOR ALL USING (auth.role() = 'service_role');

-- Cafeterias table  
DROP POLICY IF EXISTS "Service role can access all cafeterias" ON cafeterias;
CREATE POLICY "Service role can access all cafeterias" ON cafeterias
FOR ALL USING (auth.role() = 'service_role');

-- Orders table
DROP POLICY IF EXISTS "Service role can access all orders" ON orders;
CREATE POLICY "Service role can access all orders" ON orders
FOR ALL USING (auth.role() = 'service_role');

-- Order items table
DROP POLICY IF EXISTS "Service role can access all order_items" ON order_items;
CREATE POLICY "Service role can access all order_items" ON order_items
FOR ALL USING (auth.role() = 'service_role');

-- Menu items table
DROP POLICY IF EXISTS "Service role can access all menu_items" ON menu_items;
CREATE POLICY "Service role can access all menu_items" ON menu_items
FOR ALL USING (auth.role() = 'service_role');

-- Inventory items table
DROP POLICY IF EXISTS "Service role can access all inventory_items" ON inventory_items;
CREATE POLICY "Service role can access all inventory_items" ON inventory_items
FOR ALL USING (auth.role() = 'service_role');

-- Student messages table
DROP POLICY IF EXISTS "Service role can access all student_messages" ON student_messages;
CREATE POLICY "Service role can access all student_messages" ON student_messages
FOR ALL USING (auth.role() = 'service_role');

-- Cafeteria settings table (if it exists)
DROP POLICY IF EXISTS "Service role can access all cafeteria_settings" ON cafeteria_settings;
CREATE POLICY "Service role can access all cafeteria_settings" ON cafeteria_settings
FOR ALL USING (auth.role() = 'service_role');

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafeterias ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_messages ENABLE ROW LEVEL SECURITY;

-- Try to enable RLS on cafeteria_settings if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cafeteria_settings') THEN
        ALTER TABLE cafeteria_settings ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Grant necessary permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Ensure authenticated users can read public data
DROP POLICY IF EXISTS "Authenticated users can read cafeterias" ON cafeterias;
CREATE POLICY "Authenticated users can read cafeterias" ON cafeterias
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can read menu_items" ON menu_items;
CREATE POLICY "Authenticated users can read menu_items" ON menu_items
FOR SELECT USING (auth.role() = 'authenticated');

-- Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Cafeteria owners can manage their cafeteria data
DROP POLICY IF EXISTS "Cafeteria owners can manage their cafeteria" ON cafeterias;
CREATE POLICY "Cafeteria owners can manage their cafeteria" ON cafeterias
FOR ALL USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Cafeteria owners can manage their menu items" ON menu_items;
CREATE POLICY "Cafeteria owners can manage their menu items" ON menu_items
FOR ALL USING (
  auth.uid() IN (
    SELECT owner_id FROM cafeterias WHERE id = menu_items.cafeteria_id
  )
);

DROP POLICY IF EXISTS "Cafeteria owners can manage their inventory" ON inventory_items;
CREATE POLICY "Cafeteria owners can manage their inventory" ON inventory_items
FOR ALL USING (
  auth.uid() IN (
    SELECT owner_id FROM cafeterias WHERE id = inventory_items.cafeteria_id
  )
);

DROP POLICY IF EXISTS "Cafeteria owners can view their orders" ON orders;
CREATE POLICY "Cafeteria owners can view their orders" ON orders
FOR SELECT USING (
  auth.uid() IN (
    SELECT owner_id FROM cafeterias WHERE id = orders.cafeteria_id
  )
);

DROP POLICY IF EXISTS "Cafeteria owners can update their orders" ON orders;
CREATE POLICY "Cafeteria owners can update their orders" ON orders
FOR UPDATE USING (
  auth.uid() IN (
    SELECT owner_id FROM cafeterias WHERE id = orders.cafeteria_id
  )
);

-- Students can view their own orders
DROP POLICY IF EXISTS "Students can view own orders" ON orders;
CREATE POLICY "Students can view own orders" ON orders
FOR SELECT USING (auth.uid() = user_id OR auth.uid() = student_id);

-- Students can create orders
DROP POLICY IF EXISTS "Students can create orders" ON orders;
CREATE POLICY "Students can create orders" ON orders
FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() = student_id);

-- Order items policies
DROP POLICY IF EXISTS "Users can view order items for their orders" ON order_items;
CREATE POLICY "Users can view order items for their orders" ON order_items
FOR SELECT USING (
  order_id IN (
    SELECT id FROM orders 
    WHERE user_id = auth.uid() 
    OR student_id = auth.uid()
    OR cafeteria_id IN (
      SELECT id FROM cafeterias WHERE owner_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can create order items for their orders" ON order_items;
CREATE POLICY "Users can create order items for their orders" ON order_items
FOR INSERT WITH CHECK (
  order_id IN (
    SELECT id FROM orders 
    WHERE user_id = auth.uid() OR student_id = auth.uid()
  )
);

-- Student messages policies
DROP POLICY IF EXISTS "Students can manage their messages" ON student_messages;
CREATE POLICY "Students can manage their messages" ON student_messages
FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all messages" ON student_messages;
CREATE POLICY "Admins can view all messages" ON student_messages
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
