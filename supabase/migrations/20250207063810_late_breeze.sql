-- Create galleries table
CREATE TABLE IF NOT EXISTS galleries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  name text NOT NULL,
  favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view gallery photos"
  ON galleries
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin can manage gallery photos"
  ON galleries
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'gennaro.mazzacane@gmail.com'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_galleries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_galleries_updated_at
  BEFORE UPDATE ON galleries
  FOR EACH ROW
  EXECUTE FUNCTION update_galleries_updated_at();