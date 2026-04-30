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
  const base = selfAssessmentId ? selfScore[selfAssessmentId] : 2;

  // Mini-Check-Score in 0..1, gewichtet auf die tatsächlich beantworteten Aufgaben.
  const checkRatio = score.answered === 0 ? 0.5 : score.correct / score.answered;
  // Mappe Ratio auf Verschiebung -1..+1.
  const checkShift =
    checkRatio >= 0.85 ? 1 :
    checkRatio >= 0.6 ? 0.5 :
    checkRatio >= 0.4 ? 0 :
    checkRatio >= 0.2 ? -0.5 : -1;

  const combined = base + checkShift; // 0..4
  // Band-Mapping bewusst konservativ — wir bleiben im Wiedereinstiegs-Korridor.
  let band: RecommendedBand;
  let defaultLevel: "A1" | "A2" | "B1" | "B2";
  if (combined <= 1) {
    band = "A1/A2";
    defaultLevel = "A2";
  } else if (combined <= 2) {
    band = "A2/B1";
    defaultLevel = "A2";
  } else if (combined <= 3) {
    band = "A2/B1";
    defaultLevel = "B1";
  } else if (combined <= 3.5) {
    band = "B1";
    defaultLevel = "B1";
  } else {
    band = "B1/B2";
    defaultLevel = "B1";
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
  // Slugs sind dort `<topic>-<level>` in Kleinbuchstaben.
  const lessonByLevel: Record<"A1" | "A2" | "B1" | "B2", string> = {
    A1: "alltag-a1",
    A2: "alltag-a2",
    B1: "alltag-b1",
    B2: "alltag-b1", // B2-Wiedereinstieg landet bewusst auf B1-Alltag (Phase 3 ersetzt das).
  };
  // Beruf wäre `arbeit-a1/a2/b1`, Reisen `reisen-a1/a2`. Wir bleiben für Phase 1a
  // bewusst beim sicheren Fundament „Alltag", weil der Beta-Pfad in Phase 3
  // ohnehin auf Wiedereinstieg/Alltag zentriert.
  const recommendedLessonId = lessonByLevel[defaultLevel];

  // Headline + Reason nach Selbsteinschätzung & Score formulieren.
  const headlineBand = band === "A1/A2" ? "Leichter Wiedereinstieg" :
                       band === "A2/B1" ? "Wiedereinstieg A2/B1" :
                       band === "B1"    ? "Wiedereinstieg B1" :
                                          "Auffrischen B1/B2";

  const reasonByCheck =
    checkRatio >= 0.85
      ? "Du erkennst Struktur und Verbformen schon sicher. Wir setzen auf einer ruhigen Wiedereinstiegs-Stufe an, damit es flüssig sitzt."
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

  // Confidence: hoch nur, wenn mind. 4/5 beantwortet UND Selbsteinschätzung gesetzt.
  const confidenceBand: ConfidenceBand =
    !selfAssessmentId || score.answered < 3 ? "low" :
    score.answered >= 4 ? "high" : "medium";

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
