// Helpers to launch Coach Ellie with useful learning context.
// All entry points just navigate to /chat with query params; Chat.tsx handles them.

export interface EllieLaunchOptions {
  prefill: string;
  /** Auto-send the prefill as the first user message. Default: false. */
  auto?: boolean;
  /** Open in a fresh chat session. Default: true (so context isn't mixed). */
  fresh?: boolean;
  /** Optional short chat title for context-based tutor sessions. */
  title?: string;
  /** Where to send the user when they click "Zurück zur Übung". E.g. "/quiz?resume=abc". */
  returnTo?: string;
  /** Short label for the back button (e.g. "Zurück zum Quiz"). */
  returnLabel?: string;
}

export function buildEllieUrl({ prefill, auto = false, fresh = true, title, returnTo, returnLabel }: EllieLaunchOptions): string {
  const p = new URLSearchParams();
  p.set("prefill", prefill);
  if (auto) p.set("auto", "1");
  if (!fresh) p.set("fresh", "0");
  // Mark this as a context-triggered chat so the UI can suppress generic starter prompts.
  p.set("ctx", "1");
  if (title) p.set("title", title);
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
  return `Hmm, da ist mir gerade etwas durchgerutscht – kannst du mir kurz weiterhelfen?${ctxLine}
Frage: *${prompt}*
Meine Antwort: *${userAnswer}*
Richtige Antwort: *${correctAnswer}*

Bitte erklär mir freundlich: Warum passt meine Antwort nicht so gut, was bedeutet die richtige Antwort genau, und wie kann ich mir das gut merken? Gib mir 1–2 kurze Beispielsätze auf meinem Niveau.`;
}

export function ellieExplainClozePrompt(opts: {
  sentence: string;
  missingWord: string;
  translation?: string;
  userAnswer?: string;
  wasCorrect?: boolean;
  level?: string;
  topic?: string;
}): string {
  const { sentence, missingWord, translation, userAnswer, wasCorrect, level, topic } = opts;
  const ctx = [level && `Level ${level}`, topic && `Thema: ${topic}`].filter(Boolean).join(" · ");
  const ctxLine = ctx ? `\nKontext: ${ctx}` : "";
  const isCorrect = wasCorrect ?? (!!userAnswer && userAnswer.trim().toLowerCase() === missingWord.toLowerCase());
  const opener = isCorrect
    ? `Ich habe die Lücke richtig gelöst, möchte aber noch besser verstehen, warum *${missingWord}* hier passt.`
    : `Hmm, bei einer Lücke war ich mir gerade unsicher – kannst du mir kurz weiterhelfen?`;
  const answerLine = userAnswer
    ? `\nMeine Antwort: *${userAnswer}*${isCorrect ? " (richtig)" : ""}`
    : "";
  return `${opener}${ctxLine}
Satz: *${sentence.replace(missingWord, "___")}*
Richtiges Wort: *${missingWord}*${translation ? `\nÜbersetzung: ${translation}` : ""}${answerLine}

Bitte erklär mir freundlich, warum *${missingWord}* an dieser Stelle passt (Bedeutung, Form, typische Verwendung) und gib mir 1–2 weitere kurze Beispielsätze auf meinem Niveau.`;
}

export function ellieExplainGrammarLessonPrompt(opts: {
  title: string;
  explanation: string;
  level?: string;
  topic?: string;
}): string {
  const { title, explanation, level, topic } = opts;
  const ctx = [level && `Level ${level}`, topic && `Thema: ${topic}`].filter(Boolean).join(" · ");
  const ctxLine = ctx ? `\nKontext: ${ctx}` : "";
  return `Kannst du mir diese Grammatik-Lektion noch genauer erklären?${ctxLine}
Lektion: *${title}*
Kurz-Erklärung: ${explanation}

Bitte erklär die Regel verständlich in eigenen Worten, gib 2 weitere Beispiele auf meinem Niveau und einen typischen Fehler, den ich vermeiden sollte.`;
}

export function ellieExplainGrammarPracticePrompt(opts: {
  lessonTitle: string;
  sentence: string;
  answer: string;
  userAnswer?: string;
  hint?: string;
  level?: string;
  topic?: string;
}): string {
  const { lessonTitle, sentence, answer, userAnswer, hint, level, topic } = opts;
  const ctx = [level && `Level ${level}`, topic && `Thema: ${topic}`].filter(Boolean).join(" · ");
  const ctxLine = ctx ? `\nKontext: ${ctx}` : "";
  const wrongLine = userAnswer && userAnswer.trim().toLowerCase() !== answer.toLowerCase()
    ? `\nMeine Antwort: *${userAnswer}*`
    : "";
  return `Hmm, bei dieser Übung zur Lektion *${lessonTitle}* ist mir gerade etwas durchgerutscht.${ctxLine}
Satz: *${sentence.replace("__", "___")}*
Richtige Lösung: *${answer}*${wrongLine}${hint ? `\nHinweis war: ${hint}` : ""}

Bitte erklär mir freundlich, warum *${answer}* hier richtig ist, welche Regel dahintersteckt und gib mir 1–2 weitere kurze Beispielsätze auf meinem Niveau.`;
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
