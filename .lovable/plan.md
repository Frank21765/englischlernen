# Fahrplan v3 — Englisch-LernApp

**Stand:** 30.04.2026
**Beta-Fokus:** „Englisch wieder reinkommen" — für erwachsene deutsche Lerner mit eingerostetem Schulenglisch (A2/B1 bis B2).
**Tonalität:** ruhig, seriös, erwachsen. Keine bunte Duolingo-Kopie. Grammatik, Wiederholung, klare Lernführung, echter Fortschritt.

> Vorgängerversion: `.lovable/plan-v2-archiv.md`.

---

## Leitidee v3

Nicht sofort alles für A1–B2 bauen. Nicht zuerst ein riesiges Lern-Betriebssystem bauen.
Stattdessen einen **fokussierten, substanzreichen Beta-Slice**:

```text
Onboarding
  → empfohlener Startpunkt
    → echte erste Lektion
      → Abschluss
        → sinnvoller nächster Schritt
          → Wiederholung am Folgetag
            → Nutzer kommt zurück
```

**Beta-Versprechen:**
„Bring dein Englisch wieder in Ordnung. Ruhig, klar, mit Grammatik, Wiederholung und einem sinnvollen nächsten Schritt."

---

## Phase 1 — Sichtbares Onboarding v1 + Admin-Preview

**Ziel:** Neuer Nutzer findet in kurzer Zeit einen sinnvollen Startpunkt. Admin kann den Onboarding-Ablauf jederzeit ansehen und beliebig oft testweise durchspielen, ohne sein eigenes Konto zurückzusetzen und ohne echte Nutzerdaten zu verändern.

### Nutzer-Onboarding v1 (5 Screens)

**Screen 1 — Einstieg**
- „In einer Minute finden wir deinen sinnvollen Startpunkt."
- „Kein Teststress. Du kannst deinen Startpunkt später ändern."

**Screen 2 — Zielwahl**
„Wofür willst du Englisch gerade am meisten nutzen?"
- Englisch auffrischen
- Grammatik sicherer werden
- Englisch für Beruf & Alltag
- Reisen und Alltag
- Wortschatz erweitern

**Screen 3 — Selbsteinschätzung**
„Was passt im Moment am ehesten auf dich?"
- Ich brauche einen eher leichten Neustart.
- Ich hatte mal Schulenglisch und komme mit Hilfe wieder rein.
- Ich verstehe einiges, bin aber bei Satzbau und Zeiten unsicher.
- Ich komme im Alltag meist zurecht, will aber sicherer werden.

**Screen 4 — Mini-Check (3–5 Aufgaben)**
„Ein paar kurze Aufgaben, damit du nicht zu leicht oder zu schwer startest."
Beispiele:
- „I missed the train." → passende deutsche Bedeutung
- „She ___ work here." → doesn't / don't / isn't
- „Yesterday we ___ to Berlin." → went / go / gone
- „often / I / coffee / drink" → richtige Reihenfolge
- „I am good ___ English." → at / in / on

Keine rote Fehlerdramaturgie. Keine Note. Keine Prozentzahl. Kein Prüfungsgefühl.

**Screen 5 — Ergebnis**
- „Empfohlener Start: Wiedereinstieg A2/B1"
- „Du verstehst einfache Sätze gut. Bei Satzbau und Verbformen lohnt sich ein kurzer Neustart."
- „Dein erster Schritt: Alltag & Present Simple auffrischen"
- Buttons: **Mit dieser Lektion starten** / **Startpunkt ändern**
- Ton: „Wir empfehlen dir …" — niemals „Du bist eindeutig B1."

### Admin-Preview (Testmodus)
- Im Adminbereich Button/Menüpunkt **„Onboarding testen"**.
- Öffnet den vollständigen Onboarding-Flow im **Testmodus**.
- Klar als Testmodus erkennbar (Banner/Badge).
- Beliebig oft neu startbar.
- Schreibt **nichts** in das echte Profil.
- Speichert keine Empfehlung dauerhaft.
- Zeigt am Ende, welche Empfehlung aus den Testantworten entstehen würde, inkl. empfohlener Startlektion.

### Schlanke Phase-1-Events
`onboarding_started`, `onboarding_completed`, `recommendation_shown`, `first_lesson_started`, `first_lesson_completed`. Keine personenbezogenen Daten darüber hinaus. Im Preview-Modus werden keine Events geschrieben.

### Nicht in Phase 1
Alter, Beruf, Firma, Standort, IP-Auswertung, Freitextfelder, Interessen-Katalog, Listening-Test, Speaking-Test, KI-Einstufung, großes Analytics-Dashboard.

### Erfolgskriterium
Nutzer schließt Onboarding ab → bekommt sinnvolle Empfehlung → echte Startlektion wird angeboten → Admin kann den Flow jederzeit im Testmodus durchspielen, ohne echte Daten zu verändern.

---

## Phase 2 — Lektionssystem aus der Datenbank

