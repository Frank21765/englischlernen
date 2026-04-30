# Phase 1 — Umsetzungs-Checkliste

> Vorbereitung für den nächsten Umsetzungs-Prompt. **Nichts davon ist bereits gebaut.**
> Phase 1 wird in zwei kleine, separat überprüfbare Schritte geteilt: **1a** (Onboarding v1) und **1b** (Admin-Preview).

---

## Vorbedingungen / Risiken (zuerst klären)

- [ ] **Größtes Risiko:** Admin-Preview darf das echte Profil nicht überschreiben. Vor jedem Schreibzugriff im Onboarding (`saveOnboardingProfile`, `saveDiagnosticResult`, `logLearningEvent`) wird `previewMode` geprüft. Bei `previewMode === true` → kein DB-Write, keine Events.
- [ ] Bestehende Felder `profiles.interests` und `profiles.weekly_minutes_goal` werden für neue User in v3 **nicht mehr gesetzt** (Onboarding v1 fragt sie nicht ab). Vorher prüfen: `rg "interests" src/` — gibt es Code, der auf gefüllte `interests` baut? Falls ja: defensiv machen oder Defaults setzen, **kein** Schema-Change.
- [ ] „Empfohlene erste Lektion" mappt in Phase 1 auf eine **bestehende statische Lektion** aus `src/lib/lessons.ts` (z. B. erste A2/B1-Wiedereinstiegslektion). Erst Phase 3 ersetzt das durch den DB-gestützten Beta-Pfad. Diese Übergangslösung explizit dokumentieren.
- [ ] Mini-Check verwendet die 5 Beispielaufgaben aus dem v3-Plan (Bedeutung, doesn't, went, Wortstellung, Präposition) — **nicht** die alten Diagnose-Items.
- [ ] Phase 1 braucht **keine neue DB-Migration**. Alle benötigten Spalten existieren bereits.

---

## Phase 1a — Nutzer-Onboarding v1

### Neue Dateien
- [ ] `src/lib/onboardingCopy.ts` — zentrale Texte: Screen-Überschriften, Ziel-Optionen, Selbsteinschätzungs-Optionen, 5 Mini-Check-Aufgaben, Empfehlungs-Vorlagen, Button-Texte. Eine Quelle der Wahrheit — Texte später leicht änderbar.
- [ ] `src/lib/onboardingRecommendation.ts` — pure Funktion `computeRecommendation({goal, selfAssessment, miniCheckScore}) → { startBand: "A2/B1" | "B1" | "B1/B2", headline, sub, firstLessonId }`. Keine DB-Calls. Direkt unit-testbar.

### Geänderte Dateien
- [ ] `src/pages/Onboarding.tsx` — Reduktion von 9 Stages auf **5 Screens** (welcome → goal → self → check → result). Texte ausschließlich aus `onboardingCopy.ts`. Empfehlung über `computeRecommendation`. Result-Screen mit zwei Buttons: **„Mit dieser Lektion starten"** / **„Startpunkt ändern"**. Liest URL-Param `?preview=1` → setzt `previewMode`.
- [ ] `src/lib/onboarding.ts` — neue Signatur akzeptiert optional `{ previewMode?: boolean }`. Bei `previewMode` werden `saveOnboardingProfile` und `saveDiagnosticResult` zu No-Ops, die nur die berechnete Empfehlung zurückgeben.
- [ ] `src/lib/events.ts` — neue Event-Typen ergänzen (additiv, alte nicht entfernen): `onboarding_started`, `onboarding_completed`, `recommendation_shown`, `first_lesson_started`, `first_lesson_completed`. Im `previewMode` werden Events nicht geschrieben.
- [ ] `src/pages/Start.tsx` — minimal: wenn Onboarding abgeschlossen und noch keine Lektion gestartet, „Continue"-Bereich zeigt die empfohlene erste Lektion (aus `profiles.recommended_level` + `learning_goal`).

### Erfolgskriterien 1a
- Nutzer kommt in unter 1 Minute zur Empfehlung.
- Empfehlung passt zu Antwort-Kombination (mind. 3 sichtbar unterschiedliche Empfehlungs-Varianten).
- Klick auf „Mit dieser Lektion starten" öffnet eine echte, lauffähige Lektion.
- `learning_goal`, `self_assessment`, `recommended_level`, `onboarding_completed` werden im echten Modus gespeichert.

---

## Phase 1b — Admin-Preview

### Geänderte Dateien
- [ ] `src/pages/Admin.tsx` — neuer Tab oder prominenter Button **„Onboarding testen"**. Klick → Navigation nach `/onboarding?preview=1`.
- [ ] `src/pages/Onboarding.tsx` — bei `previewMode`:
  - sichtbares **Testmodus-Banner** oben (z. B. „Testmodus — deine Antworten werden nicht gespeichert. [Onboarding neu starten]")
  - Result-Screen zeigt Empfehlung, **aber**: kein Schreibvorgang, kein Event, kein Redirect in echte Lektion. Stattdessen Hinweis „So würde die Empfehlung für diese Antworten aussehen." + Button „Onboarding nochmal durchspielen" (reset state) + Button „Zurück zum Adminbereich".

### Erfolgskriterien 1b
- Admin kann Onboarding aus dem Adminbereich starten.
- Banner ist immer sichtbar, solange `previewMode` aktiv ist.
- Nach Durchlauf: `profiles`-Zeile des Admins ist **unverändert** (manuell prüfen via SQL).
- Keine Einträge in `diagnostic_results` oder `learning_events` für die Preview-Session.
- Beliebige Wiederholung möglich.

---

## Test-Skript für Frank (nach Umsetzung)

1. **Frischer User:** Account anlegen → Onboarding → Empfehlung sollte zur gewählten Selbsteinschätzung passen → erste Lektion startet.
2. **Admin (eigenes Konto):** Adminbereich → „Onboarding testen" → komplett durchklicken mit Antworten X → Result anzeigen → zurück → eigenes Profil prüfen: unverändert. Drei mal hintereinander mit unterschiedlichen Antworten wiederholen.
3. **DB-Spotcheck:** `select learning_goal, self_assessment, recommended_level, onboarding_completed from profiles where user_id = '<admin-id>'` → Werte unverändert vom Stand vor dem Test.
