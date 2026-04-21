import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, Navigate } from "react-router-dom";
import { Check, Heart, History, Pencil, Settings, Trophy, User, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getProfileUsername, persistProfileUsername } from "@/lib/profile";
import DonationCards from "@/components/DonationCards";
import FeedbackBox from "@/components/FeedbackBox";

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
    if (!user) {
      setUsername("");
      setDraft("");
      setEditing(false);
      return;
    }
    (async () => {
      try {
        const { savedUsername } = await getProfileUsername(user);
        const metaUsername = user.user_metadata?.display_name?.trim?.() ?? "";
        const nextUsername = savedUsername || metaUsername;
        setUsername(nextUsername);
        setDraft(nextUsername);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Benutzername konnte nicht geladen werden");
      }
    })();
  }, [user, location.pathname]);

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
    try {
      const savedUsername = await persistProfileUsername(user, next);
      setUsername(savedUsername);
      setDraft(savedUsername);
      setEditing(false);
      toast.success("Benutzername aktualisiert");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Benutzername konnte nicht gespeichert werden");
    } finally {
      setSaving(false);
    }
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
                  {username || "Noch kein Benutzername"}
                </div>
                <Button size="sm" variant="ghost" onClick={startEdit} className="shrink-0">
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{username ? "Ändern" : "Festlegen"}</span>
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

      <Card className="p-4 sm:p-5 bg-gradient-card shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 p-2">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg leading-tight">Hello! unterstützen</h2>
            <p className="text-xs text-muted-foreground">Hilf mit, Hello! am Leben zu halten 💛</p>
          </div>
        </div>
        <div className="rounded-xl bg-muted/40 p-3 sm:p-4 text-sm leading-relaxed text-muted-foreground">
          Hello! ist mein privates Hobby-Projekt — kein Startup, keine Werbung, keine Datenverkäufe.
          Mit Spenden geht es <strong className="text-foreground">nicht um Gewinn</strong>, sondern darum,
          die laufenden Kosten zu decken (Server, KI-Modelle, Domain). Jeder Euro hilft, dass Hello!
          online bleibt und weiterwächst. Danke! 💛
        </div>
        <DonationCards />
      </Card>

      <FeedbackBox />
    </div>
  );
}
