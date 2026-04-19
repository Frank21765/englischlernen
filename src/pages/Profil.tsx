import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, Navigate } from "react-router-dom";
import { Check, History, Pencil, Settings, Trophy, User, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const subNav = [
  { to: "/profil/erfolge", label: "Erfolge", icon: Trophy },
  { to: "/profil/statistik", label: "Statistik", icon: History },
  { to: "/profil/einstellungen", label: "Einstellungen", icon: Settings },
];

export default function Profil() {
  const location = useLocation();
  const { user } = useAuth();
  const [username, setUsername] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      setUsername(data?.display_name ?? "");
    })();
  }, [user]);

  const startEdit = () => {
    setDraft(username);
    setEditing(true);
  };

  const saveUsername = async () => {
    if (!user) return;
    const next = draft.trim();
    if (next.length < 2) {
      toast.error("Benutzername muss mindestens 2 Zeichen haben");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: next })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setUsername(next);
    setEditing(false);
    toast.success("Benutzername aktualisiert");
  };

  if (location.pathname === "/profil" || location.pathname === "/profil/") {
    return <Navigate to="/profil/erfolge" replace />;
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5 bg-gradient-card shadow-card">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="rounded-full bg-primary/10 p-3 shrink-0">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Benutzername
            </div>
            {editing ? (
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={40}
                  autoFocus
                  className="h-9 rounded-lg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveUsername();
                    if (e.key === "Escape") setEditing(false);
                  }}
                />
                <Button size="icon" variant="hero" onClick={saveUsername} disabled={saving} className="h-9 w-9 shrink-0">
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditing(false)} className="h-9 w-9 shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <div className="font-display text-xl sm:text-2xl truncate">
                  {username || "—"}
                </div>
                <Button size="sm" variant="ghost" onClick={startEdit} className="shrink-0">
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Ändern</span>
                </Button>
              </div>
            )}
            {user?.email && (
              <div className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</div>
            )}
          </div>
        </div>
      </Card>

      <nav className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {subNav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-smooth ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
