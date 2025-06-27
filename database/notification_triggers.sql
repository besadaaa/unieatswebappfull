-- Notification triggers for automatic notification sending

-- Function to send order status notifications
CREATE OR REPLACE FUNCTION send_order_status_notification()
RETURNS TRIGGER AS $$
DECLARE
    notification_title TEXT;
    notification_message TEXT;
    notification_type TEXT;
BEGIN
    -- Only send notifications for status changes
    IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Determine notification content based on status
    CASE NEW.status
        WHEN 'pending' THEN
            notification_title := 'Order Received';
            notification_message := 'Your order #' || COALESCE(NEW.order_number, NEW.id::text) || ' has been received and is being prepared.';
            notification_type := 'order_status';
        WHEN 'preparing' THEN
            notification_title := 'Order Being Prepared';
            notification_message := 'Your order #' || COALESCE(NEW.order_number, NEW.id::text) || ' is currently being prepared.';
            notification_type := 'order_status';
        WHEN 'ready' THEN
            notification_title := 'Order Ready for Pickup';
            notification_message := 'Your order #' || COALESCE(NEW.order_number, NEW.id::text) || ' is ready for pickup!';
            notification_type := 'order_ready';
        WHEN 'completed' THEN
            notification_title := 'Order Completed';
            notification_message := 'Your order #' || COALESCE(NEW.order_number, NEW.id::text) || ' has been completed. Thank you for using UniEats!';
            notification_type := 'order_completed';
        WHEN 'cancelled' THEN
            notification_title := 'Order Cancelled';
            notification_message := 'Your order #' || COALESCE(NEW.order_number, NEW.id::text) || ' has been cancelled.';
            notification_type := 'order_status';
        ELSE
            -- Don't send notification for unknown statuses
            RETURN NEW;
    END CASE;

    -- Insert notification
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        is_read,
        related_order_id,
        created_at
    ) VALUES (
        NEW.student_id,
        notification_title,
        notification_message,
        notification_type,
        false,
        NEW.id,
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order status changes
DROP TRIGGER IF EXISTS order_status_notification_trigger ON orders;
CREATE TRIGGER order_status_notification_trigger
    AFTER INSERT OR UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION send_order_status_notification();

-- Function to send payment notifications
CREATE OR REPLACE FUNCTION send_payment_notification()
RETURNS TRIGGER AS $$
DECLARE
    notification_title TEXT;
    notification_message TEXT;
    notification_type TEXT;
BEGIN
    -- Only send notifications for payment status changes
    IF TG_OP = 'UPDATE' AND OLD.payment_status = NEW.payment_status THEN
        RETURN NEW;
    END IF;

    -- Determine notification content based on payment status
    CASE NEW.payment_status
        WHEN 'completed' THEN
            notification_title := 'Payment Successful';
            notification_message := 'Payment for order #' || COALESCE(NEW.order_number, NEW.id::text) || ' was successful.';
            notification_type := 'payment_success';
        WHEN 'failed' THEN
            notification_title := 'Payment Failed';
            notification_message := 'Payment for order #' || COALESCE(NEW.order_number, NEW.id::text) || ' failed. Please try again.';
            notification_type := 'payment_failed';
        ELSE
            -- Don't send notification for other payment statuses
            RETURN NEW;
    END CASE;

    -- Insert notification
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        is_read,
        related_order_id,
        created_at
    ) VALUES (
        NEW.student_id,
        notification_title,
        notification_message,
        notification_type,
        false,
        NEW.id,
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment status changes
DROP TRIGGER IF EXISTS payment_notification_trigger ON orders;
CREATE TRIGGER payment_notification_trigger
    AFTER INSERT OR UPDATE OF payment_status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION send_payment_notification();

-- Function to clean up old notifications (optional)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    -- Delete notifications older than 30 days
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete old push tokens that haven't been updated in 60 days
    DELETE FROM push_notification_tokens 
    WHERE updated_at < NOW() - INTERVAL '60 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old notifications (run daily)
-- Note: This requires pg_cron extension
-- SELECT cron.schedule('cleanup-notifications', '0 2 * * *', 'SELECT cleanup_old_notifications();');

-- Function to send welcome notification to new users
CREATE OR REPLACE FUNCTION send_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Send welcome notification to new users
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        is_read,
        created_at
    ) VALUES (
        NEW.id,
        'Welcome to UniEats!',
        'Welcome to UniEats! Start exploring delicious food from your university cafeterias.',
        'announcement',
        false,
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user welcome notifications
DROP TRIGGER IF EXISTS welcome_notification_trigger ON profiles;
CREATE TRIGGER welcome_notification_trigger
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION send_welcome_notification();

-- Function to send low inventory notifications to cafeteria owners
CREATE OR REPLACE FUNCTION send_low_inventory_notification()
RETURNS TRIGGER AS $$
DECLARE
    cafeteria_owner_id UUID;
BEGIN
    -- Only check when quantity is updated
    IF TG_OP = 'UPDATE' AND OLD.quantity = NEW.quantity THEN
        RETURN NEW;
    END IF;

    -- Check if inventory is low (quantity <= min_quantity)
    IF NEW.quantity <= NEW.min_quantity THEN
        -- Get cafeteria owner ID
        SELECT owner_id INTO cafeteria_owner_id
        FROM cafeterias
        WHERE id = NEW.cafeteria_id;

        -- Send notification to cafeteria owner
        IF cafeteria_owner_id IS NOT NULL THEN
            INSERT INTO notifications (
                user_id,
                title,
                message,
                type,
                is_read,
                created_at
            ) VALUES (
                cafeteria_owner_id,
                'Low Inventory Alert',
                'Item "' || NEW.name || '" is running low. Current stock: ' || NEW.quantity || ' ' || NEW.unit,
                'inventory_alert',
                false,
                NOW()
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for low inventory notifications
DROP TRIGGER IF EXISTS low_inventory_notification_trigger ON inventory_items;
CREATE TRIGGER low_inventory_notification_trigger
    AFTER UPDATE OF quantity ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION send_low_inventory_notification();

-- Enable Row Level Security on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policy: Only authenticated users can insert notifications (for system/admin use)
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- RLS Policy: Admins can view all notifications
CREATE POLICY "Admins can view all notifications" ON notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Enable Row Level Security on push_notification_tokens table
ALTER TABLE push_notification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own push tokens
CREATE POLICY "Users can manage own push tokens" ON push_notification_tokens
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policy: Admins can view all push tokens
CREATE POLICY "Admins can view all push tokens" ON push_notification_tokens
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );
