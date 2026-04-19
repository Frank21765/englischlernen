import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { BADGES, levelFromXp, rankName } from "@/lib/gamification";

export default function Erfolge() {
  const { user } = useAuth();
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longest, setLongest] = useState(0);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: profile }, { data: badges }] = await Promise.all([
        supabase
          .from("profiles")
          .select("xp,current_streak,longest_streak")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("user_badges").select("badge_key").eq("user_id", user.id),
      ]);
      setXp(profile?.xp ?? 0);
      setStreak(profile?.current_streak ?? 0);
      setLongest(profile?.longest_streak ?? 0);
      setUnlocked(new Set((badges ?? []).map((b) => b.badge_key)));
    })();
  }, [user]);

  const lv = levelFromXp(xp);
  const pct = Math.round(lv.progress * 100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl">Erfolge & Level 🏆</h1>
        <p className="text-sm text-muted-foreground">Deine Reise vom Beginner zum Master.</p>
      </header>

      <Card className="p-5 md:p-6 bg-gradient-warm text-primary-foreground shadow-glow space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase font-bold tracking-widest opacity-80">Aktueller Rang</div>
            <div className="font-display text-3xl md:text-4xl">{rankName(lv.level)}</div>
            <div className="text-sm opacity-90">Level {lv.level}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase font-bold tracking-widest opacity-80">XP</div>
            <div className="font-display text-2xl">{xp}</div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs opacity-90">
            <span>Bis Level {lv.level + 1}</span>
            <span>{lv.current} / {lv.needed} XP</span>
          </div>
          <div className="h-2.5 bg-black/30 rounded-full overflow-hidden">
            <div className="h-full bg-primary-foreground/90 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Aktuelle Streak</div>
          <div className="font-display text-2xl mt-1">{streak} 🔥</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Längste Streak</div>
          <div className="font-display text-2xl mt-1">{longest} 🏅</div>
        </Card>
      </div>

      <div>
        <h2 className="font-display text-xl mb-3">Badges ({unlocked.size}/{BADGES.length})</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BADGES.map((b) => {
            const got = unlocked.has(b.key);
            return (
              <Card
                key={b.key}
                className={`p-4 text-center space-y-1 ${got ? "bg-gradient-card shadow-card" : "opacity-50 grayscale"}`}
              >
                <div className="text-3xl">{b.icon}</div>
                <div className="font-bold text-sm">{b.name}</div>
                <div className="text-xs text-muted-foreground">{b.description}</div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
