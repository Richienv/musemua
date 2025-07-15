-- Set up security policies for userprofile bucket
-- This assumes the 'userprofile' bucket already exists

-- Allow public read access to userprofile images
create policy "Allow public read access to userprofile"
  on storage.objects for select
  using ( bucket_id = 'userprofile' );

-- Allow authenticated users to upload their own files
create policy "Allow authenticated users to upload to userprofile"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'userprofile' AND
    (auth.role() = 'authenticated')
  );

-- Allow users to update their own files
create policy "Allow users to update their own userprofile files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'userprofile' AND
    (auth.uid()::text = (storage.foldername(name))[1])
  );

-- Allow users to delete their own files
create policy "Allow users to delete their own userprofile files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'userprofile' AND
    (auth.uid()::text = (storage.foldername(name))[1])
  ); 