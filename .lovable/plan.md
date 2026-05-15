
## Package 7 Fix — Grammar: 3 Phasen statt 5 Steps

Nur `src/pages/Grammar.tsx`. Keine anderen Dateien, keine Edge Functions, keine DB.

### State-Änderungen
- `step: 0|1|2|3|4` → `phase: "lesson" | "practice" | "done"`
- `practiceIdx`, `practiceStats`, `answers`, `revealed` bleiben
- `generate()` setzt `phase` auf `"lesson"`, restliche Resets bleiben

### Phase 1 — `"lesson"` (Erklärung + Beispiele + Typischer Fehler)
Eine zusammenhängende Card-Gruppe, gerendert wenn `phase === "lesson"`:
1. Lesson-Card: Titel, „Neu"-Button, TypedExplanation-Block (short + contrastDE + trapNote + generalization), `Frag Ellie`-Button (askEllieAboutLesson)
2. Beispiele-Card: 3 Beispiele (en/de) — bisheriger Step-1-Inhalt
3. Kompakter „Typischer Fehler"-Abschnitt direkt darunter (kein eigener Step) — bisheriger Step-2-Inhalt, gleiche Optik (rote Border + ✗/✓ + why)
4. CTA `Zu den Übungen` → `setPhase("practice")`

### Phase 2 — `"practice"` (3 Übungen einzeln)
Praktisch unverändert vom alten Step 3, aber:
- läuft direkt unter `phase === "practice"`
- nach Check oder Skip (`isRevealed`): Lösungs-/Hint-Block + **`Frag Ellie`-Button** (askEllieAboutPractice) + `Weiter`-Button
- Bug-Check: aktuell ist der Ellie-Button im Step-3 schon vorhanden, aber prüfen, dass er nicht durch `isRevealed`-Pfade verloren geht (Skip setzt revealed=true → Ellie muss erscheinen, was er bereits tut). Sicherstellen, dass die Ellie-Zeile nicht hinter Conditionals verschwindet
- `advancePractice()` bleibt; am Ende `setPhase("done")` statt `setStep(4)`

### Phase 3 — `"done"` (Abschluss)
Bisherige Step-4-Card mit Ergebnis `X / 3`, Niveau/Thema, Button „Neue Lektion".
Zusätzlich optionaler Button `Nochmal üben`, sichtbar wenn `practiceStats.correct < practiceStats.total` — setzt `answers={}`, `revealed={}`, `practiceIdx=0`, `practiceStats={correct:0,total:0}`, `phase="practice"` (Lektion bleibt geladen).

### Header-Label
Statt `Schritt {step+1} / 5`:
```ts
const headerSuffix =
  phase === "lesson"   ? "Erklärung" :
  phase === "practice" ? `Übung ${practiceIdx + 1} / ${lesson.practice.length}` :
                         "abgeschlossen";
```
Anzeige: `{level} · {topic} · {headerSuffix}`

### Was NICHT geändert wird
- Resume-Logik (`grammar-resume-*`) bleibt; nutzt weiterhin `lesson/answers/revealed` (kein `phase` im Snapshot — Rückkehr landet immer in `"lesson"` über Default-Init, das ist akzeptabel und gewollt einfach)
- `check()`, `advancePractice()`-Kernlogik, DB-Insert in `learning_sessions` (genau einmal pro Runde) bleiben
- `askEllieAboutLesson` / `askEllieAboutPractice` unverändert
- Kein Restyling, keine neuen Komponenten

### Verifikation
- `bunx tsc --noEmit`
- Manuell: Lektion starten → Phase 1 zeigt Erklärung + 3 Beispiele + Typischer Fehler + Ellie + „Zu den Übungen". Übungen 1–3 mit Ellie-Button nach jeder Antwort. Abschluss zeigt `X / 3` und ggf. „Nochmal üben". Header-Suffix korrekt in allen 3 Phasen. DB: genau ein `learning_sessions`-Eintrag pro abgeschlossener Lektion.
