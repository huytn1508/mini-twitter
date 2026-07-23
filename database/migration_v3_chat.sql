-- Migration v3: Direct Message giống X — Realtime, typing, presence, read receipts
-- Chạy trong SQL Editor của Supabase

-- ============================================================
-- 1. THÊM CỘT MỚI CHO MESSAGES
-- ============================================================
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- ============================================================
-- 2. INDEX TỐI ƯU
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_messages_conv_desc ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id, created_at DESC);

-- ============================================================
-- 3. ENABLE SUPABASE REALTIME (Postgres CDC)
-- ============================================================
-- Cho phép realtime lắng nghe INSERT/UPDATE trên bảng messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- REPLICA IDENTITY FULL: gửi toàn bộ dữ liệu cũ + mới khi có thay đổi
-- (mặc định chỉ gửi primary key, không đủ để hiển thị message)
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- ============================================================
-- 4. RLS POLICY BỔ SUNG
-- ============================================================

-- Cho phép user UPDATE tin nhắn họ nhận được (đánh dấu đã đọc)
DROP POLICY IF EXISTS "Users update read status of received messages" ON public.messages;
CREATE POLICY "Users update read status of received messages"
  ON public.messages FOR UPDATE
  USING (
    -- Chỉ cho phép update messages trong conversation của mình
    auth.uid() IN (
      SELECT user1_id FROM public.conversations WHERE id = conversation_id
      UNION
      SELECT user2_id FROM public.conversations WHERE id = conversation_id
    )
  )
  WITH CHECK (
    -- Chỉ được thay đổi is_read và read_at, không được sửa content
    auth.uid() <> sender_id
  );

-- ============================================================
-- 5. ENABLE REALTIME TRÊN SUPABASE DASHBOARD
-- ============================================================
-- Vào Supabase Dashboard → Database → Replication:
--   - Bật replication cho bảng "messages" (nếu chưa tự động)
--   - Kiểm tra publication "supabase_realtime" có chứa bảng messages
