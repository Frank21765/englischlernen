// Zentrale Texte für das Onboarding v3 (Phase 1a).
// Hier liegen ALLE sichtbaren Strings: Headlines, Fragen, Antworttexte,
// Buttons, Mini-Check, Ergebnis-Vorlagen. Nichts davon gehört in die Komponente.
//
// Anpassungs-Regel: Texte hier ändern, nicht im JSX. So bleiben sie für Frank
// und Alex jederzeit ohne TS-Risiko editierbar.

export type GoalId =
  | "auffrischen"
  | "grammatik"
  | "beruf_alltag"
  | "reisen_alltag"
  | "wortschatz";

export type SelfId =
  | "leichter_neustart"
  | "schulenglisch_rest"
  | "satzbau_unsicher"
  | "alltag_zurecht";

export interface ChoiceCopy<T extends string> {
  id: T;
  label: string;
}

export interface MiniCheckOption {
  label: string;
  correct: boolean;
}

export interface MiniCheckTask {
  id: string;
  /** Kurzer Hinweis, was hier geprüft wird (z. B. „Bedeutung verstehen"). */
  kind: string;
  /** Hauptfrage / Prompt. */
  prompt: string;
  /** Optionaler ruhiger Helfertext. Niemals dramatisch. */
  helper?: string;
  options: MiniCheckOption[];
}

export const onboardingCopy = {
  welcome: {
    // Sichtbare Nutzer-Headline (Beta-interner Fokus bleibt „Englisch wieder reinkommen").
    title: "Finde deinen Englisch-Startpunkt",
    line1: "In einer Minute finden wir einen sinnvollen Einstieg für dich.",
    line2: "Kein Teststress. Du kannst deinen Startpunkt später ändern.",
    cta: "Startpunkt finden",
  },
  goal: {
    title: "Wofür willst du Englisch gerade am meisten nutzen?",
    helper: "Eine Antwort reicht. Du kannst sie später ändern.",
    options: [
      { id: "auffrischen", label: "Englisch auffrischen" },
      { id: "grammatik", label: "Grammatik sicherer werden" },
      { id: "beruf_alltag", label: "Englisch für Beruf & Alltag" },
      { id: "reisen_alltag", label: "Reisen und Alltag" },
      { id: "wortschatz", label: "Wortschatz erweitern" },
    ] as ChoiceCopy<GoalId>[],
    cta: "Weiter",
  },
  self: {
    title: "Was passt im Moment am ehesten auf dich?",
    helper: "Kein Test. Wir nehmen das nur als Ausgangspunkt.",
    options: [
      { id: "leichter_neustart", label: "Ich brauche einen eher leichten Neustart." },
      { id: "schulenglisch_rest", label: "Ich hatte mal Schulenglisch und komme mit Hilfe wieder rein." },
      { id: "satzbau_unsicher", label: "Ich verstehe einiges, bin aber bei Satzbau und Zeiten unsicher." },
      { id: "alltag_zurecht", label: "Ich komme im Alltag meist zurecht, will aber sicherer werden." },
    ] as ChoiceCopy<SelfId>[],
    cta: "Weiter zum Mini-Check",
  },
  miniCheck: {
    title: "Kurzer Mini-Check",
    helper: "Ein paar kurze Aufgaben, damit du nicht zu leicht oder zu schwer startest.",
    progressLabel: (current: number, total: number) => `Aufgabe ${current} von ${total}`,
    skipLabel: "Überspringen",
    afterText: "Danke, das hilft uns bei deiner Startempfehlung.",
    tasks: [
      {
        id: "meaning_missed_train",
        kind: "Bedeutung verstehen",
        prompt: "„I missed the train.“",
        options: [
          { label: "Ich habe den Zug verpasst.", correct: true },
          { label: "Ich habe den Zug vermisst.", correct: false },
          { label: "Ich habe den Zug gefunden.", correct: false },
        ],
      },
      {
        id: "grammar_doesnt",
        kind: "Grammatikform",
        prompt: "„She ___ work here.“",
        options: [
          { label: "doesn't", correct: true },
          { label: "don't", correct: false },
          { label: "isn't", correct: false },
        ],
      },
      {
        id: "past_went",
        kind: "Vergangenheit",
        prompt: "„Yesterday we ___ to Berlin.“",
        options: [
          { label: "went", correct: true },
          { label: "go", correct: false },
          { label: "gone", correct: false },
        ],
      },
      {
        id: "wordorder_coffee",
        kind: "Satzbau",
        prompt: "Bring in die richtige Reihenfolge: often / I / coffee / drink",
        options: [
          { label: "I often drink coffee.", correct: true },
          { label: "Often I coffee drink.", correct: false },
          { label: "I drink often coffee.", correct: false },
        ],
      },
      {
        id: "prep_good_at",
        kind: "Präposition",
        prompt: "„I am good ___ English.“",
        options: [
          { label: "at", correct: true },
          { label: "in", correct: false },
          { label: "on", correct: false },
        ],
      },
    ] as MiniCheckTask[],
  },
  result: {
    // Bewusst weicher: „Vorschlag" statt „Empfehlung", keine harte Einstufung.
    headlinePrefix: "Unser Vorschlag für deinen Start:",
    firstStepLabel: "Dein erster Schritt:",
    closingHint: "Das ist nur ein Startpunkt. Du kannst ihn später jederzeit ändern.",
    primaryCta: "Mit dieser Lektion starten",
    secondaryCta: "Startpunkt ändern",
    busyLabel: "Speichere …",
  },
} as const;
