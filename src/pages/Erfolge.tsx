import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  BADGES,
  BADGE_CATEGORY_LABEL,
  BADGE_CATEGORY_STYLE,
  BadgeCategory,
  BadgeDef,
  levelFromXp,
  rankName,
} from "@/lib/gamification";

interface Progress {
  streak: number;
  longestStreak: number;
  level: number;
  vocabMastered: number;
  perfectLessons: number;
  wortpuzzle: number;
  grammar: number;
  cloze: number;
}

function progressFor(b: BadgeDef, p: Progress): number {
  switch (b.key) {
    case "streak_7":
    case "streak_14":
    case "streak_30":
    case "streak_100":
    case "streak_365":
      return Math.max(p.streak, p.longestStreak);
    case "vocab_mastered_100":
    case "vocab_mastered_500":
    case "vocab_mastered_1000":
    case "vocab_mastered_2500":
      return p.vocabMastered;
    case "perfect_lesson_1":
    case "perfect_lesson_10":
    case "perfect_lesson_50":
      return p.perfectLessons;
    case "wortpuzzle_25":
      return p.wortpuzzle;
    case "grammar_25":
      return p.grammar;
    case "cloze_25":
      return p.cloze;
    case "combo_25":
    case "combo_50":
      return 0; // combos are momentary; no live counter
    case "level_5":
    case "level_10":
    case "level_15":
    case "level_20":
    case "level_25":
      return p.level;
    default:
      return 0;
  }
}

const CATEGORY_ORDER: BadgeCategory[] = ["streak", "vocab", "exercise", "level"];

export default function Erfolge() {
  const { user } = useAuth();
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longest, setLongest] = useState(0);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Progress>({
    streak: 0,
    longestStreak: 0,
    level: 1,
    vocabMastered: 0,
    perfectLessons: 0,
    wortpuzzle: 0,
    grammar: 0,
    cloze: 0,
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: profile }, { data: badges }, { count: vocabCount }, { data: sessions }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("xp,current_streak,longest_streak")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase.from("user_badges").select("badge_key").eq("user_id", user.id),
          supabase
            .from("vocabulary")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "mastered"),
          supabase
            .from("learning_sessions")
            .select("mode,total_answers,correct_answers")
            .eq("user_id", user.id),
        ]);

      const xpVal = profile?.xp ?? 0;
      const streakVal = profile?.current_streak ?? 0;
      const longestVal = profile?.longest_streak ?? 0;
      setXp(xpVal);
      setStreak(streakVal);
      setLongest(longestVal);
      setUnlocked(new Set((badges ?? []).map((b) => b.badge_key)));

      const list = sessions ?? [];
      const perfectLessons = list.filter(
        (r) => r.mode === "lesson" && r.total_answers > 0 && r.correct_answers === r.total_answers,
      ).length;
      const countMode = (m: string) => list.filter((r) => r.mode === m).length;

      setProgress({
        streak: streakVal,
        longestStreak: longestVal,
        level: levelFromXp(xpVal).level,
        vocabMastered: vocabCount ?? 0,
        perfectLessons,
        wortpuzzle: countMode("wortpuzzle"),
        grammar: countMode("grammar"),
        cloze: countMode("cloze"),
      });
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

      <div className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl">Badges</h2>
          <span className="text-sm text-muted-foreground">{unlocked.size} / {BADGES.length}</span>
        </div>

        {CATEGORY_ORDER.map((cat) => {
          const items = BADGES.filter((b) => b.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat} className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {BADGE_CATEGORY_LABEL[cat]}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map((b) => {
                  const got = unlocked.has(b.key);
                  const cur = progressFor(b, progress);
                  const pctBar = Math.min(100, Math.round((cur / b.target) * 100));
                  const style = BADGE_CATEGORY_STYLE[b.category];
                  return (
                    <Card
                      key={b.key}
                      className={`p-4 text-center space-y-2 transition-bounce hover:-translate-y-0.5 cursor-default border ${
                        got
                          ? `bg-gradient-card shadow-card ${style.border} ${style.glow}`
                          : "opacity-80 hover:opacity-100 hover:shadow-soft"
                      }`}
                    >
                      <div
                        className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                          got ? style.iconBg : "bg-muted grayscale"
                        }`}
                      >
                        {b.icon}
                      </div>
                      <div className="font-bold text-sm">{b.name}</div>
                      <div className="text-xs text-muted-foreground">{b.description}</div>
                      {!got && (
                        <div className="pt-1 space-y-1">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/70 transition-all"
                              style={{ width: `${pctBar}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {Math.min(cur, b.target)} / {b.target}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
