CREATE TABLE IF NOT EXISTS public.irregular_verbs_master (
  id                             text  NOT NULL,
  lemma                          text ,
  infinitive_display             text ,
  simple_past_primary            text ,
  simple_past_variants_json      jsonb,
  past_participle_primary        text ,
  past_participle_variants_json  jsonb,
  variant_note_de                text ,
  english_hint                   text ,
  german_translation_primary     text ,
  german_alternatives_json       jsonb,
  meaning_note_de                text ,
  pronunciation_note_de          text ,
  example_1_en                   text ,
  example_1_de                   text ,
  example_2_en                   text ,
  example_2_de                   text ,
  example_3_en                   text ,
  example_3_de                   text ,
  cefr_level                     text ,
  beta_priority                  text ,
  frequency_band                 text ,
  learner_relevance              text ,
  common_mistakes_de             text ,
  confusing_with_json            jsonb,
  register_json                  jsonb,
  usage_tags_json                jsonb,
  review_status                  text ,
  review_reason                  text ,
  split_recommendation           text ,
  source_row_lemma               text ,
  CONSTRAINT irregular_verbs_pkey PRIMARY KEY (id)
);

ALTER TABLE public.irregular_verbs_master ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS read_irregular_verbs ON public.irregular_verbs_master;
CREATE POLICY read_irregular_verbs ON public.irregular_verbs_master FOR SELECT TO authenticated USING (true);