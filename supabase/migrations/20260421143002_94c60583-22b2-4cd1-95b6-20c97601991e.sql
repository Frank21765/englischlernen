CREATE OR REPLACE FUNCTION public.award_badge(_badge_key text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  allowed_keys text[] := ARRAY[
    -- Streak
    'streak_7','streak_14','streak_30','streak_100','streak_365',
    -- Vocab mastered
    'vocab_mastered_100','vocab_mastered_500','vocab_mastered_1000','vocab_mastered_2500',
    -- Perfect lessons
    'perfect_lesson_1','perfect_lesson_10','perfect_lesson_50',
    -- Exercise counters
    'wortpuzzle_25','grammar_25','cloze_25',
    -- Combos
    'combo_25','combo_50',
    -- Level milestones
    'level_5','level_10','level_15','level_20','level_25',
    -- Legacy keys (kept harmless)
    'first_session','streak_3','xp_100','xp_500','xp_1000','xp_5000',
    'vocab_10','vocab_50','vocab_200','vocab_500',
    'perfect_quiz','chat_starter','cloze_master','first_steps','combo_10','chat_first'
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