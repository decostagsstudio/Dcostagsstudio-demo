ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_assigned_to_fkey;

ALTER TABLE orders
  ALTER COLUMN assigned_to TYPE TEXT USING assigned_to::text;
