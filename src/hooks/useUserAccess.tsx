import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AccessStatus = "active" | "blocked" | "expired" | "pending" | "loading";

export interface UserAccess {
  status: AccessStatus;
  isAdmin: boolean;
  validUntil: string | null;
  loading: boolean;
}

export function useUserAccess(): UserAccess {
  const { user } = useAuth();
  const [status, setStatus] = useState<AccessStatus>("loading");
  const [isAdmin, setIsAdmin] = useState(false);
  const [validUntil, setValidUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("access_status, valid_until").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      const admin = (roles ?? []).some((r: any) => r.role === "admin");
      setIsAdmin(admin);
      setValidUntil(profile?.valid_until ?? null);

      let s: AccessStatus = "active";
      if (admin) s = "active";
      else if (profile?.access_status === "blocked") s = "blocked";
      else if (profile?.access_status === "pending") s = "pending";
      else if (profile?.valid_until && new Date(profile.valid_until) < new Date()) s = "expired";
      else s = (profile?.access_status as AccessStatus) ?? "active";

      setStatus(s);
      setLoading(false);

      // last_login_at aktualisieren (nur wenn aktiv)
      if (s === "active") {
        await supabase.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("user_id", user.id);
      }
    })();
  }, [user]);

  return { status, isAdmin, validUntil, loading };
}
