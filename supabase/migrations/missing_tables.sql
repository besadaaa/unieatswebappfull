-- Missing Critical Tables for Complete Business Functionality

-- 1. Financial Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  cafeteria_id UUID REFERENCES cafeterias(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_amount DECIMAL(10,2) NOT NULL,
  service_fee DECIMAL(10,2) NOT NULL, -- 4% capped at 20 EGP
  commission DECIMAL(10,2) NOT NULL,  -- 10% from cafeteria
  net_to_cafeteria DECIMAL(10,2) NOT NULL,
  platform_revenue DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'refunded')),
  payment_method TEXT DEFAULT 'cash_on_pickup',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Activity Logs Table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Cafeteria Settings Table
CREATE TABLE IF NOT EXISTS cafeteria_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafeteria_id UUID UNIQUE REFERENCES cafeterias(id) ON DELETE CASCADE,
  business_hours JSONB DEFAULT '{"monday":{"open":"08:00","close":"20:00","closed":false},"tuesday":{"open":"08:00","close":"20:00","closed":false},"wednesday":{"open":"08:00","close":"20:00","closed":false},"thursday":{"open":"08:00","close":"20:00","closed":false},"friday":{"open":"08:00","close":"20:00","closed":false},"saturday":{"open":"09:00","close":"18:00","closed":false},"sunday":{"open":"10:00","close":"16:00","closed":false}}',
  delivery_radius INTEGER DEFAULT 5000, -- in meters
  auto_accept_orders BOOLEAN DEFAULT false,
  notification_preferences JSONB DEFAULT '{"email":true,"sms":false,"push":true,"new_orders":true,"low_stock":true,"reviews":true}',
  payment_methods TEXT[] DEFAULT ARRAY['cash_on_pickup'],
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  service_fee_rate DECIMAL(5,2) DEFAULT 4.00,
  max_service_fee DECIMAL(10,2) DEFAULT 20.00,
  minimum_order_amount DECIMAL(10,2) DEFAULT 0.00,
  estimated_prep_time INTEGER DEFAULT 15, -- in minutes
  contact_phone TEXT,
  contact_email TEXT,
  social_media JSONB DEFAULT '{}',
  business_license TEXT,
  tax_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. System Notifications Table
CREATE TABLE IF NOT EXISTS system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('order', 'system', 'promotion', 'alert', 'reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Menu Item Ingredients Table (for inventory tracking)
CREATE TABLE IF NOT EXISTS menu_item_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_needed DECIMAL(10,3) NOT NULL, -- amount needed per menu item
  unit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(menu_item_id, inventory_item_id)
);

-- 6. System Health Metrics Table
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15,4),
  metric_unit TEXT,
  status TEXT CHECK (status IN ('healthy', 'warning', 'critical')),
  details JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Cafeteria Performance Metrics Table
CREATE TABLE IF NOT EXISTS cafeteria_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafeteria_id UUID REFERENCES cafeterias(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  average_order_value DECIMAL(10,2) DEFAULT 0,
  customer_satisfaction DECIMAL(3,2) DEFAULT 0,
  order_completion_rate DECIMAL(5,2) DEFAULT 0,
  average_prep_time INTEGER DEFAULT 0,
  peak_hour_start TIME,
  peak_hour_end TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cafeteria_id, date)
);

