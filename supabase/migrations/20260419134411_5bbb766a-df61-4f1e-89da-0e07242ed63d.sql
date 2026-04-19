-- 1) Drop unused anthropic_api_key column (was readable by admins)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS anthropic_api_key;

-- 2) Replace handle_new_user: no hardcoded admin email anymore.
-- Admins must be promoted manually via user_roles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, access_status, valid_until)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    'active',
    now() + interval '14 days'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role);

  RETURN NEW;
END;
$function$;

-- 3) Lock down user_badges: remove direct INSERT, use SECURITY DEFINER awarder
DROP POLICY IF EXISTS "own badges insert" ON public.user_badges;

CREATE OR REPLACE FUNCTION public.award_badge(_badge_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  allowed_keys text[] := ARRAY[
    'first_session','streak_3','streak_7','streak_30',
    'xp_100','xp_500','xp_1000','xp_5000',
    'vocab_10','vocab_50','vocab_200','vocab_500',
    'perfect_quiz','chat_starter','cloze_master'
  ];
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  IF NOT (_badge_key = ANY(allowed_keys)) THEN RETURN false; END IF;

  INSERT INTO public.user_badges (user_id, badge_key)
  VALUES (uid, _badge_key)
  ON CONFLICT DO NOTHING;
  RETURN true;
END;
$function$;

-- Unique constraint to prevent duplicates (needed for ON CONFLICT)
CREATE UNIQUE INDEX IF NOT EXISTS user_badges_user_key_uniq
  ON public.user_badges (user_id, badge_key);