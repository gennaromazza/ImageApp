/*
  # Add User Booking Settings

  1. New Tables
    - `user_booking_settings`
      - `user_id` (uuid, primary key, references auth.users)
      - `custom_url` (text, unique)
      - `business_name` (text)
      - `logo_url` (text)
      - `theme_color` (text)
      - `enabled` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_booking_settings` table
    - Add policies for authenticated users to manage their own settings
    - Add policies for public access to read settings by custom_url
*/

-- Create user_booking_settings table
CREATE TABLE IF NOT EXISTS user_booking_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_url text UNIQUE,
  business_name text,
  logo_url text,
  theme_color text DEFAULT '#FFD700',
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_booking_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read their own settings
CREATE POLICY "Users can read own booking settings"
  ON user_booking_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own booking settings"
  ON user_booking_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can read settings by custom_url
CREATE POLICY "Public can read booking settings by custom_url"
  ON user_booking_settings
  FOR SELECT
  TO public
  USING (enabled = true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_booking_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_user_booking_settings_updated_at
  BEFORE UPDATE ON user_booking_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_booking_settings_updated_at();