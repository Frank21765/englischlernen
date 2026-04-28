-- Hart-Reset für Test-User a3af9d00-71c1-45f7-9db1-438d9eb3a5e4
DELETE FROM public.vocabulary WHERE user_id = 'a3af9d00-71c1-45f7-9db1-438d9eb3a5e4';
DELETE FROM public.diagnostic_results WHERE user_id = 'a3af9d00-71c1-45f7-9db1-438d9eb3a5e4';
DELETE FROM public.learning_events WHERE user_id = 'a3af9d00-71c1-45f7-9db1-438d9eb3a5e4';
DELETE FROM public.learning_sessions WHERE user_id = 'a3af9d00-71c1-45f7-9db1-438d9eb3a5e4';

UPDATE public.profiles
SET onboarding_completed = false,
    learning_goal = NULL,
    self_assessment = NULL,
    interests = '{}'::text[],
    recommended_level = NULL,
    weekly_minutes_goal = 30,
    last_compass_update = NULL
WHERE user_id = 'a3af9d00-71c1-45f7-9db1-438d9eb3a5e4';