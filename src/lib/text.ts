/**
 * Text helpers used across exercise modules to keep display formatting
 * (capitalisation, punctuation) consistent — even when the underlying lesson
 * data was authored in mixed case.
 *
 * Comparison helpers in src/lib/lessons.ts and src/pages/Wortpuzzle.tsx
 * already normalise via toLowerCase, so these helpers are purely cosmetic:
 * they make solutions and user-facing reconstructions look like a real
 * sentence (Satzanfang groß, Rest klein, außer "I" und Eigennamen).
 */

/** Common English proper-noun-ish tokens we never lowercase. */
const ALWAYS_CAPITAL = new Set([
  "I",
  "I'm",
  "I'll",
  "I've",
  "I'd",
  "England",
  "English",
  "Germany",
  "German",
  "London",
  "Paris",
  "Berlin",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]);

/**
 * Capitalise the first letter of a string, leave the rest untouched.
 * Safely handles empty strings and leading whitespace/punctuation.
 */
export function capitalizeFirst(text: string): string {
  if (!text) return text;
  // Find the first letter and uppercase only that letter.
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/[a-zäöüß]/i.test(ch)) {
      return text.slice(0, i) + ch.toUpperCase() + text.slice(i + 1);
    }
  }
  return text;
}

/**
 * Render a sentence in its canonical "display" form:
 * - first word capitalised
 * - "I" and a small set of proper nouns kept capitalised
 * - everything else lower-case
 *
 * Used when showing the correct solution for Wortpuzzle / Satzbau /
 * Lektion-order tasks so users always see a clean, consistent sentence
 * regardless of how the lesson author typed it.
 */
export function toSentenceCase(text: string): string {
  if (!text) return text;
  const tokens = text.split(/(\s+)/); // keep whitespace
  let firstWordSeen = false;
  const out = tokens.map((tok) => {
    if (/^\s+$/.test(tok) || tok === "") return tok;
    const stripped = tok.replace(/[.,!?;:"„""'']/g, "");
    if (ALWAYS_CAPITAL.has(stripped)) {
      // preserve exact casing for proper nouns / I
      const idx = tok.indexOf(stripped);
      return idx === -1 ? tok : tok.slice(0, idx) + stripped + tok.slice(idx + stripped.length);
    }
    const lowered = tok.toLowerCase();
    if (!firstWordSeen) {
      firstWordSeen = true;
      return capitalizeFirst(lowered);
    }
    return lowered;
  });
  return out.join("");
}
