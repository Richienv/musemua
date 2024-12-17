-- Create storage buckets with proper permissions
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('streamers', 'streamers', true, 52428800, array['image/jpeg', 'image/png', 'image/webp']),
  ('brand-guidelines', 'brand-guidelines', true, 10485760, array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

-- Set up security policies for streamers bucket
create policy "Allow public read access"
  on storage.objects for select
  using ( bucket_id = 'streamers' );

create policy "Allow authenticated users to upload files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'streamers' AND
    (auth.role() = 'authenticated')
  );

create policy "Allow users to update their own files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'streamers' AND
    (auth.uid() = owner)
  );

create policy "Allow users to delete their own files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'streamers' AND
    (auth.uid() = owner)
  );

-- Set up security policies for brand-guidelines bucket
create policy "Allow public read access for brand guidelines"
  on storage.objects for select
  using ( bucket_id = 'brand-guidelines' );

create policy "Allow authenticated users to upload brand guidelines"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'brand-guidelines' AND
    (auth.role() = 'authenticated')
  ); 