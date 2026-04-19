import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserAccess } from "@/hooks/useUserAccess";
import AccessGate from "@/components/AccessGate";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Flame, GraduationCap, History, LogOut, MessageCircle, PenLine, Settings, Shield, Sparkles, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import appIcon from "@/assets/app-icon.png";
import { supabase } from "@/integrations/supabase/client";
import { levelFromXp } from "@/lib/gamification";

const baseNav = [
  { to: "/lernen", label: "Lernen", icon: Sparkles },
  { to: "/chat", label: "Profe Hola", icon: MessageCircle },
  { to: "/karteikarten", label: "Karten", icon: Brain },
  { to: "/quiz", label: "Quiz", icon: GraduationCap },
  { to: "/lueckentext", label: "Lückentext", icon: PenLine },
  { to: "/vokabeln", label: "Vokabeln", icon: BookOpen },
  { to: "/erfolge", label: "Erfolge", icon: Trophy },
  { to: "/statistik", label: "Statistik", icon: History },
  { to: "/einstellungen", label: "Einstellungen", icon: Settings },
];

export default function AppLayout() {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useUserAccess();
  const navItems = isAdmin ? [...baseNav, { to: "/admin", label: "Admin", icon: Shield }] : baseNav;
  const navigate = useNavigate();
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("xp,current_streak")
        .eq("user_id", user.id)
        .maybeSingle();
      setXp(data?.xp ?? 0);
      setStreak(data?.current_streak ?? 0);
    };
    load();
    // alle 30s aktualisieren, falls XP/Streak sich durch Übung ändert
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-muted-foreground animate-shimmer">Lade…</div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="container max-w-6xl flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <NavLink to="/lernen" className="flex items-center gap-2 shrink-0">
              <img src={appIcon} alt="¡Hola!" className="h-9 w-9" />
              <span className="font-display text-xl">¡Hola!</span>
            </NavLink>
            <NavLink
              to="/erfolge"
              title={`Mein Level · ${streak} Tage Serie`}
              className="flex items-center gap-1 rounded-full bg-muted hover:bg-muted/70 px-2.5 py-1 text-xs font-bold transition-smooth"
            >
              <Trophy className="h-3.5 w-3.5 text-primary" />
              <span>{levelFromXp(xp).level}</span>
              {streak > 0 && (
                <>
                  <span className="text-muted-foreground/60 mx-0.5">·</span>
                  <Flame className="h-3.5 w-3.5 text-primary" />
                  <span>{streak}</span>
                </>
              )}
            </NavLink>
          </div>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/auth"); }}>
            <LogOut className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Abmelden</span>
          </Button>
        </div>
        <nav className="container max-w-6xl flex gap-1 overflow-x-auto pb-2 -mt-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-smooth ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="container max-w-6xl py-6">
        <AccessGate>
          <Outlet />
        </AccessGate>
      </main>
    </div>
  );
}
