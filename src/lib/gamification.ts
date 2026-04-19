import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export const PRAISES_ES = [
  "¡Increíble!",
  "¡Olé!",
  "¡Qué bien!",
  "¡Fantástico!",
  "¡Eres un crack!",
  "¡Sigue así!",
  "¡Fenomenal!",
  "¡Bravo!",
  "¡Vamos!",
  "¡Genial!",
];

export function randomPraise(): string {
  return PRAISES_ES[Math.floor(Math.random() * PRAISES_ES.length)];
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
  if (level >= 25) return "Maestro";
  if (level >= 18) return "Hablante";
  if (level >= 12) return "Avanzado";
  if (level >= 8) return "Viajero";
  if (level >= 4) return "Estudiante";
  return "Aprendiz";
}

export interface BadgeDef {
  key: string;
  name: string;
  description: string;
  icon: string;
}

export const BADGES: BadgeDef[] = [
  { key: "first_steps", name: "Primeros pasos", description: "Erste 10 Vokabeln richtig beantwortet", icon: "👶" },
  { key: "vocab_50", name: "Coleccionista", description: "50 Vokabeln in der Sammlung", icon: "📚" },
  { key: "vocab_200", name: "Bibliotecario", description: "200 Vokabeln in der Sammlung", icon: "🏛️" },
  { key: "streak_3", name: "Constante", description: "3 Tage in Folge gelernt", icon: "🔥" },
  { key: "streak_7", name: "Una semana", description: "7 Tage in Folge gelernt", icon: "🌟" },
  { key: "streak_30", name: "Imparable", description: "30 Tage in Folge gelernt", icon: "💎" },
  { key: "perfect_quiz", name: "Sin errores", description: "Quiz mit 100% abgeschlossen", icon: "🎯" },
  { key: "combo_10", name: "En racha", description: "10 richtige Antworten in Folge", icon: "⚡" },
  { key: "level_5", name: "Estudiante", description: "Level 5 erreicht", icon: "🎓" },
  { key: "level_10", name: "Viajero", description: "Level 10 erreicht", icon: "✈️" },
  { key: "chat_first", name: "¡Hola Profe!", description: "Erste Nachricht an Profe Hola", icon: "💬" },
];

export const BADGE_BY_KEY = Object.fromEntries(BADGES.map((b) => [b.key, b]));

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Aktualisiert XP, Streak und prüft Badges.
 * @param xpDelta XP, die hinzugefügt werden sollen.
 * @param ctx zusätzlicher Kontext für Badge-Checks.
 */
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

  // Streak
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

  // Badges
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
    if (toInsert.length) {
      await supabase
        .from("user_badges")
        .insert(toInsert.map((k) => ({ user_id: userId, badge_key: k })));
      for (const k of toInsert) {
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
    toast.success(`¡Nivel ${result.newLevel}! ${rankName(result.newLevel)}`, {
      description: "Du bist aufgestiegen!",
    });
  }
  for (const b of result.newBadges) {
    fireConfetti();
    toast.success(`${b.icon} ${b.name}`, { description: b.description });
  }
}
