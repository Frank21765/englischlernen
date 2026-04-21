
-- Default für neue Profile auf 'pending' ändern
ALTER TABLE public.profiles ALTER COLUMN access_status SET DEFAULT 'pending';

-- handle_new_user() so anpassen, dass neue Nutzer 'pending' und kein valid_until bekommen
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
    'pending',
    NULL
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role);

  RETURN NEW;
END;
$function$;

-- Feedback-Tabelle
CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own feedback insert"
  ON public.feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own feedback select"
  ON public.feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "admins see all feedback"
  ON public.feedback FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins delete feedback"
  ON public.feedback FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
