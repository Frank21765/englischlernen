export const LEVELS = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"] as const;
export type Level = typeof LEVELS[number];

export const QUICK_TOPICS = [
  "Alltag",
  "Reise",
  "Essen & Trinken",
  "Arbeit",
  "Familie",
  "Gesundheit",
  "Sport",
  "Natur",
  "Technik",
  "Shopping",
] as const;

export type DirectionMode = "de_en" | "en_de" | "random";

export const directionLabel: Record<DirectionMode, string> = {
  de_en: "Immer Deutsch → Englisch",
  en_de: "Immer Englisch → Deutsch",
  random: "Zufällig wechseln",
};

export type CardDirection = "de_en" | "en_de";

export function pickDirection(mode: DirectionMode): CardDirection {
  if (mode === "de_en" || mode === "en_de") return mode;
  return Math.random() < 0.5 ? "de_en" : "en_de";
}