-- Add missing columns to existing tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'cafeteria_manager', 'student'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS business_license_url TEXT;
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE cafeterias ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS preparation_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ready_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_comment TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES auth.users(id);

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS allergens TEXT[] DEFAULT '{}';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS ingredients TEXT[] DEFAULT '{}';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS nutrition_info JSONB DEFAULT '{}';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS preparation_time INTEGER DEFAULT 15;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafeteria_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafeteria_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for new tables

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Cafeteria owners can view their transactions" ON transactions
  FOR SELECT USING (
    cafeteria_id IN (
      SELECT id FROM cafeterias WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all transactions" ON transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User activity logs policies
CREATE POLICY "Users can view their own activity logs" ON user_activity_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activity logs" ON user_activity_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Cafeteria settings policies
CREATE POLICY "Cafeteria owners can manage their settings" ON cafeteria_settings
  FOR ALL USING (
    cafeteria_id IN (
      SELECT id FROM cafeterias WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all cafeteria settings" ON cafeteria_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System notifications policies
CREATE POLICY "Users can view their own notifications" ON system_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON system_notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Menu item ingredients policies
CREATE POLICY "Cafeteria owners can manage their menu ingredients" ON menu_item_ingredients
  FOR ALL USING (
    menu_item_id IN (
      SELECT mi.id FROM menu_items mi
      JOIN cafeterias c ON mi.cafeteria_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

-- System health metrics policies (admin only)
CREATE POLICY "Admins can view system health metrics" ON system_health_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Cafeteria performance metrics policies
CREATE POLICY "Cafeteria owners can view their performance metrics" ON cafeteria_performance_metrics
  FOR SELECT USING (
    cafeteria_id IN (
      SELECT id FROM cafeterias WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all performance metrics" ON cafeteria_performance_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 8. Pricing Rules Table
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafeteria_id UUID REFERENCES cafeterias(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('time_based', 'demand_based', 'inventory_based', 'seasonal', 'bulk_discount', 'loyalty')),
  conditions JSONB DEFAULT '{}',
  action JSONB NOT NULL,
  priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 100),
  active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Holidays Table
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafeteria_id UUID REFERENCES cafeterias(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT DEFAULT 'full_day' CHECK (type IN ('full_day', 'partial')),
  hours JSONB,
  recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Special Hours Table
CREATE TABLE IF NOT EXISTS special_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafeteria_id UUID REFERENCES cafeterias(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours JSONB NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Verification Requests Table
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'student_id', 'cafeteria_license', 'identity')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  verification_data JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 12. Document Uploads Table
CREATE TABLE IF NOT EXISTS document_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_request_id UUID REFERENCES verification_requests(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('student_id_card', 'business_license', 'identity_card', 'phone_bill', 'other')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Social Media Accounts Table
CREATE TABLE IF NOT EXISTS social_media_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafeteria_id UUID REFERENCES cafeterias(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram')),
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  profile_picture_url TEXT,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_business_account BOOLEAN DEFAULT false,
  access_token TEXT, -- Encrypted
  refresh_token TEXT, -- Encrypted
  token_expires_at TIMESTAMP WITH TIME ZONE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(cafeteria_id, platform, username)
);

-- 14. Social Media Posts Table
CREATE TABLE IF NOT EXISTS social_media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafeteria_id UUID REFERENCES cafeterias(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram')),
  post_type TEXT NOT NULL CHECK (post_type IN ('image', 'video', 'story', 'reel')),
  content JSONB NOT NULL,
  scheduling JSONB DEFAULT '{"status": "draft"}',
  engagement JSONB DEFAULT '{"likes": 0, "comments": 0, "shares": 0, "views": 0}',
  platform_post_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Post Templates Table
CREATE TABLE IF NOT EXISTS post_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafeteria_id UUID REFERENCES cafeterias(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN ('menu_showcase', 'daily_special', 'behind_scenes', 'customer_review', 'promotion')),
  content_template JSONB NOT NULL,
  platforms TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_cafeteria_id ON transactions(cafeteria_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_notifications_user_id ON system_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_system_notifications_read ON system_notifications(read);
CREATE INDEX IF NOT EXISTS idx_cafeteria_performance_metrics_date ON cafeteria_performance_metrics(date);
CREATE INDEX IF NOT EXISTS idx_menu_item_ingredients_menu_item_id ON menu_item_ingredients(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_cafeteria_id ON pricing_rules(cafeteria_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(active);
CREATE INDEX IF NOT EXISTS idx_holidays_cafeteria_id ON holidays(cafeteria_id);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_cafeteria_id ON social_media_posts(cafeteria_id);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_platform ON social_media_posts(platform);
