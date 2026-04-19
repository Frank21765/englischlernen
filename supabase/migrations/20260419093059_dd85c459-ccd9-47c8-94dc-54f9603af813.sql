
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  anthropic_api_key TEXT,
  default_level TEXT DEFAULT 'A1',
  default_topic TEXT DEFAULT 'Alltag',
  direction_mode TEXT NOT NULL DEFAULT 'random' CHECK (direction_mode IN ('de_es','es_de','random')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own profile delete" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- Vocabulary
CREATE TABLE public.vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT NOT NULL,
  topic TEXT NOT NULL,
  german TEXT NOT NULL,
  spanish TEXT NOT NULL,
  grammar_note TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','learning','mastered')),
  correct_count INT NOT NULL DEFAULT 0,
  wrong_count INT NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, german, spanish)
);
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own vocab select" ON public.vocabulary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own vocab insert" ON public.vocabulary FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own vocab update" ON public.vocabulary FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own vocab delete" ON public.vocabulary FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_vocab_user_level_topic ON public.vocabulary(user_id, level, topic);

-- Sessions
CREATE TABLE public.learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('flashcards','quiz')),
  level TEXT NOT NULL,
  topic TEXT NOT NULL,
  total_answers INT NOT NULL DEFAULT 0,
  correct_answers INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own session select" ON public.learning_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own session insert" ON public.learning_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own session update" ON public.learning_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own session delete" ON public.learning_sessions FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_session_user_date ON public.learning_sessions(user_id, created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_vocab_updated BEFORE UPDATE ON public.vocabulary
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
  RETURN NEW;
END;$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
