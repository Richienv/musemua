-- Migration: Create streamers table
-- Description: This migration creates the streamers table to store information about livestreamers
-- Affected tables: streamers
-- Special considerations: Enables Row Level Security (RLS) with public read access and user-specific write access

-- Create the streamers table
create table public.streamers (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users not null,
  name text not null,
  platform text not null,
  category text not null,
  rating numeric(3,1) not null check (rating >= 0 and rating <= 5),
  price numeric(10,2) not null check (price >= 0),
  image_url text not null
);

-- Add a comment to describe the table's purpose
comment on table public.streamers is 'Stores information about livestreamers including their associated user, name, platform, category, rating, price, and image URL.';

-- Enable Row Level Security (RLS)
alter table public.streamers enable row level security;

-- Create RLS policies for public read access and user-specific write access

-- Policy for anonymous users to select data
create policy "Allow anonymous read access"
  on public.streamers
  for select
  to anon
  using (true);

-- Policy for authenticated users to select data
create policy "Allow authenticated read access"
  on public.streamers
  for select
  to authenticated
  using (true);

-- Policy for authenticated users to insert their own data
create policy "Allow authenticated insert access"
  on public.streamers
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy for authenticated users to update their own data
create policy "Allow authenticated update access"
  on public.streamers
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy for authenticated users to delete their own data
create policy "Allow authenticated delete access"
  on public.streamers
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Comments explaining the rationale for the security policies
comment on policy "Allow anonymous read access" on public.streamers is 'Allows public read access to streamer information for unauthenticated users.';
comment on policy "Allow authenticated read access" on public.streamers is 'Allows public read access to streamer information for authenticated users.';
comment on policy "Allow authenticated insert access" on public.streamers is 'Allows authenticated users to insert their own streamer information.';
comment on policy "Allow authenticated update access" on public.streamers is 'Allows authenticated users to update their own streamer information.';
comment on policy "Allow authenticated delete access" on public.streamers is 'Allows authenticated users to delete their own streamer information.';
