-- 1. Globaler NGSL-Wortschatzpool
CREATE TABLE IF NOT EXISTS public.ngsl_words (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rank integer,
  english text NOT NULL,
  german text NOT NULL,
  pos text,
  cefr_level text NOT NULL DEFAULT 'A1',
  topics text[] NOT NULL DEFAULT '{}',
  example_en text,
  example_de text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ngsl_words ENABLE ROW LEVEL SECURITY;

-- Nur SELECT für authentifizierte Nutzer; kein Insert/Update/Delete vom Client.
CREATE POLICY "ngsl_words readable by authenticated"
ON public.ngsl_words
FOR SELECT
TO authenticated
USING (true);

CREATE INDEX IF NOT EXISTS idx_ngsl_words_level_rank
  ON public.ngsl_words (cefr_level, rank);
CREATE INDEX IF NOT EXISTS idx_ngsl_words_topics
  ON public.ngsl_words USING GIN (topics);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ngsl_words_english_unique
  ON public.ngsl_words (lower(english));

-- 2. vocabulary erweitern
ALTER TABLE public.vocabulary
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'ai',
  ADD COLUMN IF NOT EXISTS ngsl_id uuid REFERENCES public.ngsl_words(id) ON DELETE SET NULL;

-- Eindeutiger Schlüssel pro Nutzer für Upserts (de+en kombiniert).
-- Bestehende Duplikate werden hier nicht entfernt; wenn Konflikte auftreten,
-- läuft das CREATE UNIQUE INDEX ins Leere und liefert eine klare Fehlermeldung.
CREATE UNIQUE INDEX IF NOT EXISTS idx_vocabulary_user_pair_unique
  ON public.vocabulary (user_id, lower(german), lower(english));

CREATE INDEX IF NOT EXISTS idx_vocabulary_user_due
  ON public.vocabulary (user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_status
  ON public.vocabulary (user_id, status);
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_level_topic
  ON public.vocabulary (user_id, level, topic);