**Ziel:** Lektionen als echte Datenobjekte pflegen und nutzen.

Gebaut wird:
- DB-Struktur für Lektionen
- Aufgaben innerhalb von Lektionen
- Reihenfolge der Aufgaben
- Lektionsstatus
- Fortschritt speichern, starten, fortsetzen, abschließen

Eine Lektion braucht mindestens: Titel, kurze Beschreibung, Niveau/Startbereich, Ziel, Aufgabenliste, Abschlussstatus, empfohlener nächster Schritt.

**Nicht in Phase 2:** komplexes Mastery-System, detaillierte Fehlerdiagnose, KI-Lektionen, öffentliches Content-System, große Admin-Redaktion.

---

## Phase 3 — Erster kuratierter Beta-Lernpfad

**Ziel:** Echte Substanz. Pfad „Englisch wieder reinkommen", 10–15 Lektionen, ca. 2 Wochen Nutzung.

Beispiel-Lektionen:
1. Wieder reinkommen: einfache Sätze verstehen
2. Alltagssätze sicher bilden
3. Present Simple auffrischen
4. Fragen mit do und does
5. Verneinung mit don't und doesn't
6. Häufige Alltagsverben
7. Wortstellung im englischen Satz
8. Past Simple Einstieg
9. Unregelmäßige Verben: go, have, make, take, get
10. Typische Fehler deutscher Lerner
11. Alltag & Beruf: kurze Gespräche
12. Mini-Review: Was sitzt schon?
13. Present Perfect als Ausblick
14. Satzbau-Training
15. Abschluss: Dein Wiedereinstieg

**Nicht in Phase 3:** komplette A1–B2-Abdeckung, alle Themenwelten, freie eigene Themen, Business-English-Vollmodul, große Idioms-/False-Friends-/Phrasal-Verbs-Module.

---

## Phase 4 — Grammatik v1

**Ziel:** Grammatik früh sichtbar als Unterscheidungsmerkmal.

Gebaut wird:
- Grammatikmuster als eigene Inhalte
- kurze deutsche Erklärung, englische Beispiele, typische Fehler
- passende Übungen, Verknüpfung mit Lektionen
- kleines Grammatikstudio

Erste Muster: Present Simple, Fragen mit do/does, Verneinung mit don't/doesn't, Past Simple, unregelmäßige Verben Einstieg, Wortstellung, some/any oder much/many, Present Perfect als Ausblick.

Grammatikstudio v1 — „Was möchtest du üben?": Zeiten auffrischen, Fragen bilden, Verneinung, Satzbau, unregelmäßige Verben.

**Nicht in Phase 4:** komplette Grammatikbibliothek, B2-Feinheiten, KI-Grammatikerklärungen live, lange Theorieartikel.

---

## Phase 5 — Continue-Button v1

**Ziel:** Nutzer weiß immer, was als Nächstes sinnvoll ist.

Logik in Reihenfolge:
1. offene Lektion fortsetzen, wenn vorhanden
2. empfohlene Startlektion öffnen, wenn Onboarding abgeschlossen
3. nächste Lektion im Beta-Pfad
4. später: fällige Wiederholung

Button-Texte je nach Zustand: Weiter machen / Deine erste Lektion starten / Lektion fortsetzen / Nächste Lektion starten / Kurze Wiederholung machen.

**Nicht in Phase 5:** komplexe Schwächenanalyse, Top-3-Risiken, KI-Entscheidungslogik, Lernkompass-Vollausbau.

---

## Phase 6 — Review/SRS v1

**Ziel:** Sinnvolle Wiederholung.

Umfang: nur zwei Objektarten — Vokabeln/Chunks und Grammatikmuster.
Einfache Logik: nach 1 Tag, 3 Tagen, 7 Tagen; später adaptiv.
Aufgaben: Bedeutung erkennen, Lückensatz, Satz vervollständigen, kurze Übersetzung, Grammatikform wählen.

**Nicht in Phase 6:** universelles SRS für alle Objektarten, Idioms, Phrasal Verbs, eigene Themen, komplexe Gewichtung, KI-Reviews.

---

## Phase 7 — Micro Goals light

**Ziel:** Klare Lernziele ohne komplexes Zielsystem.

Jede Lektion: 1 Hauptziel + max. 2 Nebenziele. Jede Aufgabe zahlt auf genau ein Ziel ein.

**Nicht in Phase 7:** gewichtete Ziele, komplexe N:M-Zuordnungen, voller Kompetenzgraph, automatische Zielanalyse.

---

## Phase 8 — Mastery light

**Ziel:** Ehrlicher Fortschritt als nur „abgeschlossen".

Zustände v1: `new`, `learning`, `provisional mastered`. „stable mastered" kommt später (Phase 12).

**Nicht in Phase 8:** voller Vier-Zustände-Ausbau, detaillierte Kompetenzwerte, komplexe Ableitungen aus allen Aufgaben.

---

## Phase 9 — Lernkompass v1

