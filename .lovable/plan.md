
# Roadmap v3 – Dokumentation und Vorbereitung

Dieser Schritt ist bewusst **rein dokumentarisch**. Es werden keine Features umgebaut, keine bestehenden Funktionen verändert und keine Migrationen ausgeführt. Ziel ist nur, die Roadmap im Projekt von v2 auf v3 zu heben und eine saubere Grundlage für die spätere Phase-1-Umsetzung zu schaffen.

## 1. Was geändert wird

1. **`.lovable/plan.md` wird ersetzt** durch den vollständigen Fahrplan v3 (Beta-Fokus „Englisch wieder reinkommen", 12 Phasen, Parkliste, Prioritäten Beta/Launch/Nach Launch/Später, technische Hinweise zur Texthaltung).
2. Der bisherige v2-Plan wird als **`.lovable/plan-v2-archiv.md`** archiviert, damit nichts verloren geht.
3. Im Projekt wird ein **Documents-Export** erzeugt:
   - `/mnt/documents/roadmap-v3.md`
   - `/mnt/documents/roadmap-v3.pdf` (Bordeaux-Header `#7a1028`, gemäß Memory-Regel)
4. Es wird eine kurze **Phase-1-Checkliste** als `.lovable/phase-1-checkliste.md` angelegt, die die konkreten Umsetzungs-Schritte für Phase 1 enthält (Onboarding v1 + Admin-Preview), damit daraus später ein einzelner Umsetzungs-Prompt entstehen kann.

**Es werden in diesem Schritt keine `.tsx`-, Migrations- oder Edge-Function-Dateien angefasst.**

## 2. Struktur der neuen Roadmap v3 (im Projekt)

```text
.lovable/
  plan.md                   ← Fahrplan v3 (neu, aktiv)
  plan-v2-archiv.md         ← bisheriger Plan (Archiv, read-only)
  phase-1-checkliste.md     ← konkrete Schritte für Phase 1
/mnt/documents/
  roadmap-v3.md             ← Download für Frank
  roadmap-v3.pdf            ← Download mit Bordeaux-Header
```

Inhaltlich folgt `plan.md` exakt der von Frank vorgegebenen Struktur:
Leitidee → Beta-Versprechen → Phasen 1–12 (jede mit Ziel / Umfang / „Nicht in dieser Phase") → Parkliste → Prioritäten (Beta / Launch / Nach Launch / Später) → technische Hinweise (Texte austauschbar, Branding nicht hart verdrahten, kleine überprüfbare Schritte).

## 3. Welche Phase als Erstes umgesetzt werden sollte

**Phase 1 – Sichtbares Onboarding v1 + Admin-Preview.**

Begründung: Ohne sauberen Einstiegspfad und ohne reproduzierbare Test-Möglichkeit für den Admin können alle weiteren Phasen (Lektionssystem, Beta-Pfad, Continue-Button) nicht sinnvoll getestet werden.

Phase 1 wird in der Checkliste in zwei Teile geteilt:

- **1a Nutzer-Onboarding v1** (5 Screens: Einstieg → Ziel → Selbsteinschätzung → Mini-Check 3–5 Aufgaben → Empfehlung mit „Mit dieser Lektion starten" / „Startpunkt ändern")
- **1b Admin-Preview** (Adminbereich: Button „Onboarding testen", öffnet Onboarding im `?preview=1`-Modus, klar als Testmodus markiert, schreibt nichts ins Profil, zeigt am Ende nur die Empfehlung als Vorschau)

## 4. Voraussichtlich betroffene Dateien für Phase 1

Nur als Vorschau, **nicht in diesem Schritt verändert**:

- `src/pages/Onboarding.tsx` – Reduktion der heutigen 9 Stages auf 5 Screens v1, Texte aus einer zentralen Konstante (z. B. `src/lib/onboardingCopy.ts`) lesen, damit Antworttexte später leicht änderbar sind.
- `src/lib/onboarding.ts` – um Preview-Modus erweitern: bei `preview=true` wird `saveOnboardingProfile` / `saveDiagnosticResult` **nicht** aufgerufen, stattdessen wird die berechnete Empfehlung nur lokal zurückgegeben.
- `src/lib/onboardingCopy.ts` (neu) – zentrale Texte für Ziel-Optionen, Selbsteinschätzungs-Optionen, Mini-Check-Aufgaben, Empfehlungs-Texte.
- `src/lib/onboardingRecommendation.ts` (neu) – reine Funktion, die aus Antworten Startbereich + erste Lektion ableitet (testbar, ohne DB).
- `src/pages/Admin.tsx` – neuer Tab/Button „Onboarding testen", navigiert nach `/onboarding?preview=1`.
- `src/pages/Start.tsx` – minimal: nach Onboarding-Abschluss „Empfohlene erste Lektion" als Continue-Inhalt anbieten (sonst keine Änderung).
- `src/lib/events.ts` – schlanke Phase-1-Events ergänzen: `onboarding_started`, `onboarding_completed`, `recommendation_shown`, `first_lesson_started`, `first_lesson_completed` (im Preview-Modus werden Events **nicht** geschrieben).

Datenbank: Phase 1 braucht **keine neue Migration**. `profiles.learning_goal`, `self_assessment`, `recommended_level`, `onboarding_completed` und `diagnostic_results` existieren bereits aus dem alten Phase-1-Schritt.

## 5. Risiken und Widersprüche im aktuellen Code

1. **Onboarding ist heute 9 Stages tief** (`welcome → goal → self → check → result → interests → minutes → topic → start`) inklusive Interessen, Minutenziel und Themenwahl. Der v3-Plan reduziert das bewusst auf 5 Screens und nimmt Interessen, Minutenziel und Topic-Auswahl raus. **Risiko:** Bestehende Felder `interests` und `weekly_minutes_goal` in `profiles` werden für neue User nicht mehr befüllt. Das ist okay, weil sie nullable sind – muss aber bewusst entschieden werden, damit kein Code irgendwo auf „interests ist gefüllt" baut. Vor Phase-1-Umsetzung kurz prüfen (`rg "interests" src/`).
2. **Lektionen sind heute hart in `src/lib/lessons.ts` (1951 Zeilen)** kodiert. Der v3-Plan verschiebt das DB-Lektionssystem in Phase 2. **Konsequenz:** Phase 1 muss die „empfohlene erste Lektion" vorerst auf eine **bestehende statische Lektion** mappen (z. B. erste A2/B1-Wiedereinstiegslektion aus `lessons.ts`). Erst Phase 3 ersetzt das durch den kuratierten Beta-Pfad. Das ist explizit so gewollt und kein Bug, sollte in der Checkliste aber dokumentiert sein.
3. **Mini-Check-Aufgaben** existieren heute als Diagnose-Quiz in `Onboarding.tsx`. Der v3-Plan will dort 3–5 sehr kurze Aufgaben mit klaren Beispielen (Bedeutung, Verbform, Past Simple, Wortstellung, Präposition). **Risiko:** Wenn wir die alten Diagnose-Items 1:1 weiternutzen, passt der Tonfall nicht zum v3-Versprechen („kein Teststress"). Phase 1 sollte daher die 5 Beispielaufgaben aus Franks Spec direkt verwenden und nicht die alten Items recyceln.
4. **`learning_events` schreibt heute viele Event-Typen** (z. B. aus Quiz/Wortpuzzle). Der v3-Plan definiert für Phase 1 nur 5 schlanke Aktivierungs-Events. **Kein Konflikt**, solange wir die neuen Events additiv ergänzen und die bestehenden nicht entfernen.
5. **Admin-Preview vs. echtes Profil:** Der heutige `Onboarding.tsx`-Code ruft am Ende unbedingt `saveOnboardingProfile` auf. Für die Preview muss ein expliziter Flag (`?preview=1` → Context/Prop `previewMode`) eingeführt werden, der **vor jedem Schreibzugriff** prüft. Wenn das vergessen wird, überschreibt der Admin sein eigenes Profil. Das ist das größte Risiko der Phase und gehört oben in die Checkliste.
6. **Bordeaux-Branding** wird in Memory als USP geführt – im aktuellen Onboarding ist es nur dezent sichtbar. Phase 10 (Design-Pass) ist im v3-Plan bewusst nach hinten geschoben, also in Phase 1 nur Mini-Korrekturen, keine Designwelle.

## 6. Was nach Freigabe passiert

Sobald Frank diesen Plan freigibt, wechsle ich in den Build-Modus und mache **nur** die unter Punkt 1 genannten Doku-Schritte:

1. `.lovable/plan.md` durch v3 ersetzen, alten Plan archivieren
2. `.lovable/phase-1-checkliste.md` anlegen
3. `roadmap-v3.md` + `roadmap-v3.pdf` nach `/mnt/documents/` schreiben (Bordeaux-Header)
4. Kurzbericht: was geändert, wo abgelegt, Phase 1 als Nächstes, voraussichtlich betroffene Dateien, Risiken (s. oben)

**Phase 1 wird in diesem Schritt noch nicht gebaut.** Erst nach deiner Bestätigung der Doku starten wir Phase 1a (Onboarding v1) und danach Phase 1b (Admin-Preview) als separate, kleine Umsetzungs-Schritte.
