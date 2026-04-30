# Archiv: Fahrplan v2 (vor Umstellung auf v3)

> Dieser Plan wurde am 30.04.2026 durch **Fahrplan v3** ersetzt
> (Beta-Fokus „Englisch wieder reinkommen"). Hier nur als historische Referenz.

---

# Fahrplan: Vom MVP zum pädagogisch wertvollen Lernsystem

## Leitidee
Bestehende App **nicht neu bauen**. Pädagogisches Rückgrat schichtweise einziehen. Jede Phase liefert ein sichtbares Ergebnis. Datenmodell von Anfang an so, dass Onboarding, Lernkompass und Mastery sauber andocken können — ohne dass wir vorher 6 Wochen blind im Backend wühlen.

## 5 Leitplanken (v2)

1. **Onboarding ist sichtbar, nicht nur Datenfundament.**
2. **A1–B2 von Anfang an als vollständiger Levelrahmen.**
3. **Echte Inhalte testbar ab Phase 3.**
4. **Übungsrichtungen für deutsche Lerner** (de→en, en→de, mixed).
5. **Architektonische Erweiterbarkeit für andere Sprachrichtungen** (`source_language`, `target_language`, `exercise_direction`).

## Phasen v2 (Kurzfassung)

- **Phase 1:** Onboarding-Profil + Diagnose-Felder (`learning_goal`, `self_assessment`, `interests`, `recommended_level`, `weekly_minutes_goal`, `diagnostic_results`, `learning_events`).
- **Phase 2:** Universelle SRS (`review_items`) + NGSL-Pool + TTS-Audio.
- **Phase 3:** Lessons-Container (`lessons`, `lesson_tasks`, `user_lesson_progress`).
- **Phase 4:** Micro Goals (`micro_goals`, `lesson_micro_goals`, `task_micro_goals`, `user_micro_goal_progress`).
- **Phase 5:** Grammar Patterns (`grammar_patterns`, `lesson_grammar_patterns`).
- **Phase 6:** Mastery Records (4-Zustände-System: new → learning → mastered_provisional → mastered_stable).
- **Phase 7:** Lernkompass + voller Weiter-Button.
- **Phase 8:** Hybrid-Lektionsinhalte (Kernpfad + AI-Themen).
- **Phase 9:** Fehlerkategorien + Schwächen-Erkennung.
- **Phase 10:** Finaler Design-Pass.

## Was sich gegenüber v2 in v3 geändert hat

- Beta-Fokus klar auf **„Englisch wieder reinkommen"** (A2/B1 bis B2 für eingerostete erwachsene Lerner) statt breitem A1–B2-Aufbau ab Tag 1.
- Onboarding v1 ist auf **5 Screens** reduziert (kein Interessen-Katalog, kein Minutenziel im Onboarding).
- **Admin-Preview** für Onboarding ist von „Backlog" auf **Phase 1** vorgezogen.
- **Universelles SRS** wird in v3 vereinfacht: Phase 6 (SRS v1) deckt nur noch Vokabeln/Chunks und Grammatikmuster ab.
- Mastery in v3 startet mit **3 Zuständen** (new → learning → provisional mastered); „stable mastered" kommt erst Phase 12.
- Micro Goals in v3 deutlich schlanker (1 Hauptziel + max. 2 Nebenziele pro Lektion, keine Gewichtung, keine N:M-Komplexität).
- Phase 11 in v3 neu: **Monetarisierung & Launch-Readiness** (Abo, Paywall, Datenschutz, App-Store).
- Phase 12 in v3 neu: **Ausbau nach Beta** (KI-Hilfe, Speaking, Business-Modul, breitere CEFR-Abdeckung).
- Klare **Parkliste** und **Prioritätsliste (Beta / Launch / Nach Launch / Später)** in v3 ergänzt.

> Vollständiger aktueller Plan: `.lovable/plan.md` (Fahrplan v3).
