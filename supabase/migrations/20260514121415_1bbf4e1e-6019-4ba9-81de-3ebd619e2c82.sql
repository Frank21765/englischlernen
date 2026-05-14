CREATE TABLE IF NOT EXISTS public.idioms_master (
  id                     text        NOT NULL,
  lemma                  text        NOT NULL,
  display_phrase         text        NOT NULL,
  type                   text        NOT NULL,
  cefr_level             text        NOT NULL,
  frequency_rank         integer    ,
  frequency_band         text       ,
  beta_priority          text       ,
  learner_relevance      text       ,
  meaning_note_de        text        NOT NULL,
  literal_meaning_de     text       ,
  grammar_pattern        text       ,
  false_friend_warning   text       ,
  example_1_en           text       ,
  example_1_de           text       ,
  example_1_de_partial   text       ,
  example_2_en           text       ,
  example_2_de           text       ,
  example_2_de_partial   text       ,
  example_3_en           text       ,
  example_3_de           text       ,
  example_3_de_partial   text       ,
  variants_json          jsonb       DEFAULT '[]'::jsonb,
  register_json          jsonb       DEFAULT '[]'::jsonb,
  usage_tags_json        jsonb       DEFAULT '[]'::jsonb,
  distractors_json       jsonb       DEFAULT '[]'::jsonb,
  confusing_with_json    jsonb       DEFAULT '[]'::jsonb,
  related_idioms_json    jsonb       DEFAULT '[]'::jsonb,
  linked_vocab           text       ,
  linked_irregular_verb  text       ,
  topic_id               text       ,
  audio_url_1            text       ,
  audio_url_2            text       ,
  audio_url_3            text       ,
  source                 text        DEFAULT 'curated'::text,
  review_status          text        DEFAULT 'clean'::text,
  review_reason          text       ,
  reviewed               boolean     DEFAULT false,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now(),
  CONSTRAINT idioms_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idioms_type_check' AND conrelid = 'public.idioms_master'::regclass) THEN
    ALTER TABLE public.idioms_master ADD CONSTRAINT idioms_type_check CHECK (type = ANY (ARRAY['idiom'::text, 'chunk'::text, 'phrasal_verb'::text]));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idioms_type_chk' AND conrelid = 'public.idioms_master'::regclass) THEN
    ALTER TABLE public.idioms_master ADD CONSTRAINT idioms_type_chk CHECK (type = ANY (ARRAY['idiom'::text, 'phrasal_verb'::text, 'chunk'::text]));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idioms_cefr_level_check' AND conrelid = 'public.idioms_master'::regclass) THEN
    ALTER TABLE public.idioms_master ADD CONSTRAINT idioms_cefr_level_check CHECK (cefr_level = ANY (ARRAY['A1'::text, 'A2'::text, 'B1'::text, 'B2'::text, 'C1'::text, 'C2'::text]));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idioms_cefr_level_chk' AND conrelid = 'public.idioms_master'::regclass) THEN
    ALTER TABLE public.idioms_master ADD CONSTRAINT idioms_cefr_level_chk CHECK (cefr_level = ANY (ARRAY['A1'::text, 'A2'::text, 'B1'::text, 'B2'::text, 'C1'::text, 'C2'::text]));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idioms_frequency_rank_check' AND conrelid = 'public.idioms_master'::regclass) THEN
    ALTER TABLE public.idioms_master ADD CONSTRAINT idioms_frequency_rank_check CHECK (frequency_rank >= 1 AND frequency_rank <= 3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idioms_frequency_band_check' AND conrelid = 'public.idioms_master'::regclass) THEN
    ALTER TABLE public.idioms_master ADD CONSTRAINT idioms_frequency_band_check CHECK (frequency_band = ANY (ARRAY['high'::text, 'mid'::text, 'low'::text]));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idioms_beta_priority_check' AND conrelid = 'public.idioms_master'::regclass) THEN
    ALTER TABLE public.idioms_master ADD CONSTRAINT idioms_beta_priority_check CHECK (beta_priority = ANY (ARRAY['core'::text, 'extended'::text, 'later'::text]));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idioms_learner_relevance_check' AND conrelid = 'public.idioms_master'::regclass) THEN
    ALTER TABLE public.idioms_master ADD CONSTRAINT idioms_learner_relevance_check CHECK (learner_relevance = ANY (ARRAY['very_high'::text, 'high'::text, 'medium'::text, 'low'::text]));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idioms_review_status_check' AND conrelid = 'public.idioms_master'::regclass) THEN
    ALTER TABLE public.idioms_master ADD CONSTRAINT idioms_review_status_check CHECK (review_status = ANY (ARRAY['clean'::text, 'needs_review'::text, 'flagged'::text]));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idioms_review_status_chk' AND conrelid = 'public.idioms_master'::regclass) THEN
    ALTER TABLE public.idioms_master ADD CONSTRAINT idioms_review_status_chk CHECK (review_status = ANY (ARRAY['clean'::text, 'needs_review'::text, 'rejected'::text, 'pending'::text]));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idioms_topic_id_fkey' AND conrelid = 'public.idioms_master'::regclass) THEN
    ALTER TABLE public.idioms_master ADD CONSTRAINT idioms_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.idiom_topics(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_idioms_cefr ON public.idioms_master USING btree (cefr_level);
CREATE INDEX IF NOT EXISTS idx_idioms_freq ON public.idioms_master USING btree (frequency_rank);
CREATE INDEX IF NOT EXISTS idx_idioms_priority ON public.idioms_master USING btree (beta_priority);
CREATE INDEX IF NOT EXISTS idx_idioms_register_gin ON public.idioms_master USING gin (register_json);
CREATE INDEX IF NOT EXISTS idx_idioms_tags_gin ON public.idioms_master USING gin (usage_tags_json);
CREATE INDEX IF NOT EXISTS idx_idioms_topic ON public.idioms_master USING btree (topic_id);
CREATE INDEX IF NOT EXISTS idx_idioms_type ON public.idioms_master USING btree (type);

ALTER TABLE public.idioms_master ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS read_idioms ON public.idioms_master;
CREATE POLICY read_idioms ON public.idioms_master FOR SELECT TO public USING (true);