-- Migration: Video Support
-- Chạy trong SQL Editor của Supabase

-- Thêm cột video_url (tách biệt với image_url, images, gif_url)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS video_url TEXT;
