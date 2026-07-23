-- ============================================
-- MINI TWITTER - DATABASE SCHEMA (Supabase PostgreSQL)
-- Chạy file này trong SQL Editor của Supabase
-- ============================================

-- ============================================
-- 1. Bảng PROFILES (mở rộng auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username    VARCHAR(30)  NOT NULL UNIQUE,
    display_name VARCHAR(50) NOT NULL,
    bio         VARCHAR(160) DEFAULT '',
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Tự động tạo profile khi user đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (
        NEW.id,
        LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTRING(NEW.id::text, 1, 6),
        SPLIT_PART(NEW.email, '@', 1)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger cũ nếu có
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- 2. Bảng POSTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.posts (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content     VARCHAR(280) NOT NULL,
    image_url   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);

-- Row Level Security
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone"
    ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
CREATE POLICY "Users can insert their own posts"
    ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts"
    ON public.posts FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts"
    ON public.posts FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- 3. Bảng LIKES
-- ============================================
CREATE TABLE IF NOT EXISTS public.likes (
    id        BIGSERIAL PRIMARY KEY,
    user_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id   BIGINT      NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
CREATE POLICY "Likes are viewable by everyone"
    ON public.likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own likes" ON public.likes;
CREATE POLICY "Users can insert their own likes"
    ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes;
CREATE POLICY "Users can delete their own likes"
    ON public.likes FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- 4. Bảng COMMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.comments (
    id        BIGSERIAL PRIMARY KEY,
    user_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id   BIGINT      NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    content   VARCHAR(280) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone"
    ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
CREATE POLICY "Users can insert their own comments"
    ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
CREATE POLICY "Users can update their own comments"
    ON public.comments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments"
    ON public.comments FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- 5. Bảng FOLLOWS
-- ============================================
CREATE TABLE IF NOT EXISTS public.follows (
    id           BIGSERIAL PRIMARY KEY,
    follower_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
CREATE POLICY "Follows are viewable by everyone"
    ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others"
    ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Users can unfollow"
    ON public.follows FOR DELETE USING (auth.uid() = follower_id);


-- ============================================
-- 6. STORAGE BUCKET cho ảnh
-- ============================================
-- Chạy trong SQL Editor hoặc tạo qua Supabase Dashboard:
-- Tạo bucket tên "images" (public), cho phép upload ảnh
-- Policy: ai cũng xem được, chỉ user đã login mới upload được
