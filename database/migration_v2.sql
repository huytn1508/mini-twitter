-- Migration v2: Multi-image, Content Warning, Schedule, Chat
-- Chạy trong SQL Editor của Supabase

-- ========== POST ENHANCEMENTS ==========
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts(is_published, created_at DESC) WHERE is_published = true;

-- ========== CHAT ==========
CREATE TABLE IF NOT EXISTS public.conversations (
    id BIGSERIAL PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user1_id, user2_id),
    CHECK(user1_id < user2_id)
);
CREATE INDEX IF NOT EXISTS idx_conv_user1 ON public.conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conv_user2 ON public.conversations(user2_id);

CREATE TABLE IF NOT EXISTS public.messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content VARCHAR(1000) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages(conversation_id, created_at);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user1_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view messages in own conversations" ON public.messages FOR SELECT USING (
  auth.uid() IN (SELECT user1_id FROM public.conversations WHERE id = conversation_id UNION SELECT user2_id FROM public.conversations WHERE id = conversation_id)
);
CREATE POLICY "Users insert messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
