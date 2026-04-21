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

export type BadgeCategory = "streak" | "vocab" | "exercise" | "level";

export interface BadgeDef {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  /** target value for progress display */
  target: number;
}

export const BADGES: BadgeDef[] = [
  // Streak
  { key: "streak_7",   name: "Dranbleiber",     description: "7 Tage in Folge gelernt",   icon: "🔥", category: "streak", target: 7 },
  { key: "streak_14",  name: "Eisern",          description: "14 Tage in Folge gelernt",  icon: "⚡", category: "streak", target: 14 },
  { key: "streak_30",  name: "Unaufhaltsam",    description: "30 Tage in Folge gelernt",  icon: "💎", category: "streak", target: 30 },
  { key: "streak_100", name: "Legende",         description: "100 Tage in Folge gelernt", icon: "👑", category: "streak", target: 100 },
  { key: "streak_365", name: "Marathonläufer",  description: "365 Tage in Folge gelernt", icon: "🏆", category: "streak", target: 365 },

  // Vocab mastered
  { key: "vocab_mastered_100",  name: "Wortsammler",     description: "100 Vokabeln gemeistert",   icon: "📘", category: "vocab", target: 100 },
  { key: "vocab_mastered_500",  name: "Wortschatz-Profi", description: "500 Vokabeln gemeistert",  icon: "📚", category: "vocab", target: 500 },
  { key: "vocab_mastered_1000", name: "Bibliothekar",    description: "1.000 Vokabeln gemeistert", icon: "🏛️", category: "vocab", target: 1000 },
  { key: "vocab_mastered_2500", name: "Wortgenie",       description: "2.500 Vokabeln gemeistert", icon: "🧠", category: "vocab", target: 2500 },

  // Exercises
  { key: "perfect_lesson_1",  name: "Perfektionist",  description: "1 Lektion ohne Fehler",     icon: "🎯", category: "exercise", target: 1 },
  { key: "perfect_lesson_10", name: "Doppelt sauber", description: "10 Lektionen ohne Fehler",  icon: "🥈", category: "exercise", target: 10 },
  { key: "perfect_lesson_50", name: "Makellos",       description: "50 Lektionen ohne Fehler",  icon: "🥇", category: "exercise", target: 50 },
  { key: "wortpuzzle_25",     name: "Puzzlemeister",  description: "25 Wortpuzzle gelöst",      icon: "🧩", category: "exercise", target: 25 },
  { key: "grammar_25",        name: "Grammatikfuchs", description: "25 Grammatik-Übungen",      icon: "📝", category: "exercise", target: 25 },
  { key: "cloze_25",          name: "Lückenfüller",   description: "25 Lückentexte",            icon: "🔤", category: "exercise", target: 25 },
  { key: "combo_25",          name: "Combo-Held",     description: "25 richtige in Folge",      icon: "🚀", category: "exercise", target: 25 },
  { key: "combo_50",          name: "Combo-King",     description: "50 richtige in Folge",      icon: "🌪️", category: "exercise", target: 50 },

  // Level
  { key: "level_5",  name: "Student",        description: "Level 5 erreicht",  icon: "🎓", category: "level", target: 5 },
  { key: "level_10", name: "Traveller",      description: "Level 10 erreicht", icon: "✈️", category: "level", target: 10 },
  { key: "level_15", name: "Advanced",       description: "Level 15 erreicht", icon: "🌍", category: "level", target: 15 },
  { key: "level_20", name: "Fluent Speaker", description: "Level 20 erreicht", icon: "🗣️", category: "level", target: 20 },
  { key: "level_25", name: "Master",         description: "Level 25 erreicht", icon: "👑", category: "level", target: 25 },
];

export const BADGE_BY_KEY = Object.fromEntries(BADGES.map((b) => [b.key, b]));

export const BADGE_CATEGORY_LABEL: Record<BadgeCategory, string> = {
  streak: "Streak",
  vocab: "Vokabeln",
  exercise: "Übungen",
  level: "Level",
};

/** Tailwind color classes per category for unlocked badges (text + soft bg + ring). */
export const BADGE_CATEGORY_STYLE: Record<
  BadgeCategory,
  { ring: string; iconBg: string; border: string; glow: string }
