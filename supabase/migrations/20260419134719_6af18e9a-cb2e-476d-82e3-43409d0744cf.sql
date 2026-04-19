DO $$
DECLARE
  admin_uid uuid;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'frank@piwodda.org' LIMIT 1;
  IF admin_uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_uid, 'admin'::app_role)
    ON CONFLICT DO NOTHING;

    UPDATE public.profiles
    SET access_status = 'active', valid_until = NULL
    WHERE user_id = admin_uid;
  END IF;
END $$;