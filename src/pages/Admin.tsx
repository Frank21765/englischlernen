import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserAccess } from "@/hooks/useUserAccess";
import { Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Lock, Unlock, Trash2, Plus, Shield } from "lucide-react";

interface UserRow {
  user_id: string;
  display_name: string | null;
  access_status: string;
  valid_until: string | null;
  last_login_at: string | null;
  xp: number;
  current_streak: number;
  created_at: string;
  is_admin?: boolean;
}

export default function Admin() {
  const { isAdmin, loading } = useUserAccess();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, access_status, valid_until, last_login_at, xp, current_streak, created_at")
      .order("created_at", { ascending: false });
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const adminIds = new Set((roles ?? []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id));
    setUsers((profiles ?? []).map((p: any) => ({ ...p, is_admin: adminIds.has(p.user_id) })));
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (loading) return <div className="text-muted-foreground">Lade…</div>;
  if (!isAdmin) return <Navigate to="/lernen" replace />;

  const extend = async (userId: string, days: number) => {
    setBusy(userId);
    const current = users.find((u) => u.user_id === userId);
    const base = current?.valid_until && new Date(current.valid_until) > new Date()
      ? new Date(current.valid_until)
      : new Date();
    base.setDate(base.getDate() + days);
    const { error } = await supabase
      .from("profiles")
      .update({ valid_until: base.toISOString(), access_status: "active" })
      .eq("user_id", userId);
    setBusy(null);
    if (error) toast.error(error.message);
    else { toast.success(`Verlängert um ${days} Tage`); load(); }
  };

  const setStatus = async (userId: string, access_status: string) => {
    setBusy(userId);
    const { error } = await supabase.from("profiles").update({ access_status }).eq("user_id", userId);
    setBusy(null);
    if (error) toast.error(error.message);
    else { toast.success(access_status === "blocked" ? "Gesperrt" : "Entsperrt"); load(); }
  };

  const remove = async (userId: string, name: string) => {
    if (!window.confirm(`${name} und alle Daten unwiderruflich löschen?`)) return;
    setBusy(userId);
    await supabase.from("vocabulary").delete().eq("user_id", userId);
    await supabase.from("learning_sessions").delete().eq("user_id", userId);
    await supabase.from("chat_messages").delete().eq("user_id", userId);
    await supabase.from("user_badges").delete().eq("user_id", userId);
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
    setBusy(null);
    if (error) toast.error(error.message);
    else { toast.success("Gelöscht"); load(); }
  };

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("de-DE") : "–";
  const fmtDateTime = (d: string | null) => d ? new Date(d).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" }) : "nie";

  const effectiveStatus = (u: UserRow) => {
    if (u.is_admin) return { label: "Admin", variant: "default" as const };
    if (u.access_status === "blocked") return { label: "Gesperrt", variant: "destructive" as const };
    if (u.valid_until && new Date(u.valid_until) < new Date()) return { label: "Abgelaufen", variant: "destructive" as const };
    return { label: "Aktiv", variant: "secondary" as const };
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="text-3xl flex items-center gap-2"><Shield className="h-7 w-7 text-primary" /> Admin</h1>
        <p className="text-muted-foreground">Nutzer verwalten · {users.length} registriert</p>
      </header>

      <div className="space-y-3">
        {users.map((u) => {
          const st = effectiveStatus(u);
          return (
            <Card key={u.user_id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{u.display_name ?? "—"}</h3>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 grid sm:grid-cols-2 gap-x-4 gap-y-0.5">
                    <span><Calendar className="inline h-3 w-3 mr-1" />Gültig bis: <strong>{fmt(u.valid_until)}</strong></span>
                    <span>Letzter Login: {fmtDateTime(u.last_login_at)}</span>
                    <span>Registriert: {fmt(u.created_at)}</span>
                    <span>XP: {u.xp} · Streak: {u.current_streak}</span>
                  </div>
                </div>
              </div>

              {!u.is_admin && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                  <Button size="sm" variant="outline" disabled={busy === u.user_id} onClick={() => extend(u.user_id, 30)}>
                    <Plus className="h-3.5 w-3.5 mr-1" />1 Monat
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy === u.user_id} onClick={() => extend(u.user_id, 90)}>
                    <Plus className="h-3.5 w-3.5 mr-1" />3 Monate
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy === u.user_id} onClick={() => extend(u.user_id, 365)}>
                    <Plus className="h-3.5 w-3.5 mr-1" />1 Jahr
                  </Button>
                  {u.access_status === "blocked" ? (
                    <Button size="sm" variant="outline" disabled={busy === u.user_id} onClick={() => setStatus(u.user_id, "active")}>
                      <Unlock className="h-3.5 w-3.5 mr-1" />Entsperren
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled={busy === u.user_id} onClick={() => setStatus(u.user_id, "blocked")}>
                      <Lock className="h-3.5 w-3.5 mr-1" />Sperren
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" disabled={busy === u.user_id} onClick={() => remove(u.user_id, u.display_name ?? "Nutzer")}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />Löschen
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
