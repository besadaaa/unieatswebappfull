-- Add RLS policy to allow cafeteria staff to view order items for their cafeteria
-- This is needed so cafeteria staff can see notes/special instructions from customers

-- First, let's check if we need to add a cafeteria owner relationship
-- (This assumes cafeterias table has an owner_id field or similar)

-- Add policy for cafeteria staff to view order items for orders in their cafeteria
CREATE POLICY "Cafeteria staff can view order items for their cafeteria" 
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.cafeteria_id IN (
      SELECT id FROM cafeterias 
      WHERE owner_id = auth.uid()
      OR id = auth.jwt() ->> 'cafeteria_id'::text
    )
  )
);

-- Alternative policy if cafeterias don't have owner_id but use JWT claims
CREATE POLICY "Cafeteria staff can view order items via JWT claims" 
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.cafeteria_id = (auth.jwt() ->> 'cafeteria_id')::uuid
  )
);

-- Add policy for admins to view all order items
CREATE POLICY "Admins can view all order items"
ON order_items FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');

-- Add policy for cafeteria staff to view orders for their cafeteria
CREATE POLICY "Cafeteria staff can view orders for their cafeteria"
ON orders FOR SELECT
USING (
  cafeteria_id IN (
    SELECT id FROM cafeterias 
    WHERE owner_id = auth.uid()
    OR id = auth.jwt() ->> 'cafeteria_id'::text
  )
  OR auth.jwt() ->> 'role' = 'admin'
  OR cafeteria_id = (auth.jwt() ->> 'cafeteria_id')::uuid
);

-- Add policy for cafeteria staff to update order status
CREATE POLICY "Cafeteria staff can update orders for their cafeteria"
ON orders FOR UPDATE
USING (
  cafeteria_id IN (
    SELECT id FROM cafeterias 
    WHERE owner_id = auth.uid()
    OR id = auth.jwt() ->> 'cafeteria_id'::text
  )
  OR auth.jwt() ->> 'role' = 'admin'
  OR cafeteria_id = (auth.jwt() ->> 'cafeteria_id')::uuid
);
