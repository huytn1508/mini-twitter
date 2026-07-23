-- Migration: GIF Support
-- Chạy trong SQL Editor của Supabase

-- Thêm cột gif_url (tách biệt với image_url/images)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS gif_url TEXT;
