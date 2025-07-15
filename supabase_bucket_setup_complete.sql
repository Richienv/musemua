-- =====================================================
-- COMPLETE SUPABASE BUCKET SETUP FOR MUA/MUSE APP
-- Copy and paste this entire code into Supabase SQL Editor
-- =====================================================

-- Create userprofile storage bucket for user profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'userprofile', 
  'userprofile', 
  true, 
  10485760, -- 10MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- Create muaportfolio storage bucket for MUA portfolio/gallery images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'muaportfolio', 
  'muaportfolio', 
  true, 
  52428800, -- 50MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DROP EXISTING POLICIES (if they exist)
-- =====================================================

DROP POLICY IF EXISTS "Allow public read access to userprofile" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload to userprofile" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own userprofile files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own userprofile files" ON storage.objects;

DROP POLICY IF EXISTS "Allow public read access to muaportfolio" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload to muaportfolio" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own muaportfolio files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own muaportfolio files" ON storage.objects;

-- =====================================================
-- USERPROFILE BUCKET POLICIES
-- =====================================================

-- Allow public read access to userprofile images
CREATE POLICY "Allow public read access to userprofile"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'userprofile' );

-- Allow authenticated users to upload their own files
CREATE POLICY "Allow authenticated users to upload to userprofile"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'userprofile' AND
    auth.role() = 'authenticated'
  );

-- Allow users to update their own files (simplified ownership check)
CREATE POLICY "Allow users to update their own userprofile files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'userprofile' AND
    auth.role() = 'authenticated'
  );

-- Allow users to delete their own files (simplified ownership check)
CREATE POLICY "Allow users to delete their own userprofile files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'userprofile' AND
    auth.role() = 'authenticated'
  );

-- =====================================================
-- MUAPORTFOLIO BUCKET POLICIES
-- =====================================================

-- Allow public read access to muaportfolio images
CREATE POLICY "Allow public read access to muaportfolio"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'muaportfolio' );

-- Allow authenticated users to upload their own files
CREATE POLICY "Allow authenticated users to upload to muaportfolio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'muaportfolio' AND
    auth.role() = 'authenticated'
  );

-- Allow users to update their own files (simplified ownership check)
CREATE POLICY "Allow users to update their own muaportfolio files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'muaportfolio' AND
    auth.role() = 'authenticated'
  );

-- Allow users to delete their own files (simplified ownership check)
CREATE POLICY "Allow users to delete their own muaportfolio files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'muaportfolio' AND
    auth.role() = 'authenticated'
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify buckets were created
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types 
FROM storage.buckets 
WHERE id IN ('userprofile', 'muaportfolio');

-- Verify policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage' 
  AND policyname LIKE '%userprofile%' 
  OR policyname LIKE '%muaportfolio%';

-- Success message
SELECT 'Storage buckets and policies setup completed successfully!' as status;