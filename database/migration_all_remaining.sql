-- Migration: Reply Thread + Mention + Notification
-- Chạy trong SQL Editor của Supabase

-- ========== REPLY THREAD ==========
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_comment_id BIGINT REFERENCES public.comments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_comment_id);

-- ========== MENTIONS ==========
CREATE TABLE IF NOT EXISTS public.mentions (
    id         BIGSERIAL PRIMARY KEY,
    post_id    BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
    comment_id BIGINT REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mentioned_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_mentions_user ON public.mentions(mentioned_user_id);

ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mentions viewable by everyone" ON public.mentions FOR SELECT USING (true);

-- ========== NOTIFICATIONS ==========
CREATE TABLE IF NOT EXISTS public.notifications (
    id           BIGSERIAL PRIMARY KEY,
    user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type         VARCHAR(20) NOT NULL CHECK (type IN ('like','comment','retweet','follow','mention')),
    reference_id BIGINT,
    is_read      BOOLEAN DEFAULT false,
    created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
