-- Add showcase_image_url field to users table for MUA showcase images
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS showcase_image_url TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN public.users.showcase_image_url IS 'URL for MUA showcase image - their most proud work displayed prominently on profile';