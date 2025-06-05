-- Create inventory_alerts table
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafeteria_id UUID REFERENCES cafeterias(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'expired', 'expiring_soon')),
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on inventory_alerts table
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inventory_alerts
CREATE POLICY "Cafeteria owners can view their inventory alerts" ON inventory_alerts
  FOR SELECT USING (
    cafeteria_id IN (
      SELECT id FROM cafeterias WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Cafeteria owners can manage their inventory alerts" ON inventory_alerts
  FOR ALL USING (
    cafeteria_id IN (
      SELECT id FROM cafeterias WHERE owner_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_cafeteria_id ON inventory_alerts(cafeteria_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_inventory_item_id ON inventory_alerts(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_alert_type ON inventory_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_is_resolved ON inventory_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_created_at ON inventory_alerts(created_at);

-- Create function to automatically create alerts when inventory status changes
CREATE OR REPLACE FUNCTION create_inventory_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create alerts for low_stock and out_of_stock status changes
  IF NEW.status IN ('low_stock', 'out_of_stock') AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN
    -- Check if there's already an unresolved alert for this item and type
    IF NOT EXISTS (
      SELECT 1 FROM inventory_alerts ia
      WHERE ia.inventory_item_id = NEW.id
        AND ia.alert_type = NEW.status
        AND ia.is_resolved = false
    ) THEN
      -- Create the alert
      INSERT INTO inventory_alerts (
        cafeteria_id,
        inventory_item_id,
        alert_type,
        message,
        is_resolved
      ) VALUES (
        NEW.cafeteria_id,
        NEW.id,
        NEW.status,
        CASE
          WHEN NEW.status = 'out_of_stock' THEN
            NEW.name || ' is out of stock'
          WHEN NEW.status = 'low_stock' THEN
            NEW.name || ' is running low (' || NEW.quantity || ' ' || NEW.unit || ' remaining)'
          ELSE
            NEW.name || ' status changed to ' || NEW.status
        END,
        false
      );
    END IF;
  END IF;

  -- Resolve alerts when status improves
  IF NEW.status = 'in_stock' AND OLD.status IN ('low_stock', 'out_of_stock') THEN
    UPDATE inventory_alerts
    SET is_resolved = true, resolved_at = NOW()
    WHERE inventory_item_id = NEW.id
      AND alert_type IN ('low_stock', 'out_of_stock')
      AND is_resolved = false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create alerts when inventory status changes
CREATE TRIGGER create_inventory_alert_trigger
  AFTER UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION create_inventory_alert();
