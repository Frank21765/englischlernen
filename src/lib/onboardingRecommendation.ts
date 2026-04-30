// Pure function: aus Onboarding-Antworten → Empfehlung.
//
// KEINE DB-Zugriffe, KEINE Events, KEINE Profile-Writes.
// Nur Input rein, Empfehlung raus. Damit testbar und in der Admin-Preview
// (Phase 1b) gefahrlos im Trockenmodus aufrufbar.
//
// Übergangslösung bis Phase 2/3: `recommendedLessonId` mappt auf eine
// bestehende statische Lektion aus `src/lib/lessons.ts`. Die DB-gestützte
// Lektion-Empfehlung folgt erst, wenn das Lessons-System aus Phase 2 steht.

import type { GoalId, SelfId, MiniCheckTask } from "@/lib/onboardingCopy";
import { onboardingCopy } from "@/lib/onboardingCopy";

export type RecommendedBand = "A1/A2" | "A2/B1" | "B1" | "B1/B2";
export type ConfidenceBand = "low" | "medium" | "high";

export interface MiniCheckAnswer {
  taskId: string;
  /** Index der gewählten Option in `task.options`. Null = übersprungen. */
  selectedIndex: number | null;
}

export interface RecommendationInput {
  goalId: GoalId | null;
  selfAssessmentId: SelfId | null;
  miniCheckAnswers: MiniCheckAnswer[];
}

export interface Recommendation {
  recommendedBand: RecommendedBand;
  /** Stabiler Code für spätere DB-Lektionen (Phase 2/3). */
  recommendedEntryCode: string;
  /** Lesson-ID aus dem heutigen `src/lib/lessons.ts` — Übergangslösung. */
  recommendedLessonId: string;
  /** Default-Level, das wir in `profiles.default_level` schreiben (A1–B2). */
  recommendedDefaultLevel: "A1" | "A2" | "B1" | "B2";
  /** Default-Topic, das wir in `profiles.default_topic` schreiben. */
  recommendedDefaultTopic: string;
  /** Headline für den Result-Screen (z. B. „Wiedereinstieg A2/B1"). */
  headline: string;
  /** Kurze Begründung in 1–2 Sätzen, ruhig formuliert. */
  shortReason: string;
  /** Titel des ersten Schritts (z. B. „Alltag & Present Simple auffrischen"). */
  firstStepTitle: string;
  confidenceBand: ConfidenceBand;
}

/**
 * Wertet den Mini-Check aus.
 * Übersprungene Aufgaben zählen als „nicht beantwortet" (weder richtig noch falsch).
 */
export function scoreMiniCheck(
  answers: MiniCheckAnswer[],
  tasks: MiniCheckTask[],
): { correct: number; answered: number; total: number } {
  let correct = 0;
  let answered = 0;
  for (const t of tasks) {
    const a = answers.find((x) => x.taskId === t.id);
    if (!a || a.selectedIndex === null) continue;
    answered++;
    if (t.options[a.selectedIndex]?.correct) correct++;
  }
  return { correct, answered, total: tasks.length };
}

/**
 * Hauptfunktion. Stabil, deterministisch, ohne Seiteneffekte.
 */
