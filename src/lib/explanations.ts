// Mini-Taxonomie für pädagogische Erklärungen.
// Ziel: Erklärungen sollen mehr leisten als "richtig/falsch" — sie sollen
// Lernregeln, deutsche Denkfehler und natürliches Englisch sichtbar machen.
//
// Aktuell wird das Schema noch nicht erzwungen (kein DB-Refactor). Es dient
// als Leitplanke für Edge-Function-Prompts und für künftige Felder in den
// Master-Tabellen (z.B. cefr_vocab_master.common_mistakes_json).
//
// Die Reihenfolge entspricht der didaktischen Priorität:
// 1. Was ist die Regel? (grammar_rule)
// 2. Wie denkt ein Deutscher hier falsch? (german_bridge / common_german_mistake)
// 3. Wie klingt es natürlich auf Englisch? (natural_english_usage)
// 4. Wie merke ich es mir? (memory_rule)

export type ExplanationType =
  | "grammar_rule"            // Die zugrunde liegende Regel
  | "german_bridge"           // Brücke aus dem deutschen Denken
  | "common_german_mistake"   // Typischer Fehler deutscher Lerner
  | "state_vs_process"        // Zustand vs. Veränderung (be vs. get)
  | "natural_english_usage"   // Was klingt für Muttersprachler natürlich
  | "memory_rule"             // Eselsbrücke / Merksatz
  | "beginner_rule"           // Vereinfachte Faustregel für Anfänger
  | "native_speaker_feel";    // Sprachgefühl-Hinweis

export interface ExplanationFragment {
  type: ExplanationType;
  text: string;
}

export const explanationLabels: Record<ExplanationType, string> = {
  grammar_rule: "Regel",
  german_bridge: "Deutsche Brücke",
  common_german_mistake: "Typischer Fehler",
  state_vs_process: "Zustand vs. Veränderung",
  natural_english_usage: "Natürliches Englisch",
  memory_rule: "Eselsbrücke",
  beginner_rule: "Faustregel",
  native_speaker_feel: "Sprachgefühl",
};

// Heuristische Floskel-Filter — wenn eine KI-Erklärung nur das hier sagt,
// markieren wir sie als "schwach" und können später eine Re-Prompt-Schleife
// triggern. Aktuell nur fürs Logging gedacht.
const WEAK_PHRASES = [
  /diese antwort passt am besten/i,
  /diese antwort ist (?:grammatikalisch )?korrekt/i,
  /^nur diese option/i,
  /^die richtige antwort ist/i,
  /^richtig\.?$/i,
];

export function isWeakExplanation(text: string | null | undefined): boolean {
  if (!text) return true;
  const t = text.trim();
  if (t.length < 25) return true;
  return WEAK_PHRASES.some((re) => re.test(t));
}
