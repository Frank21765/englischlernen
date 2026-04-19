ALTER TABLE public.vocabulary
  ADD COLUMN IF NOT EXISTS next_review_at timestamptz,
  ADD COLUMN IF NOT EXISTS interval_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ease_factor real NOT NULL DEFAULT 2.5;

-- Backfill: previously-seen, non-mastered items become due now
UPDATE public.vocabulary
SET next_review_at = now()
WHERE next_review_at IS NULL
  AND last_seen_at IS NOT NULL
  AND status <> 'mastered';

-- Mastered items: schedule a sensible later review (so they reappear, not vanish)
UPDATE public.vocabulary
SET next_review_at = COALESCE(last_seen_at, now()) + interval '21 days',
    interval_days = 21
WHERE status = 'mastered' AND next_review_at IS NULL;

-- Helpful index for the "due today" query
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_due
  ON public.vocabulary (user_id, next_review_at);