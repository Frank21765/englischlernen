-- Profiles: Sprachrichtungs-Felder
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS source_language text NOT NULL DEFAULT 'de',
  ADD COLUMN IF NOT EXISTS target_language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS explanation_language text NOT NULL DEFAULT 'de',
  ADD COLUMN IF NOT EXISTS exercise_direction text NOT NULL DEFAULT 'mixed';

-- Wertebereich exercise_direction absichern
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_exercise_direction_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_exercise_direction_check
  CHECK (exercise_direction IN ('source_to_target','target_to_source','mixed'));

-- Vocabulary: Sprachpaar pro Vokabel
ALTER TABLE public.vocabulary
  ADD COLUMN IF NOT EXISTS source_language text NOT NULL DEFAULT 'de',
  ADD COLUMN IF NOT EXISTS target_language text NOT NULL DEFAULT 'en';

-- Learning events: tatsächlich geübte Richtung
ALTER TABLE public.learning_events
  ADD COLUMN IF NOT EXISTS source_language text,
  ADD COLUMN IF NOT EXISTS target_language text,
  ADD COLUMN IF NOT EXISTS exercise_direction text;

ALTER TABLE public.learning_events
  DROP CONSTRAINT IF EXISTS learning_events_exercise_direction_check;
ALTER TABLE public.learning_events
  ADD CONSTRAINT learning_events_exercise_direction_check
  CHECK (exercise_direction IS NULL OR exercise_direction IN ('source_to_target','target_to_source','mixed'));