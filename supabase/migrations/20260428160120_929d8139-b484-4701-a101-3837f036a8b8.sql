CREATE TABLE public.review_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  object_type text NOT NULL,
  object_id uuid NOT NULL,
  level text,
  topic text,
  correct_count integer NOT NULL DEFAULT 0,
  wrong_count integer NOT NULL DEFAULT 0,
  interval_days integer NOT NULL DEFAULT 0,
  ease_factor real NOT NULL DEFAULT 2.5,
  status text NOT NULL DEFAULT 'new',
  last_seen_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT review_items_unique_per_user UNIQUE (user_id, object_type, object_id)
);

CREATE INDEX review_items_user_due_idx
  ON public.review_items (user_id, next_review_at)
  WHERE next_review_at IS NOT NULL;

CREATE INDEX review_items_user_object_type_idx
  ON public.review_items (user_id, object_type);

ALTER TABLE public.review_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own review_items select"
  ON public.review_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "own review_items insert"
  ON public.review_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own review_items update"
  ON public.review_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "own review_items delete"
  ON public.review_items FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER review_items_updated_at
  BEFORE UPDATE ON public.review_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();