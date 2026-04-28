
-- 1. profiles erweitern
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS learning_goal text,
  ADD COLUMN IF NOT EXISTS self_assessment text,
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recommended_level text,
  ADD COLUMN IF NOT EXISTS weekly_minutes_goal integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS last_compass_update timestamptz;

-- 2. diagnostic_results
CREATE TABLE IF NOT EXISTS public.diagnostic_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  area text NOT NULL,                        -- 'vocab' | 'grammar' | 'listening'
  score integer NOT NULL,                    -- 0..100
  cefr_estimate text,                        -- 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  details jsonb,                             -- optional: per-item answers
  taken_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_results_user
  ON public.diagnostic_results(user_id, taken_at DESC);

ALTER TABLE public.diagnostic_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own diagnostic select"
  ON public.diagnostic_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "own diagnostic insert"
  ON public.diagnostic_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own diagnostic delete"
  ON public.diagnostic_results FOR DELETE
  USING (auth.uid() = user_id);

-- 3. learning_events (zentrales Logbuch)
CREATE TABLE IF NOT EXISTS public.learning_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,                  -- 'vocab_correct' | 'vocab_wrong' | 'grammar_correct' | 'grammar_wrong' | 'lesson_completed' | 'review_done' | ...
  object_type text,                          -- 'vocabulary' | 'grammar_pattern' | 'lesson' | 'micro_goal' | NULL
  object_id uuid,                            -- ID des betroffenen Lernobjekts (nullable, da später Tabellen erst kommen)
  level text,                                -- CEFR-Level zum Zeitpunkt
  topic text,                                -- aktuelles Topic
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb, -- Fehlerkategorie, Antwortzeit, Kontext etc.
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_events_user_time
  ON public.learning_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_events_user_type
  ON public.learning_events(user_id, event_type);

CREATE INDEX IF NOT EXISTS idx_learning_events_object
  ON public.learning_events(object_type, object_id);

ALTER TABLE public.learning_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own events select"
  ON public.learning_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "own events insert"
  ON public.learning_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own events delete"
  ON public.learning_events FOR DELETE
  USING (auth.uid() = user_id);
