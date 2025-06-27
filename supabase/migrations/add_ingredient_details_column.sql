-- Add ingredient_details column to menu_items table
-- This column will store detailed ingredient information with quantities

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS ingredient_details JSONB DEFAULT '[]';

-- Add comment to explain the column structure
COMMENT ON COLUMN menu_items.ingredient_details IS 'Array of ingredient details with structure: [{"inventoryItemId": "uuid", "name": "string", "quantity": number, "unit": "string"}]';

-- Create index for better performance when querying ingredient details
CREATE INDEX IF NOT EXISTS idx_menu_items_ingredient_details ON menu_items USING GIN (ingredient_details);