export function computeRecommendation(input: RecommendationInput): Recommendation {
  const { goalId, selfAssessmentId, miniCheckAnswers } = input;
  const score = scoreMiniCheck(miniCheckAnswers, onboardingCopy.miniCheck.tasks as MiniCheckTask[]);

  // Selbsteinschätzung gibt einen Basis-Score 1–4.
  const selfScore: Record<SelfId, number> = {
    leichter_neustart: 1,
    schulenglisch_rest: 2,
    satzbau_unsicher: 2,
    alltag_zurecht: 3,
  };
  const base = selfAssessmentId ? selfScore[selfAssessmentId] : 1.5;

  // Mini-Check-Score in 0..1, gewichtet auf die tatsächlich beantworteten Aufgaben.
  const checkRatio = score.answered === 0 ? 0.5 : score.correct / score.answered;
  // Mappe Ratio auf Verschiebung — bewusst vorsichtig. Der Mini-Check ist kein
  // belastbarer Test, sondern ein kleiner Stupser. Er darf nur LEICHT nach oben
  // schieben, aber etwas stärker nach unten korrigieren.
  const checkShift =
    checkRatio >= 0.9 ? 0.5 :
    checkRatio >= 0.6 ? 0.25 :
    checkRatio >= 0.4 ? 0 :
    checkRatio >= 0.2 ? -0.5 : -1;

  const combined = base + checkShift; // ca. 0 .. 3.5
  // Band-Mapping: B1 nur, wenn Selbsteinschätzung UND Mini-Check zusammen
  // klar darauf hinweisen. Der Mini-Check allein darf nie auf B1/B2 hochstufen.
  let band: RecommendedBand;
  let defaultLevel: "A1" | "A2" | "B1" | "B2";
  if (combined < 1) {
    band = "A1/A2";
    defaultLevel = "A2";
  } else if (combined < 2.25) {
    band = "A2/B1";
    defaultLevel = "A2";
  } else if (combined < 3.25) {
    band = "A2/B1";
    defaultLevel = "B1";
  } else {
    band = "B1";
    defaultLevel = "B1";
  }

  // Sicherheitsnetz: Ohne Selbsteinschätzung „alltag_zurecht" gibt es kein B1.
  // Damit kann der Mini-Check niemals allein bis B1 hochstufen, auch wenn er
  // perfekt war.
  if (defaultLevel === "B1" && selfAssessmentId !== "alltag_zurecht") {
    defaultLevel = "A2";
    band = "A2/B1";
  }

  // Topic primär aus dem Ziel ableiten — bleibt im Beta-Fokus „Alltag/Wiedereinstieg".
  const topicByGoal: Record<GoalId, string> = {
    auffrischen: "Alltag",
    grammatik: "Alltag",
    beruf_alltag: "Arbeit",
    reisen_alltag: "Reisen",
    wortschatz: "Alltag",
  };
  const topic = goalId ? topicByGoal[goalId] : "Alltag";

  // Übergangs-Mapping: bestehende statische Lektionen aus `src/lib/lessons.ts`.
  const lessonByLevel: Record<"A1" | "A2" | "B1" | "B2", string> = {
    A1: "alltag-a1",
    A2: "alltag-a2",
    B1: "alltag-b1",
    B2: "alltag-b1",
  };
  const recommendedLessonId = lessonByLevel[defaultLevel];

  // Headline weich formulieren — kein „Du bist B1" / „Niveau B1".
  const headlineBand = band === "A1/A2" ? "Leichter Wiedereinstieg" :
                       band === "A2/B1" ? "Wiedereinstieg A2/B1" :
                       band === "B1"    ? "Wiedereinstieg B1" :
                                          "Wiedereinstieg B1/B2";

  const reasonByCheck =
    checkRatio >= 0.85
      ? "Du hast einiges erkannt. Der Mini-Check ist kurz — wir starten trotzdem ruhig, damit es nicht zu schwer wird."
    : checkRatio >= 0.6
      ? "Du verstehst einfache Sätze gut. Bei Satzbau und Verbformen lohnt sich ein kurzer Neustart."
    : checkRatio >= 0.4
      ? "Vieles ist da, aber Satzbau und Zeiten dürfen nochmal sortiert werden. Wir starten ruhig."
    : checkRatio > 0
      ? "Wir starten bewusst leicht und bauen dich Schritt für Schritt wieder auf."
      : "Wir starten ruhig — du kannst dein Niveau jederzeit anpassen.";

  const firstStepTitle =
    defaultLevel === "A2" ? "Alltag & Present Simple auffrischen" :
    defaultLevel === "B1" ? "Alltag & Satzbau festigen" :
                            "Alltag — entspannt wieder reinkommen";

  // Confidence: bei nur 5 einfachen Aufgaben NIE „high".
  // Das Ergebnis ist eine Startempfehlung, kein belastbarer Test.
  const confidenceBand: ConfidenceBand =
    !selfAssessmentId || score.answered < 3 ? "low" :
    score.answered >= 4 ? "medium" : "low";

  return {
    recommendedBand: band,
    recommendedEntryCode: `reentry_${defaultLevel.toLowerCase()}_alltag_01`,
    recommendedLessonId,
    recommendedDefaultLevel: defaultLevel,
    recommendedDefaultTopic: topic,
    headline: headlineBand,
    shortReason: reasonByCheck,
    firstStepTitle,
    confidenceBand,
  };
}
