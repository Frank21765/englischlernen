import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserAccess } from "@/hooks/useUserAccess";
import { useLearning } from "@/hooks/useLearningContext";
import AccessGate from "@/components/AccessGate";
import { Button } from "@/components/ui/button";
import { BookOpen, Dumbbell, Flame, LogOut, MessageCircle, Shield, Sparkles, Trophy, User } from "lucide-react";
import { useEffect, useState } from "react";
import appIcon from "@/assets/app-icon.png";
import { supabase } from "@/integrations/supabase/client";
import { levelFromXp } from "@/lib/gamification";

const baseNav = [
  { to: "/lernen", label: "Lernen", icon: Sparkles, match: ["/lernen"] },
  { to: "/uben", label: "Üben", icon: Dumbbell, match: ["/uben", "/quiz", "/grammatik", "/lueckentext"] },
  { to: "/vokabeln", label: "Vokabeln", icon: BookOpen, match: ["/vokabeln"] },
  { to: "/chat?new=1", label: "Coach", icon: MessageCircle, ellie: true, match: ["/chat"] },
  { to: "/profil", label: "Profil", icon: User, match: ["/profil", "/erfolge", "/statistik", "/einstellungen"] },
];

export default function AppLayout() {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useUserAccess();
  const { level, topic, ready: ctxReady, hasSelection } = useLearning();
  const navItems = isAdmin ? [...baseNav, { to: "/admin", label: "Admin", icon: Shield, match: ["/admin"] }] : baseNav;
  const navigate = useNavigate();
  const location = useLocation();
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) { setOnboardingChecked(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!data?.onboarding_completed && location.pathname !== "/onboarding") {
        navigate("/onboarding", { replace: true });
      }
      setOnboardingChecked(true);
    })();
    return () => { cancelled = true; };
  }, [user, navigate, location.pathname]);

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
              <img src={appIcon} alt="Hello!" className="h-9 w-9" />
              <span className="font-display text-xl">Hello!</span>
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
            {ctxReady && hasSelection && (
              <NavLink
                to="/lernen"
                title="Aktuelles Niveau und Thema – tippen zum Ändern"
                className="hidden xs:flex items-center gap-1 rounded-full bg-accent/15 hover:bg-accent/25 px-2.5 py-1 text-xs font-bold text-accent-foreground/90 transition-smooth max-w-[10rem] truncate"
              >
                <Sparkles className="h-3 w-3 text-accent" />
                <span className="font-mono">{level}</span>
                <span className="text-muted-foreground/60">·</span>
                <span className="truncate">{topic}</span>
              </NavLink>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/auth"); }}>
            <LogOut className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Abmelden</span>
          </Button>
        </div>
        <nav className="container max-w-6xl flex gap-1 overflow-x-auto pb-2 -mt-1">
          {navItems.map(({ to, label, icon: Icon, match }) => {
            const path = location.pathname;
            const isActive = match.some((m) => path === m || path.startsWith(m + "/"));
            const isCoach = to.startsWith("/chat");
            return (
              <NavLink
                key={to}
                to={to}
                onClick={(e) => {
                  if (isCoach) {
                    e.preventDefault();
                    navigate(`/chat?new=1&t=${Date.now()}`);
                  }
                }}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-smooth ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            );
          })}
        </nav>
      </header>
      <main className="container max-w-6xl py-6 min-w-0 overflow-x-hidden">
        <AccessGate>
          <Outlet />
        </AccessGate>
      </main>
    </div>
  );
}
