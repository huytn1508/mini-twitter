-- Migration: Hashtag System
-- Chạy trong SQL Editor của Supabase

CREATE TABLE IF NOT EXISTS public.hashtags (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hashtags_name ON public.hashtags(name);

CREATE TABLE IF NOT EXISTS public.post_hashtags (
    id         BIGSERIAL PRIMARY KEY,
    post_id    BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    hashtag_id BIGINT NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
    UNIQUE(post_id, hashtag_id)
);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag ON public.post_hashtags(hashtag_id);

ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hashtags viewable by everyone" ON public.hashtags FOR SELECT USING (true);

ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Post hashtags viewable by everyone" ON public.post_hashtags FOR SELECT USING (true);
CREATE POLICY "Users can insert post hashtags" ON public.post_hashtags FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.posts WHERE id = post_id)
);
