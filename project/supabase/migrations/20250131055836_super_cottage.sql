/*
  # Aggiunta tabelle per ordini e prodotti

  1. Nuove Tabelle
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `price` (numeric)
      - `image_url` (text)
      - `enabled` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `orders`
      - `id` (uuid, primary key)
      - `booking_id` (uuid, foreign key)
      - `total_amount` (numeric)
      - `paid_amount` (numeric)
      - `balance` (numeric)
      - `status` (text)
      - `payment_date` (timestamp)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `quantity` (integer)
      - `price` (numeric)
      - `discount` (numeric)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS su tutte le tabelle
    - Policies per lettura/scrittura admin
    - Policies per lettura utenti autenticati sui propri ordini
*/

-- Tabella prodotti
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_url text,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabella ordini
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  paid_amount numeric(10,2) NOT NULL DEFAULT 0,
  balance numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabella elementi ordine
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  price numeric(10,2) NOT NULL,
  discount numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Abilita RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies per prodotti
CREATE POLICY "Tutti possono vedere i prodotti attivi"
  ON products
  FOR SELECT
  USING (enabled = true);

CREATE POLICY "Solo admin può gestire i prodotti"
  ON products
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'gennaro.mazzacane@gmail.com'
    )
  );

-- Policies per ordini
CREATE POLICY "Utenti possono vedere i propri ordini"
  ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_id
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Solo admin può gestire gli ordini"
  ON orders
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'gennaro.mazzacane@gmail.com'
    )
  );

-- Policies per elementi ordine
CREATE POLICY "Utenti possono vedere i propri elementi ordine"
  ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN bookings ON orders.booking_id = bookings.id
      WHERE order_items.order_id = orders.id
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Solo admin può gestire gli elementi ordine"
  ON order_items
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'gennaro.mazzacane@gmail.com'
    )
  );

-- Trigger per aggiornamento timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Aggiunta colonna status personalizzato alla tabella bookings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'custom_status'
  ) THEN
    ALTER TABLE bookings 
    ADD COLUMN custom_status text;
  END IF;
END $$;