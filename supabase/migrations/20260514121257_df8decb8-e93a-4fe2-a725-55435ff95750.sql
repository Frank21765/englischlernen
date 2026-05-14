CREATE TABLE IF NOT EXISTS public.idiom_topics (
  id          text    NOT NULL,
  label_en    text    NOT NULL,
  label_de    text    NOT NULL,
  sort_order  integer DEFAULT 0,
  CONSTRAINT idiom_topics_pkey PRIMARY KEY (id)
);

ALTER TABLE public.idiom_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS read_idiom_topics ON public.idiom_topics;
CREATE POLICY read_idiom_topics ON public.idiom_topics FOR SELECT TO public USING (true);