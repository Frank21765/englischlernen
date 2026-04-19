-- 1. Rollen-Enum + Tabelle (sicher gegen Privilege Escalation)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function (verhindert RLS-Rekursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS für user_roles
CREATE POLICY "users see own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Zugangs-Spalten in profiles
ALTER TABLE public.profiles
  ADD COLUMN access_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN valid_until TIMESTAMPTZ,
  ADD COLUMN last_login_at TIMESTAMPTZ;

-- 3. Admin-Policies für profiles (zusätzlich zu bestehenden own-policies)
CREATE POLICY "admins see all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete all profiles"
  ON public.profiles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. handle_new_user erweitern: 14 Tage Test, Admin-Erkennung
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  is_admin := (NEW.email = 'frank@piwodda.org');

  INSERT INTO public.profiles (user_id, display_name, access_status, valid_until)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    'active',
    CASE WHEN is_admin THEN NULL ELSE now() + interval '14 days' END
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_admin THEN 'admin'::app_role ELSE 'user'::app_role END);

  RETURN NEW;
END;
$$;

-- Trigger neu setzen (falls noch nicht vorhanden)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Bestehende Nutzer nachpflegen: Admin für frank@piwodda.org, falls schon registriert
DO $$
DECLARE
  admin_uid UUID;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'frank@piwodda.org' LIMIT 1;
  IF admin_uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    UPDATE public.profiles
    SET access_status = 'active', valid_until = NULL
    WHERE user_id = admin_uid;
  END IF;

  -- Alle anderen bestehenden Nutzer ohne valid_until: 30 Tage geben (großzügig, weil Bestand)
  UPDATE public.profiles
  SET valid_until = now() + interval '30 days'
  WHERE valid_until IS NULL
    AND user_id NOT IN (SELECT user_id FROM public.user_roles WHERE role = 'admin');

  -- Allen bestehenden Nutzern eine 'user'-Rolle geben, falls fehlt
  INSERT INTO public.user_roles (user_id, role)
  SELECT u.id, 'user'::app_role
  FROM auth.users u
  WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id)
  ON CONFLICT DO NOTHING;
END $$;