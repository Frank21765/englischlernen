// Helpers to launch Coach Ellie with useful learning context.
// All entry points just navigate to /chat with query params; Chat.tsx handles them.

export interface EllieLaunchOptions {
  prefill: string;
  /** Auto-send the prefill as the first user message. Default: false. */
  auto?: boolean;
  /** Open in a fresh chat session. Default: true (so context isn't mixed). */
  fresh?: boolean;
  /** Where to send the user when they click "Zurück zur Übung". E.g. "/quiz?resume=abc". */
  returnTo?: string;
  /** Short label for the back button (e.g. "Zurück zum Quiz"). */
  returnLabel?: string;
}

export function buildEllieUrl({ prefill, auto = false, fresh = true, returnTo, returnLabel }: EllieLaunchOptions): string {
  const p = new URLSearchParams();
  p.set("prefill", prefill);
  if (auto) p.set("auto", "1");
  if (!fresh) p.set("fresh", "0");
  // Mark this as a context-triggered chat so the UI can suppress generic starter prompts.
  p.set("ctx", "1");
  if (returnTo) p.set("return", returnTo);
  if (returnLabel) p.set("returnLabel", returnLabel);
  return `/chat?${p.toString()}`;
}

export function ellieAskWordPrompt(german: string, english: string, level?: string): string {
  const lvl = level ? ` (Level ${level})` : "";
  return `Erklär mir bitte das englische Wort *${english}* (deutsch: ${german})${lvl}: Bedeutung, typische Verwendung, 2 kurze Beispielsätze und einen häufigen Anfängerfehler.`;
}

export function ellieExplainQuizMistakePrompt(opts: {
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  level?: string;
  topic?: string;
}): string {
  const { prompt, userAnswer, correctAnswer, level, topic } = opts;
  const ctx = [level && `Level ${level}`, topic && `Thema: ${topic}`].filter(Boolean).join(" · ");
  const ctxLine = ctx ? `\nKontext: ${ctx}` : "";
  return `Ich habe gerade einen Fehler im Quiz gemacht.${ctxLine}
Frage: *${prompt}*
Meine Antwort: *${userAnswer}*
Richtige Antwort: *${correctAnswer}*

Bitte erklär mir kurz: Warum ist meine Antwort falsch, was bedeutet die richtige Antwort, und wie merke ich mir das am besten? Gib 1–2 Beispielsätze.`;
}

export function ellieExplainGrammarPrompt(opts: {
  prompt: string;
  correctAnswer: string;
  explanation?: string;
  level?: string;
  topic?: string;
}): string {
  const { prompt, correctAnswer, explanation, level, topic } = opts;
  const ctx = [level && `Level ${level}`, topic && `Thema: ${topic}`].filter(Boolean).join(" · ");
  const ctxLine = ctx ? `\nKontext: ${ctx}` : "";
  return `Kannst du mir diese Grammatik-Frage genauer erklären?${ctxLine}
Frage: *${prompt}*
Richtige Antwort: *${correctAnswer}*${explanation ? `\nKurz-Erklärung: ${explanation}` : ""}

Bitte erklär die Regel verständlich, gib 2 weitere Beispiele auf meinem Niveau und einen typischen Fehler, den ich vermeiden sollte.`;
}
