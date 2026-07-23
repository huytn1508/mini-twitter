-- Migration: Retweet System
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS retweet_type VARCHAR(10) DEFAULT NULL CHECK (retweet_type IN ('retweet', 'quote')),
  ADD COLUMN IF NOT EXISTS retweet_post_id BIGINT REFERENCES public.posts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS retweet_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_posts_retweet ON public.posts(retweet_post_id);
