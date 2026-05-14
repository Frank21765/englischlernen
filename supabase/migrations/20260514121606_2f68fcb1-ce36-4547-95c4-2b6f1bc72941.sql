CREATE TABLE IF NOT EXISTS public.false_friends_master (
  id                               text    NOT NULL,
  category                         text    NOT NULL,
  subcategory                      text    NOT NULL,
  german_trigger_word_or_phrase    text   ,
  wrong_english                    text    NOT NULL,
  correct_english_primary          text    NOT NULL,
  correct_english_alternatives     jsonb  ,
  literal_back_translation         text   ,
  german_meaning                   text   ,
  explanation_de                   text    NOT NULL,
  explanation_en_simple            text   ,
  why_germans_make_this_mistake    text   ,
  learner_trap_type                text   ,
  cefr_level                       text    NOT NULL,
  frequency_score                  integer NOT NULL,
  severity_score                   integer NOT NULL,
  humor_potential                  integer,
  formality_level                  text   ,
  topic_tags                       jsonb  ,
  grammar_tags                     jsonb  ,
  vocabulary_tags                  jsonb  ,
  linked_cefr_unit                 text   ,
  linked_ngsl_word                 text   ,
  linked_irregular_verb            text   ,
  linked_idiom                     text   ,
  example_wrong_en                 text   ,
  example_correct_en               text   ,
  example_de                       text   ,
  mini_dialogue_wrong              text   ,
  mini_dialogue_correct            text   ,
  cloze_prompt                     text   ,
  cloze_answer                     text   ,
  quiz_question                    text   ,
  quiz_options                     jsonb  ,
  quiz_correct_answer              text   ,
  feedback_if_wrong_de             text   ,
  feedback_if_correct_de           text   ,
  memory_hook_de                   text   ,
  audio_text_en                    text   ,
  audio_text_slow_en               text   ,
  pronunciation_note_de            text   ,
  minimal_pair_or_confusable_word  text   ,
  ipa_optional                     text   ,
  app_section                      text   ,
  lesson_priority                  integer,
  review_priority                  integer,
  srs_difficulty                   integer,
  notes_for_content_team           text   ,
  source_confidence                integer NOT NULL,
  needs_human_review               boolean NOT NULL,
  l1_interference_strength         integer,
  teacher_note_compact             text   ,
  preferred_exercise_types         jsonb  ,
  evp_sense_id                     text   ,
  CONSTRAINT oops_english_german_interference_test_pkey PRIMARY KEY (id)
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oegit_cefr_level_chk' AND conrelid = 'public.false_friends_master'::regclass) THEN
    ALTER TABLE public.false_friends_master ADD CONSTRAINT oegit_cefr_level_chk CHECK (cefr_level = ANY (ARRAY['A1'::text, 'A2'::text, 'B1'::text, 'B2'::text, 'C1'::text, 'C2'::text]));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oegit_freq_chk' AND conrelid = 'public.false_friends_master'::regclass) THEN
    ALTER TABLE public.false_friends_master ADD CONSTRAINT oegit_freq_chk CHECK (frequency_score >= 1 AND frequency_score <= 3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oegit_humor_chk' AND conrelid = 'public.false_friends_master'::regclass) THEN
    ALTER TABLE public.false_friends_master ADD CONSTRAINT oegit_humor_chk CHECK (humor_potential >= 0 AND humor_potential <= 3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oegit_id_format' AND conrelid = 'public.false_friends_master'::regclass) THEN
    ALTER TABLE public.false_friends_master ADD CONSTRAINT oegit_id_format CHECK (id ~ '^gm_[0-9]{3}$'::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oegit_l1_chk' AND conrelid = 'public.false_friends_master'::regclass) THEN
    ALTER TABLE public.false_friends_master ADD CONSTRAINT oegit_l1_chk CHECK (l1_interference_strength IS NULL OR (l1_interference_strength >= 1 AND l1_interference_strength <= 5));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oegit_lesson_chk' AND conrelid = 'public.false_friends_master'::regclass) THEN
    ALTER TABLE public.false_friends_master ADD CONSTRAINT oegit_lesson_chk CHECK (lesson_priority >= 1 AND lesson_priority <= 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oegit_review_chk' AND conrelid = 'public.false_friends_master'::regclass) THEN
    ALTER TABLE public.false_friends_master ADD CONSTRAINT oegit_review_chk CHECK (review_priority >= 1 AND review_priority <= 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oegit_sev_chk' AND conrelid = 'public.false_friends_master'::regclass) THEN
    ALTER TABLE public.false_friends_master ADD CONSTRAINT oegit_sev_chk CHECK (severity_score >= 1 AND severity_score <= 3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oegit_srcconf_chk' AND conrelid = 'public.false_friends_master'::regclass) THEN
    ALTER TABLE public.false_friends_master ADD CONSTRAINT oegit_srcconf_chk CHECK (source_confidence >= 1 AND source_confidence <= 3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oegit_srs_chk' AND conrelid = 'public.false_friends_master'::regclass) THEN
    ALTER TABLE public.false_friends_master ADD CONSTRAINT oegit_srs_chk CHECK (srs_difficulty >= 1 AND srs_difficulty <= 5);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS gin_oegit_grammar_tags ON public.false_friends_master USING gin (grammar_tags);
CREATE INDEX IF NOT EXISTS gin_oegit_preferred_exercise_types ON public.false_friends_master USING gin (preferred_exercise_types);
CREATE INDEX IF NOT EXISTS gin_oegit_topic_tags ON public.false_friends_master USING gin (topic_tags);
CREATE INDEX IF NOT EXISTS gin_oegit_vocabulary_tags ON public.false_friends_master USING gin (vocabulary_tags);
CREATE INDEX IF NOT EXISTS idx_oegit_app_section ON public.false_friends_master USING btree (app_section);
CREATE INDEX IF NOT EXISTS idx_oegit_category ON public.false_friends_master USING btree (category);
CREATE INDEX IF NOT EXISTS idx_oegit_cefr_level ON public.false_friends_master USING btree (cefr_level);
CREATE INDEX IF NOT EXISTS idx_oegit_frequency_score ON public.false_friends_master USING btree (frequency_score);
CREATE INDEX IF NOT EXISTS idx_oegit_learner_trap_type ON public.false_friends_master USING btree (learner_trap_type);
CREATE INDEX IF NOT EXISTS idx_oegit_needs_human_review ON public.false_friends_master USING btree (needs_human_review);
CREATE INDEX IF NOT EXISTS idx_oegit_review_priority ON public.false_friends_master USING btree (review_priority);
CREATE INDEX IF NOT EXISTS idx_oegit_subcategory ON public.false_friends_master USING btree (subcategory);

ALTER TABLE public.false_friends_master ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS oegit_authenticated_select ON public.false_friends_master;
CREATE POLICY oegit_authenticated_select ON public.false_friends_master FOR SELECT TO authenticated USING (true);