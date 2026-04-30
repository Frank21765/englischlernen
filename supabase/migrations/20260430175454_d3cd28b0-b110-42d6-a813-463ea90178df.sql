UPDATE public.profiles
SET onboarding_completed = false,
    learning_goal = NULL,
    self_assessment = NULL,
    recommended_level = NULL,
    interests = '{}',
    last_compass_update = NULL
WHERE user_id = 'a3af9d00-71c1-45f7-9db1-438d9eb3a5e4';

DELETE FROM public.vocabulary WHERE user_id = 'a3af9d00-71c1-45f7-9db1-438d9eb3a5e4';
DELETE FROM public.review_items WHERE user_id = 'a3af9d00-71c1-45f7-9db1-438d9eb3a5e4';
DELETE FROM public.diagnostic_results WHERE user_id = 'a3af9d00-71c1-45f7-9db1-438d9eb3a5e4';
DELETE FROM public.learning_events WHERE user_id = 'a3af9d00-71c1-45f7-9db1-438d9eb3a5e4';
DELETE FROM public.learning_sessions WHERE user_id = 'a3af9d00-71c1-45f7-9db1-438d9eb3a5e4';