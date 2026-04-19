import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export const PRAISES_EN = [
  "Awesome!",
  "Brilliant!",
  "Way to go!",
  "Fantastic!",
  "You're crushing it!",
  "Keep it up!",
  "Amazing!",
  "Bravo!",
  "Let's go!",
  "Nailed it!",
];

export function randomPraise(): string {
  return PRAISES_EN[Math.floor(Math.random() * PRAISES_EN.length)];
}

export function fireConfetti(intense = false) {
  const count = intense ? 180 : 90;
  confetti({
    particleCount: count,
    spread: intense ? 110 : 75,
    origin: { y: 0.7 },
    colors: ["#f4533c", "#ff7a4a", "#ffd166", "#06d6a0", "#ef476f"],
    scalar: intense ? 1.1 : 0.9,
  });
}

// XP-Kurve: Level n braucht 50 * n * (n+1) / 2 XP gesamt (Dreieckszahl)
export function levelFromXp(xp: number): { level: number; current: number; needed: number; progress: number } {
  let level = 1;
  let needed = 50;
  let acc = 0;
  while (xp >= acc + needed) {
    acc += needed;
    level += 1;
    needed = 50 * level;
  }
  const current = xp - acc;
  return { level, current, needed, progress: needed ? current / needed : 0 };
}

export function rankName(level: number): string {
  if (level >= 25) return "Master";
  if (level >= 18) return "Fluent Speaker";
  if (level >= 12) return "Advanced";
  if (level >= 8) return "Traveller";
  if (level >= 4) return "Student";
  return "Beginner";
}

export interface BadgeDef {
  key: string;
  name: string;
  description: string;
  icon: string;
}

export const BADGES: BadgeDef[] = [
  { key: "first_steps", name: "First Steps", description: "Erste 10 Vokabeln richtig beantwortet", icon: "👶" },
  { key: "vocab_50", name: "Collector", description: "50 Vokabeln in der Sammlung", icon: "📚" },
  { key: "vocab_200", name: "Librarian", description: "200 Vokabeln in der Sammlung", icon: "🏛️" },
  { key: "streak_3", name: "Consistent", description: "3 Tage in Folge gelernt", icon: "🔥" },
  { key: "streak_7", name: "One Week", description: "7 Tage in Folge gelernt", icon: "🌟" },
  { key: "streak_30", name: "Unstoppable", description: "30 Tage in Folge gelernt", icon: "💎" },
  { key: "perfect_quiz", name: "Flawless", description: "Quiz mit 100% abgeschlossen", icon: "🎯" },
  { key: "combo_10", name: "On Fire", description: "10 richtige Antworten in Folge", icon: "⚡" },
  { key: "level_5", name: "Student", description: "Level 5 erreicht", icon: "🎓" },
  { key: "level_10", name: "Traveller", description: "Level 10 erreicht", icon: "✈️" },
  { key: "chat_first", name: "Hello, Coach!", description: "Erste Nachricht an Coach Ellie", icon: "💬" },
];

export const BADGE_BY_KEY = Object.fromEntries(BADGES.map((b) => [b.key, b]));

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function awardActivity(
  userId: string,
  xpDelta: number,
  ctx: { perfectQuiz?: boolean; comboReached?: number; vocabCount?: number; firstChat?: boolean } = {},
): Promise<{ leveledUp: boolean; newLevel: number; newBadges: BadgeDef[] }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp,current_streak,longest_streak,last_active_date")
    .eq("user_id", userId)
    .maybeSingle();

  const oldXp = profile?.xp ?? 0;
  const oldLevel = levelFromXp(oldXp).level;
  const newXp = oldXp + xpDelta;
  const newLevel = levelFromXp(newXp).level;

  const today = todayStr();
  const last = profile?.last_active_date ?? null;
  let currentStreak = profile?.current_streak ?? 0;
  let longestStreak = profile?.longest_streak ?? 0;

  if (last !== today) {
    if (last) {
      const lastDate = new Date(last);
      const diffDays = Math.round((new Date(today).getTime() - lastDate.getTime()) / 86400000);
      currentStreak = diffDays === 1 ? currentStreak + 1 : 1;
    } else {
      currentStreak = 1;
    }
    if (currentStreak > longestStreak) longestStreak = currentStreak;
  }

  await supabase
    .from("profiles")
    .update({
      xp: newXp,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_active_date: today,
    })
    .eq("user_id", userId);

  const candidates: string[] = [];
  if (newXp >= 50) candidates.push("first_steps");
  if ((ctx.vocabCount ?? 0) >= 50) candidates.push("vocab_50");
  if ((ctx.vocabCount ?? 0) >= 200) candidates.push("vocab_200");
  if (currentStreak >= 3) candidates.push("streak_3");
  if (currentStreak >= 7) candidates.push("streak_7");
  if (currentStreak >= 30) candidates.push("streak_30");
  if (ctx.perfectQuiz) candidates.push("perfect_quiz");
  if ((ctx.comboReached ?? 0) >= 10) candidates.push("combo_10");
  if (newLevel >= 5) candidates.push("level_5");
  if (newLevel >= 10) candidates.push("level_10");
  if (ctx.firstChat) candidates.push("chat_first");

  const newBadges: BadgeDef[] = [];
  if (candidates.length) {
    const { data: existing } = await supabase
      .from("user_badges")
      .select("badge_key")
      .eq("user_id", userId)
      .in("badge_key", candidates);
    const have = new Set((existing ?? []).map((r) => r.badge_key));
    const toInsert = candidates.filter((k) => !have.has(k));
    for (const k of toInsert) {
      // Server-side validated awarder (only allows known badge keys)
      const { data: awarded } = await supabase.rpc("award_badge", { _badge_key: k });
      if (awarded) {
        const def = BADGE_BY_KEY[k];
        if (def) newBadges.push(def);
      }
    }
  }

  return { leveledUp: newLevel > oldLevel, newLevel, newBadges };
}

export function celebrate(
  result: { leveledUp: boolean; newLevel: number; newBadges: BadgeDef[] },
) {
  if (result.leveledUp) {
    fireConfetti(true);
    toast.success(`Level ${result.newLevel}! ${rankName(result.newLevel)}`, {
      description: "Du bist aufgestiegen!",
    });
  }
  for (const b of result.newBadges) {
    fireConfetti();
    toast.success(`${b.icon} ${b.name}`, { description: b.description });
  }
}
