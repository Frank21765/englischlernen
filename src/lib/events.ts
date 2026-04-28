// Universelles Event-Log für den Lernkompass.
// Jede Übung schreibt nach jeder Antwort/jedem Abschluss ein Event.
// Daraus baut der Lernkompass später Schwächen-Erkennung, Verlauf, Empfehlungen.
//
// Bewusst feuert das Logging "fire & forget" — eine Lerninteraktion darf nie
// blockieren, weil das Logbuch hängt. Fehler werden geschluckt und nur in der
// Konsole vermerkt.

import { supabase } from "@/integrations/supabase/client";

export type EventType =
  | "vocab_correct"
  | "vocab_wrong"
  | "grammar_correct"
  | "grammar_wrong"
  | "cloze_correct"
  | "cloze_wrong"
  | "puzzle_correct"
  | "puzzle_wrong"
  | "lesson_started"
  | "lesson_completed"
  | "review_done"
  | "diagnostic_taken"
  | "session_started";

export type ObjectType =
  | "vocabulary"
  | "grammar_pattern"
  | "lesson"
  | "micro_goal"
  | "ngsl_word";

export interface LogEventInput {
  eventType: EventType;
  objectType?: ObjectType;
  objectId?: string;
  level?: string;
  topic?: string;
  metadata?: Record<string, unknown>;
}

export async function logLearningEvent(input: LogEventInput): Promise<void> {
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) return; // Anonyme Sessions loggen wir (noch) nicht.

    await supabase.from("learning_events").insert({
      user_id: userId,
      event_type: input.eventType,
      object_type: input.objectType ?? null,
      object_id: input.objectId ?? null,
      level: input.level ?? null,
      topic: input.topic ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (err) {
    // Niemals Lerninteraktion blockieren.
    console.warn("[events] failed to log", err);
  }
}
