/*
  # Authentication and Authorization Schema

  1. New Tables
    - No new tables needed, using Supabase's built-in auth.users table

  2. Security
    - Add storage policies for user avatars
    - Add email templates for authentication
*/

-- Enable storage for user avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public access to avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');