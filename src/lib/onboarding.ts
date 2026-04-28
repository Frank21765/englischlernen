// Datentypen + Helper für die Onboarding-Felder im profiles-Datensatz.
// Wird in Phase 1 nur als Schreib-Schicht angelegt. Das Onboarding-UI nutzt
// das ab Phase 7 (Lernkompass) voll aus.

import { supabase } from "@/integrations/supabase/client";
import type { Level } from "@/lib/learning";

export type LearningGoal =
  | "alltag"
  | "reisen"
  | "pruefung"
  | "arbeit"
  | "frei";

export type SelfAssessment =
  | "anfaenger"
  | "etwas_erfahrung"
  | "unsicher"
  | "fortgeschritten";

export interface OnboardingProfile {
  learning_goal?: LearningGoal | null;
  self_assessment?: SelfAssessment | null;
  interests?: string[];
  recommended_level?: Level | null;
  weekly_minutes_goal?: number;
}

export async function saveOnboardingProfile(
  userId: string,
  profile: OnboardingProfile,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("profiles")
    .update({
      ...profile,
      onboarding_completed: true,
      last_compass_update: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export interface DiagnosticResultInput {
  area: "vocab" | "grammar" | "listening";
  score: number;
  cefrEstimate?: Level;
  details?: Record<string, unknown>;
}

export async function saveDiagnosticResult(
  userId: string,
  result: DiagnosticResultInput,
): Promise<void> {
  await supabase.from("diagnostic_results").insert({
    user_id: userId,
    area: result.area,
    score: result.score,
    cefr_estimate: result.cefrEstimate ?? null,
    details: result.details ?? null,
  });
}
