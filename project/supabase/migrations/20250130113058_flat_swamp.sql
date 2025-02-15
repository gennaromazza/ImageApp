/*
  # Add service type to bookings table

  1. Changes
    - Add service_type column to bookings table
    - Add default value for service_type
    - Add check constraint for valid service types

  2. Security
    - No changes to existing RLS policies needed
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'service_type'
  ) THEN
    ALTER TABLE bookings 
    ADD COLUMN service_type text NOT NULL DEFAULT 'photo'
    CHECK (service_type IN ('photo', 'video', 'both'));
  END IF;
END $$;