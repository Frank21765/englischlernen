
-- Erweitere profiles um Gamification-Felder
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date date;

-- Tabelle für freigeschaltete Badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_key text NOT NULL,
  unlocked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_key)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own badges select" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own badges insert" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own badges delete" ON public.user_badges FOR DELETE USING (auth.uid() = user_id);

-- Tabelle für Chatverlauf mit Profe Hola
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created ON public.chat_messages(user_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own chat select" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own chat insert" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own chat delete" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);
