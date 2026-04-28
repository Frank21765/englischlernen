// Datentypen + Helper für die Onboarding-Felder im profiles-Datensatz.
//
// Phase-1-Nacharbeit: Schreibvorgänge sind jetzt robust und sichtbar:
// - Wir verifizieren mit .select(), dass die Update-Zeile auch wirklich existiert.
// - Fehler werden geloggt UND zurückgegeben, statt still verschluckt zu werden.
// - Felder, die wir nicht setzen wollen, lassen wir konsequent weg
//   (statt mit `undefined` zu spreaden, was Postgrest manchmal komisch behandelt).

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
  // Nur tatsächlich gesetzte Felder ins Update-Objekt aufnehmen.
  // Kein blindes Spread mit `undefined` – das hat in der Vergangenheit
  // dafür gesorgt, dass das Update lautlos die falsche Spaltenliste hatte.
  const update: Record<string, unknown> = {
    onboarding_completed: true,
    last_compass_update: new Date().toISOString(),
  };
  if (profile.learning_goal !== undefined) update.learning_goal = profile.learning_goal;
  if (profile.self_assessment !== undefined) update.self_assessment = profile.self_assessment;
  if (profile.interests !== undefined) update.interests = profile.interests;
  if (profile.recommended_level !== undefined) update.recommended_level = profile.recommended_level;
  if (profile.weekly_minutes_goal !== undefined) update.weekly_minutes_goal = profile.weekly_minutes_goal;

  // Sicherstellen, dass überhaupt eine Profilzeile existiert – sonst
  // trifft das Update 0 Zeilen und Postgrest meldet keinen Fehler.
  const { data: existing, error: selErr } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (selErr) {
    console.error("[onboarding] profile lookup failed", selErr);
    return { ok: false, error: selErr.message };
  }
  if (!existing) {
    const { error: insErr } = await supabase.from("profiles").insert({
      user_id: userId,
      ...(update as Record<string, never>),
    });
    if (insErr) {
      console.error("[onboarding] profile insert failed", insErr);
      return { ok: false, error: insErr.message };
    }
  } else {
    const { data: upd, error: updErr } = await supabase
      .from("profiles")
      .update(update as Record<string, never>)
      .eq("user_id", userId)
      .select("user_id, learning_goal, self_assessment, interests, recommended_level, weekly_minutes_goal, onboarding_completed");
    if (updErr) {
      console.error("[onboarding] profile update failed", updErr, { update });
      return { ok: false, error: updErr.message };
    }
    if (!upd || upd.length === 0) {
      const msg = "Profil-Update hat keine Zeile getroffen";
      console.error("[onboarding] " + msg, { userId, update });
      return { ok: false, error: msg };
    }
    console.info("[onboarding] profile saved", upd[0]);
  }
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
): Promise<{ ok: boolean; error?: string }> {
  const row = {
    user_id: userId,
    area: result.area,
    score: result.score,
    ...(result.cefrEstimate ? { cefr_estimate: result.cefrEstimate } : {}),
    ...(result.details ? { details: result.details as never } : {}),
  };

  const { error } = await supabase.from("diagnostic_results").insert([row]);
  if (error) {
    console.error("[onboarding] diagnostic insert failed", error, { row });
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