> = {
  streak:   { ring: "ring-orange-500/40",  iconBg: "bg-orange-500/15",  border: "border-orange-500/40",  glow: "hover:shadow-[0_0_24px_-4px_hsl(20_95%_55%/0.6)]" },
  vocab:    { ring: "ring-sky-500/40",     iconBg: "bg-sky-500/15",     border: "border-sky-500/40",     glow: "hover:shadow-[0_0_24px_-4px_hsl(200_95%_55%/0.6)]" },
  exercise: { ring: "ring-emerald-500/40", iconBg: "bg-emerald-500/15", border: "border-emerald-500/40", glow: "hover:shadow-[0_0_24px_-4px_hsl(150_75%_45%/0.6)]" },
  level:    { ring: "ring-violet-500/40",  iconBg: "bg-violet-500/15",  border: "border-violet-500/40",  glow: "hover:shadow-[0_0_24px_-4px_hsl(265_85%_60%/0.6)]" },
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export type ActivityMode = "lesson" | "wortpuzzle" | "grammar" | "cloze" | "quiz" | "chat" | "vocab";

export interface ActivityCtx {
  mode?: ActivityMode;
  /** True when an entire lesson/quiz was completed without a single mistake. */
  perfectRun?: boolean;
  /** Highest combo reached in this activity. */
  comboReached?: number;
  /** Legacy aliases (still accepted) */
  perfectQuiz?: boolean;
  vocabCount?: number;
  firstChat?: boolean;
}

async function countMasteredVocab(userId: string): Promise<number> {
  const { count } = await supabase
    .from("vocabulary")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "mastered");
  return count ?? 0;
}

async function countPerfectLessons(userId: string): Promise<number> {
  // A "perfect lesson" = a learning_session row where mode='lesson' and total>0 and correct==total
  const { data } = await supabase
    .from("learning_sessions")
    .select("total_answers,correct_answers")
    .eq("user_id", userId)
    .eq("mode", "lesson");
  if (!data) return 0;
  return data.filter((r) => r.total_answers > 0 && r.correct_answers === r.total_answers).length;
}

async function countSessionsByMode(userId: string, mode: string): Promise<number> {
  const { count } = await supabase
    .from("learning_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("mode", mode);
  return count ?? 0;
}

export async function awardActivity(
  userId: string,
  xpDelta: number,
  ctx: ActivityCtx = {},
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

  // Streak
  if (currentStreak >= 7) candidates.push("streak_7");
  if (currentStreak >= 14) candidates.push("streak_14");
  if (currentStreak >= 30) candidates.push("streak_30");
  if (currentStreak >= 100) candidates.push("streak_100");
  if (currentStreak >= 365) candidates.push("streak_365");

  // Level
  if (newLevel >= 5) candidates.push("level_5");
  if (newLevel >= 10) candidates.push("level_10");
  if (newLevel >= 15) candidates.push("level_15");
  if (newLevel >= 20) candidates.push("level_20");
  if (newLevel >= 25) candidates.push("level_25");

  // Combo
  const combo = ctx.comboReached ?? 0;
  if (combo >= 25) candidates.push("combo_25");
  if (combo >= 50) candidates.push("combo_50");

  // Vocab mastered (live aggregate)
  const masteredCount = await countMasteredVocab(userId);
  if (masteredCount >= 100) candidates.push("vocab_mastered_100");
  if (masteredCount >= 500) candidates.push("vocab_mastered_500");
  if (masteredCount >= 1000) candidates.push("vocab_mastered_1000");
  if (masteredCount >= 2500) candidates.push("vocab_mastered_2500");

  // Mode-specific aggregates
  if (ctx.mode === "lesson" && (ctx.perfectRun || ctx.perfectQuiz)) {
    const perfect = await countPerfectLessons(userId);
    if (perfect >= 1) candidates.push("perfect_lesson_1");
    if (perfect >= 10) candidates.push("perfect_lesson_10");
    if (perfect >= 50) candidates.push("perfect_lesson_50");
  }
  if (ctx.mode === "wortpuzzle") {
    const c = await countSessionsByMode(userId, "wortpuzzle");
    if (c >= 25) candidates.push("wortpuzzle_25");
  }
  if (ctx.mode === "grammar") {
    const c = await countSessionsByMode(userId, "grammar");
    if (c >= 25) candidates.push("grammar_25");
  }
  if (ctx.mode === "cloze") {
    const c = await countSessionsByMode(userId, "cloze");
    if (c >= 25) candidates.push("cloze_25");
  }

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