**Ziel:** Einfacher, ehrlicher Überblick.

Inhalte: aktueller Startbereich, aktueller Lernpfad, offene Lektion, fällige Wiederholungen, nächste Grammatikempfehlung, kleiner Fortschritt.

Tonalität: nicht „Du bist 67,4 % B1.", sondern „Du bist im Wiedereinstieg A2/B1. Dein nächster sinnvoller Schritt ist eine kurze Wiederholung zu Present Simple."

**Nicht in Phase 9:** riesiges Dashboard, Schwächen-Ranking, Prognosen, Level-Zertifikate, KI-Coach-Kommentare.

---

## Phase 10 — Beta-Analytics light

**Ziel:** Prüfen, ob der Kern funktioniert. Keine Überwachung — Produktprüfung.

Metriken: Onboarding gestartet/abgeschlossen, erste Lektion gestartet/abgeschlossen, Continue-Button geklickt, Review gemacht, Rückkehr nächster Tag, Rückkehr nach 7 Tagen, Abbruchstellen, einfache Feedbackmöglichkeit.

**Nicht in Phase 10:** persönliche Profile, Berufsdaten, Alter, Standort, IP-Auswertung, komplexe Segmentierung.

---

## Phase 11 — Monetarisierung und Launch-Readiness

Gebaut/vorbereitet: Monatsabo, Jahresabo, Trial-Entscheidung, Paywall, Entitlements, Restore Purchases, Datenschutz, Account-Löschung, Support-Kanal, FAQ, Landingpage, App-Store-Texte, Screenshots, klare Claims.

**Nicht in Phase 11:** aggressive Sales-Funnels, versteckte Kündigungswege, manipulative Paywalls, Verlustdruck.

---

## Phase 12 — Ausbau nach Beta

Möglich nach Beta: stable mastered, detailliertere Fehlerdiagnose, KI-Hilfe für Erklärungen, KI-gestützte Content-Erstellung intern, eigene Themen, Business-English-Modul, Reise-Modul, False Friends, Idioms, Phrasal Verbs, Speaking/STT, Listening-Ausbau, breitere A1–B2-Abdeckung, weitere Lernpfade, bessere Admin-Content-Verwaltung.

---

## Parkliste (bewusst nicht in v1)

- Live-AI-Lektionen für Nutzer
- freie KI-Themen ohne Kontrolle
- öffentlich geteilte Nutzerinhalte
- Speaking-Bewertung
- komplexe Fehlerdiagnose
- vollständiger Kompetenzgraph
- komplette CEFR-Zertifikatslogik
- Social Features
- Leaderboards
- Gamification-Ökonomie
- B2B-Dashboard
- weitere Sprachen

---

## Prioritäten

### Muss vor geschlossener Beta
1. Onboarding v1
2. Admin-Preview fürs Onboarding
3. Erste echte Startlektion
4. Lektionssystem aus Datenbank
5. 10–15 kuratierte Beta-Lektionen
6. Grammatik v1
7. Continue-Button v1
8. Review/SRS v1
9. Einfache Fortschrittslogik
10. Einfache Beta-Messung
11. Datenschutz-Grundlagen
12. RLS / Zugriffsschutz

### Muss vor öffentlichem Launch
1. Lernkompass v1
2. Paywall/Abo-System
3. Datenschutz sauber
4. Account-Löschung
5. Support-Kanal
6. App-Store-Texte
7. Landingpage
8. FAQ
9. Stabile Reviews
10. Fehlertracking
11. Erste Nutzerbewertungen/Teststimmen

### Nach Launch
1. Mastery-Ausbau
2. Mehr Inhalte
3. Mehr Grammatik
4. Bessere Review-Logik
5. KI-Unterstützung kontrolliert
6. Eigene Themen light
7. Erste Spezialmodule

### Später
1. Speaking
2. Komplexe KI
3. Fehlerdiagnose
4. Business/B2B
5. Internationale Ausweitung
6. Vollständige CEFR-Abdeckung

---

## Technische Hinweise (verbindlich für alle Phasen)

- Onboarding-Antworten, Button-Texte, App-Claims und Labels in **zentralen Konstanten** halten — nicht tief in Komponenten verstecken. Ziel: jederzeit leicht änderbar.
- App-Name, Icon und sichtbare Branding-Elemente **nicht hart in der Logik** verankern.
- Keine großen Rebuilds.
- Bestehende Funktionen nicht beschädigen.
- Änderungen in kleinen, überprüfbaren Schritten umsetzen.
- Roadmap so dokumentieren, dass aus jeder Phase später ein einzelner Umsetzungs-Prompt entstehen kann.

---

## Lieferform

Dieser Plan liegt im Repo unter `.lovable/plan.md` und zusätzlich als **PDF + MD** im Documents-Verzeichnis (`/mnt/documents/roadmap-v3.pdf` + `roadmap-v3.md`) zum Teilen mit Alex und Perplexity. Vorgänger-Plan: `.lovable/plan-v2-archiv.md`.
