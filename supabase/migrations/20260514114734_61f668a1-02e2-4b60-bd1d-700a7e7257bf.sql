-- Pilot import: core_vocab_master (Schema + RLS only, Daten folgen separat)
CREATE TABLE IF NOT EXISTS public.core_vocab_master (
  id                          text PRIMARY KEY,
  lemma                       text,
  display_word                text,
  part_of_speech              text,
  cefr_level                  text,
  frequency_rank              bigint,
  frequency_band              text,
  beta_priority               text,
  learner_relevance           text,
  german_translation_primary  text,
  german_alternatives_json    jsonb,
  meaning_note_de             text,
  example_1_en                text,
  example_1_de                text,
  example_2_en                text,
  example_2_de                text,
  example_3_en                text,
  example_3_de                text,
  register_json               jsonb,
  usage_tags_json             jsonb,
  confusing_with_json         jsonb,
  source                      text,
  review_status               text,
  review_reason               text,
  source_lemma                text,
  source_pos                  text,
  cefrj_level_original        text,
  cefrj_pos_original          text
);

ALTER TABLE public.core_vocab_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "core_vocab_master readable by authenticated"
ON public.core_vocab_master
FOR SELECT
TO authenticated
USING (true);