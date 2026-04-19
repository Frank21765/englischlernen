-- Chat sessions table
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Neuer Chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own chat session select" ON public.chat_sessions
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own chat session insert" ON public.chat_sessions
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own chat session update" ON public.chat_sessions
FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own chat session delete" ON public.chat_sessions
FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_chat_sessions_updated_at
BEFORE UPDATE ON public.chat_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_chat_sessions_user_updated ON public.chat_sessions(user_id, updated_at DESC);

-- Add session_id to chat_messages (nullable for backward-compat with existing rows)
ALTER TABLE public.chat_messages
  ADD COLUMN session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE;

CREATE INDEX idx_chat_messages_session ON public.chat_messages(session_id, created_at);