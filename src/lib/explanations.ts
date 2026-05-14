// Typed explanations for pedagogical feedback.
// Schema co-developed with Alex — used as guardrail for Edge Function prompts
// and as a future contract for typed explanation fields in master tables.

export const EXPLANATION_TYPES = [
  "pattern",
  "function",
  "contrast",
  "trap",
  "chunk",
  "register",
  "mnemonic",
] as const;

export type ExplanationType = typeof EXPLANATION_TYPES[number];

export const EXPLANATION_TYPE_LABELS: Record<ExplanationType, string> = {
  pattern:   "Muster",
  function:  "Verwendung",
  contrast:  "DE↔EN Unterschied",
  trap:      "Typischer Fehler",
  chunk:     "Feste Wendung",
  register:  "Natürlichkeit",
  mnemonic:  "Eselsbrücke",
};

export interface TypedExplanation {
  type: ExplanationType;
  short: string;
  contrastDE?: string;
  trapNote?: string;
  generalization?: string;
}

export const EXPLANATION_WORD_LIMITS: Record<string, number> = {
  A1: 25, A2: 35, B1: 50, B2: 70,
};

export function validateExplanation(e: TypedExplanation, cefr: string): string[] {
  const errors: string[] = [];
  const limit = EXPLANATION_WORD_LIMITS[cefr] ?? 70;
  const wordCount = e.short.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > limit) errors.push(`Zu lang: ${wordCount}/${limit} Wörter für ${cefr}`);

  const BANNED: RegExp[] = [
    /correctly reflects/i,
    /best fits/i,
    /this option is correct/i,
    /ist korrekt, weil/i,
    /spiegelt.*richtig.*wider/i,
    /die richtige Antwort ist/i,
    /passt am besten/i,
    /ist die einzig/i,
  ];
  for (const p of BANNED) {
    if (p.test(e.short)) errors.push("Validation-Sprache erkannt");
  }
  return errors;
}

export function coerceToTyped(raw: unknown): TypedExplanation {
  if (raw && typeof raw === "object" && "type" in raw && "short" in raw) {
    return raw as TypedExplanation;
  }
  return {
    type: "function",
    short: typeof raw === "string" ? raw : "Keine Erklärung verfügbar.",
  };
}

// --- Legacy heuristic, kept for backwards compatibility with any callers
// that still import isWeakExplanation from this module. New code should use
// validateExplanation() above.
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
