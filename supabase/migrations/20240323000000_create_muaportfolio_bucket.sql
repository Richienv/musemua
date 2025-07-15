-- Create muaportfolio storage bucket for MUA portfolio/gallery images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'muaportfolio', 
  'muaportfolio', 
  true, 
  52428800, -- 50MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
);

-- Create userprofile storage bucket for user profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'userprofile', 
  'userprofile', 
  true, 
  10485760, -- 10MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
);

-- Set up security policies for muaportfolio bucket
CREATE POLICY "Allow public read access to muaportfolio"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'muaportfolio' );

CREATE POLICY "Allow authenticated users to upload to muaportfolio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'muaportfolio' AND
    (auth.role() = 'authenticated')
  );

CREATE POLICY "Allow users to update their own muaportfolio files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'muaportfolio' AND
    (auth.uid()::text = (storage.foldername(name))[1])
  );

CREATE POLICY "Allow users to delete their own muaportfolio files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'muaportfolio' AND
    (auth.uid()::text = (storage.foldername(name))[1])
  );