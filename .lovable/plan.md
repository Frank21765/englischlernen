
# Fahrplan: Vom MVP zum pädagogisch wertvollen Lernsystem

## Leitidee
Bestehende App **nicht neu bauen**. Pädagogisches Rückgrat schichtweise einziehen. Jede Phase liefert ein sichtbares Ergebnis. Datenmodell von Anfang an so, dass Onboarding, Lernkompass und Mastery sauber andocken können — ohne dass wir vorher 6 Wochen blind im Backend wühlen.

---

## 5 Leitplanken (verbindlich, gelten für alle Phasen)

1. **Onboarding ist sichtbar, nicht nur Datenfundament.** Phase 1 darf schlank bleiben, aber neue Nutzer werden perspektivisch durch eine kurze Startdiagnose geführt: Ziel → Selbsteinschätzung → Interessen → empfohlenes Startlevel → erste Lernspur. Das Onboarding-UI ist Teil von Phase 1, bevor Phase 2 freigegeben wird.

2. **A1–B2 von Anfang an als vollständiger Levelrahmen.** A1/A2 dürfen zuerst stärker kuratiert sein, aber B1/B2 werden technisch nicht „später angebaut". Alle Tabellen, Filter, Level-Felder und UI-Strukturen sind von Anfang an A1–B2-fähig (C1/C2 bleiben Option für später).

3. **Echte Inhalte testbar ab Phase 3.** Nicht bis Phase 8 warten. Ab Phase 3 mit 2–3 Seed-Lektionen arbeiten: A1 *Daily Routine*, A2 *Travel / Past Simple*, B1 *Work Conversation*. So testen wir früh, ob Lessons, Micro Goals, Grammar, SRS und Mastery wirklich zusammenspielen.

4. **Übungsrichtungen für deutsche Lerner.** V1 unterstützt **Deutsch → Englisch**, **Englisch → Deutsch** und **gemischt**. Beide Richtungen sind pädagogisch nötig (passives Verstehen vs. aktives Abrufen). Bei jedem `learning_event` wird die tatsächlich geübte Richtung mitgeloggt — Basis dafür, später zu erkennen, ob jemand ein Wort nur passiv versteht.

5. **Architektonische Erweiterbarkeit für andere Sprachrichtungen.** V1 bleibt klar Englisch lernen für deutsche Muttersprachler. Aber das Datenmodell wird **nicht** hart auf eine Lernrichtung festgenagelt. Felder `source_language`, `target_language`, `explanation_language`, `exercise_direction` (Werte: `source_to_target`, `target_to_source`, `mixed`) sind ab jetzt im Schema. Das öffnet keine neue Baustelle, blockiert aber spätere Sprachvarianten nicht.

**Schema-Status (nach Phase 1 + Sprachrichtungs-Migration):**
- `profiles`: `source_language='de'`, `target_language='en'`, `explanation_language='de'`, `exercise_direction='mixed'` (Defaults). Altes `direction_mode` koexistiert.
- `vocabulary`: `source_language`, `target_language` ergänzt.
- `learning_events`: `source_language`, `target_language`, `exercise_direction` werden bei jeder Übung mitgeschrieben.
- `ngsl_words`: bleibt vorerst englisch-zentriert. Eine allgemeinere `lexicon`-Tabelle ist Option für später, **jetzt nicht** als Baustelle öffnen.

**Architektur-Schichten (unten → oben):**

```text
   ┌────────────────────────────────────────────┐
   │  UI: Lernkompass + Weiter-Button + Übungen │  ← sichtbares Ergebnis
   └────────────────────────────────────────────┘
                      ▲
   ┌────────────────────────────────────────────┐
   │  Mastery Records / Review Queue            │  Phase 6+7
   └────────────────────────────────────────────┘
                      ▲
   ┌────────────────────────────────────────────┐
   │  Grammar Patterns                          │  Phase 5
   └────────────────────────────────────────────┘
                      ▲
   ┌────────────────────────────────────────────┐
   │  Micro Goals (Lernziele)                   │  Phase 4
   └────────────────────────────────────────────┘
                      ▲
   ┌────────────────────────────────────────────┐
   │  Lessons (Container für Aufgaben)          │  Phase 3
   └────────────────────────────────────────────┘
                      ▲
   ┌────────────────────────────────────────────┐
   │  Universelle SRS + NGSL-Pool               │  Phase 2 (läuft schon teilweise)
   └────────────────────────────────────────────┘
                      ▲
   ┌────────────────────────────────────────────┐
   │  Onboarding-Profil + Diagnose-Felder       │  Phase 1
   └────────────────────────────────────────────┘
```

---

## Phase 1 — Onboarding-Profil und Diagnose-Felder (Datenfundament)

**Ziel:** Bevor wir SRS und Lektionen ausbauen, schaffen wir die Felder, auf denen der Lernkompass später entscheidet. Onboarding-UI bleibt wie es ist (oder schlankes Update), aber das Datenmodell wird zukunftsfest.

**Migrationen:**
- `profiles` erweitern um:
  - `learning_goal` text (Alltag / Reisen / Prüfung / Arbeit / freies Lernen)
  - `self_assessment` text (Anfänger / etwas Erfahrung / unsicher / fortgeschritten)
  - `interests` text[] (z. B. ['Technik','Sport','Reisen'])
  - `recommended_level` text (vom System vorgeschlagen, kann sich vom `default_level` unterscheiden)
  - `weekly_minutes_goal` int (default 30)
  - `last_compass_update` timestamptz
- Neue Tabelle `diagnostic_results`:
  - `user_id`, `area` (vocab / grammar / listening), `score` int, `cefr_estimate` text, `taken_at`
- Neue Tabelle `learning_events` (Universelles Logbuch — Basis für Lernkompass und Schwächen-Erkennung):
  - `user_id`, `event_type` (vocab_correct / vocab_wrong / grammar_correct / grammar_wrong / lesson_completed / review_done)
  - `object_type` (vocabulary / grammar_pattern / lesson / micro_goal)
  - `object_id` uuid
  - `metadata` jsonb (z. B. Fehlerkategorie, Antwortzeit, Kontext)
  - `created_at`

**Sichtbares Ergebnis:** Noch keins in der UI — aber im Hintergrund schreiben alle bestehenden Übungen ab dieser Phase Events. Damit haben wir ab sofort echte Daten für später.

---

## Phase 2 — Universelle SRS + NGSL-Pool (Fortsetzung der angefangenen Phase 5)

**Ziel:** SRS so umbauen, dass sie **objekt-agnostisch** funktioniert — nicht nur für Vokabeln. Sonst bauen wir sie in Phase 5 nochmal um.

**Migrationen:**
- Neue Tabelle `review_items` (universelle Wiederholungs-Karte):
  - `user_id`, `object_type` (vocabulary / grammar_pattern / chunk / irregular_verb)
  - `object_id` uuid
  - `correct_count`, `wrong_count`, `interval_days`, `ease_factor`, `status`, `last_seen_at`, `next_review_at`
  - Unique-Index auf `(user_id, object_type, object_id)`
- `vocabulary` SRS-Felder bleiben bestehen — wir migrieren später schrittweise nach `review_items` (oder lassen Vokabeln dort, da es schon läuft). Entscheidung in Phase 6.

**Code:**
- `src/lib/srs.ts` bleibt — bekommt aber `applyReview(objectType, objectId, isCorrect)` als zentrale Schreibfunktion.
- `useReviewQueue(level, topic, limit)` Hook — lädt fällige Karten aus `review_items` + `vocabulary`.
- Quiz, Wortpuzzle, Lückentext, Lektion: Treffer/Fehler → `applyReview`.
- NGSL-Pool wird in Quiz und Vokabeln nutzbar: „Aus Wortliste hinzufügen" + automatisches Auffüllen wenn Topic-Pool leer.

**Audio:**
- `src/lib/tts.ts` mit Web Speech API (en-GB / de-DE).
- `<SpeakButton>` neben Wörtern in Quiz, Vokabeln, Lektion, Wortpuzzle.
- Setting „Aussprache automatisch abspielen".

**Sichtbares Ergebnis:** Quiz priorisiert fällige Karten. Vokabel-Status zeigt echten SRS-Stand. Lautsprecher-Icons funktionieren. NGSL-Pool füllt sich mit echten Wörtern (Du importierst parallel mit Grok).

---

## Phase 3 — Lessons-Struktur (Container)

**Ziel:** Lektionen werden ein eigenes Datenobjekt — nicht mehr im Code hardcodiert.

**Migrationen:**
- Tabelle `lessons`:
  - `id`, `slug`, `title_de`, `title_en`, `level`, `topic`, `kind` (core / theme / grammar / user)
  - `position` int (für Reihenfolge im Kernpfad)
  - `description_de`, `estimated_minutes`
  - `source` (curated / ai_generated)
  - `published` bool
  - `created_by` uuid (NULL = systemkuratiert)
- Tabelle `lesson_tasks`:
  - `lesson_id`, `position`, `task_type` (vocab_recognize / vocab_recall / cloze / sentence_build / listening / speaking / mc_grammar)
  - `payload` jsonb (Frage, Antworten, Hints, Audio-URL etc.)
  - `target_object_type`, `target_object_id` (verknüpft mit Vokabel oder Grammatikmuster — für Mastery-Tracking)
- Tabelle `user_lesson_progress`:
  - `user_id`, `lesson_id`, `status` (not_started / in_progress / completed / mastered_provisional / mastered_stable)
  - `score` int, `last_position` int, `started_at`, `completed_at`
  - **Wichtig:** `last_position` ist die Basis für „Weiter machen → unfertige Lektion".

**Code:**
- Bestehende `Lektion.tsx` umbauen, sodass sie aus `lessons` + `lesson_tasks` rendert.
- Bestehende Lektions-Hardcodes (in `src/lib/lessons.ts`) als ersten Seed in die DB überführen.

**Sichtbares Ergebnis:** Lektionen kommen aus der DB. Fortschritt wird gespeichert. „Weiter machen"-Button (erste Stufe: nur unfertige Lektion fortsetzen) funktioniert auf der Startseite.

---

## Phase 4 — Micro Goals (Lernziele)

**Ziel:** Jede Lektion und jede Aufgabe bekommt klare Mikroziele. Damit kann Mastery später *pro Lernziel* gemessen werden — nicht nur pro Lektion.

**Migrationen:**
- Tabelle `micro_goals`:
  - `id`, `slug`, `description_de`, `level`, `category` (vocab / grammar / function / listening / speaking)
  - `success_criterion` text (z. B. „kann 8 von 10 Routine-Verben im Present Simple korrekt einsetzen")
- Tabelle `lesson_micro_goals` (n:m): `lesson_id`, `micro_goal_id`, `weight` (0.0–1.0)
- Tabelle `task_micro_goals` (n:m): `task_id`, `micro_goal_id` (welche Aufgabe zahlt auf welches Ziel ein)
- Tabelle `user_micro_goal_progress`:
  - `user_id`, `micro_goal_id`, `correct_count`, `wrong_count`, `mastery_score` real, `status`

**Sichtbares Ergebnis:** Lektion-Abschluss zeigt erstmals: „Du hast diese 3 Lernziele gestärkt." Lernkompass kann jetzt Lücken pro Mikroziel anzeigen.

---

## Phase 5 — Grammar Patterns

**Ziel:** Grammatik wird ein vollwertiges Lernobjekt (mit eigener SRS-Karte über `review_items`).

**Migrationen:**
- Tabelle `grammar_patterns`:
  - `id`, `slug`, `title_de`, `level`, `category` (tense / question / negation / preposition / pronoun ...)
  - `rule_short_de` text, `rule_long_de` text
  - `examples` jsonb (Array aus {en, de, hint})
  - `common_mistakes` jsonb (für Fehlerdiagnose)
- Tabelle `lesson_grammar_patterns` (n:m, mit primary flag)

**Code:**
- Grammar.tsx liest aus DB.
- Drei Zugänge: explizite Lektion (Grammar-Pattern als Lektion), eingebettet (Theme-Lektion mit Pattern-Tag), frei (Grammatik-Studio mit Pattern-Wahl).
- Alle drei Zugänge schreiben auf dieselben `review_items` und `user_micro_goal_progress`.

**Sichtbares Ergebnis:** Grammatik-Studio mit echten Pattern-Daten, freie Wahl à la „Was möchtest du heute üben?".

---

## Phase 6 — Mastery Records (4-Zustände-System)

**Ziel:** Aus rohen Korrekt/Falsch-Daten werden ehrliche Mastery-Aussagen.

**Logik (kein neues Schema nötig — wir nutzen `review_items`, `user_lesson_progress`, `user_micro_goal_progress`):**
- 4 Zustände: `new` → `learning` → `mastered_provisional` → `mastered_stable`
- Lektion wird **provisional** bei: ≥85 % gesamt (A1/A2) bzw. ≥80 % (B1/B2) **UND** mind. 70 % je Mikroziel **UND** mind. eine produktive Aufgabe richtig.
- Lektion wird **stable** wenn: nach 3–7 Tagen ein verzögerter Re-Check besteht.
- Theme-Mastery: alle Pflichtlektionen des Themas im Status `mastered_stable`.

**Code:**
- `src/lib/mastery.ts` — pure Funktionen für Status-Berechnung.
- Recompute-Trigger: nach jedem Lesson-Completion und nach jedem Review.
- Verzögerter Re-Check: erscheint automatisch in der Review-Queue 5 Tage nach `provisional`.

**Sichtbares Ergebnis:** Lektionen zeigen 4 Status-Stufen. Vokabeln zeigen ehrlich „vorläufig gemeistert" vs. „stabil gemeistert".

---

## Phase 7 — Lernkompass + Weiter-Button (volle Logik)

**Ziel:** Jetzt erst können wir den Lernkompass mit echten Daten füllen.

**Frontend:**
- Neue Komponente `LernKompass` auf der Startseite (oder ersetzt einen Teil davon):
  - **Wo stehst du?** — Level-Fortschritt + aktive Themen
  - **Heute fällig** — Anzahl Reviews, geschätzte Minuten
  - **Stabil sitzt** — Liste/Anzahl gemeisterter Themen
  - **Noch unsicher** — Top 3 schwächste Mikroziele (aus `user_micro_goal_progress`)
  - **Nächster Schritt** — der Weiter-Button mit Begründung
- **Weiter-Button-Logik** (in dieser Reihenfolge):
  1. `user_lesson_progress.status = 'in_progress'` → unfertige Lektion fortsetzen
  2. `review_items` mit `next_review_at < now()` und `priority = high` → fällige Wiederholung
  3. Schwächstes Mikroziel mit `mastery_score < 0.5` → gezielte Übung
  4. Nächste Lektion im aktiven Thema (per `position`)
  5. Empfohlene Kernlektion (wenn 3+ Tage nur freie Übungen)

**Onboarding-Anbindung:**
- Onboarding-Werte aus Phase 1 (`learning_goal`, `interests`, `recommended_level`) bestimmen jetzt:
  - welche Themen als „aktiv" markiert werden
  - welche erste Lektion vorgeschlagen wird
  - welche Diagnose-Schwächen zuerst priorisiert werden

**Sichtbares Ergebnis:** Die App fühlt sich „wach" an. Nutzer öffnen sie und sehen ruhig: hier stehst du, das ist heute dran.

---

## Phase 8 — Hybrid-Lektionsinhalte: Kernpfad + AI-Themen

**Ziel:** Inhalt füllen.

- **A1/A2-Kernpfad hand-kuratiert** (du, ich und Alex): ~20–30 Lektionen mit klaren Mikrozielen, Grammatik-Basics. Wir arbeiten thematisch durch.
- **Themenlektionen AI-generiert** mit festem Schema:
  - Edge Function `generate-lesson` mit Pflicht-Input: level, topic, micro_goal_ids, target_vocab_ids, grammar_pattern_id, task_count, exercise_types
  - Output landet als `lessons` + `lesson_tasks`-Datensatz mit `source='ai_generated'`
  - Du/Admin kannst editieren, freischalten oder ablehnen
- Keine Live-Generierung als Standard — generierte Lektionen sind speicherbar und reviewbar.

---

## Phase 9 — Fehlerkategorien + Schwächen-Erkennung

**Ziel:** Aus `learning_events.metadata` echte Fehler-Diagnostik machen.

- Fehlerkategorien (vorerst grob): `wrong_word`, `wrong_form`, `wrong_word_order`, `listening_confusion`, `de_en_interference`, `irregular_verb_form`
- Bei jedem falschen Antwort-Event tagged die Übung (oder die Edge Function) den Fehler.
- Lernkompass zeigt: „Du verwechselst aktuell oft Past Simple mit Present Perfect."
- Review-Queue priorisiert dann passende Übungen.

---

## Phase 10 — Finaler Design-Pass

**Erst jetzt** — wenn das pädagogische Rückgrat steht — gehen wir das Design ganzheitlich durch. Bordeaux-Akzente, Typografie, Spacing, Lesefluss, Premium-Politur. Vorher nur Mini-Korrekturen wo nötig.

---

## Was wir bewusst NICHT in V1 bauen

- Keine Social-Features
- Keine Leaderboards
- Keine schwere Animation
- Kein Spracherkennungs-Speaking (TTS reicht für V1, STT kommt später)
- Keine zusätzlichen Sprachen außer Deutsch ↔ Englisch
- Keine vollständige AI-Personalisierung (Mastery + SRS reichen)

---

## Reihenfolge & Sichtbarkeit

| Phase | Inhalt | Sichtbar nach Phase |
|-------|--------|---------------------|
| 1 | Onboarding-Felder + Event-Log | Schlankes Onboarding / Startdiagnose vorbereitet bzw. sichtbar ergänzt + Event-Log im Hintergrund |
| 2 | Universelle SRS + NGSL + Audio | Quiz priorisiert, Lautsprecher, NGSL-Wörter |
| 3 | Lessons-Container | „Weiter machen" funktioniert minimal |
| 4 | Micro Goals | Lektionsabschluss zeigt Lernziele |
| 5 | Grammar Patterns | Grammatik-Studio mit echten Inhalten |
| 6 | Mastery 4-Zustände | Ehrliche Status-Anzeige |
| 7 | Lernkompass + voller Weiter-Button | App fühlt sich „wach" an |
| 8 | Kernpfad-Inhalte + AI-Themen | App ist inhaltlich gefüllt |
| 9 | Fehlerkategorien | Diagnose wird konkret |
| 10 | Design-Pass | Premium-Look final |

---

## Was Otto nach jeder Phase macht

1. Migration ausführen (mit deiner Bestätigung)
2. Code-Änderungen umsetzen
3. Kurzbericht: was geändert, was du jetzt testen kannst, was als Nächstes ansteht
4. Du testest, gibst Feedback, dann nächste Phase

---

## Was sich gegenüber dem alten Phase-5-Plan ändert

- Der angefangene Phase-5-Plan (NGSL + SRS für Vokabeln) **wird Teil der neuen Phase 2** — nichts ist verloren. Die Migration für `ngsl_words` ist schon durch.
- SRS wird aber **objekt-agnostisch** gebaut (mit `review_items`), nicht nur für Vokabeln — sonst bauen wir sie später nochmal um.
- Vor allem anderen kommt Phase 1 (Onboarding-Felder + Event-Log), damit ab sofort jede Übung Daten für den Lernkompass sammelt.

---

## Was du parallel weiter machst

- Mit Grok: NGSL-Übersetzungen in `ngsl_words` importieren (Schema steht schon).
- Mit Alex: A1/A2-Kernlektions-Inhalte vorbereiten (kommt in Phase 8 zum Einsatz).
- Mit mir: Phase für Phase abarbeiten.

---

## Lieferform nach Plan-Freigabe

Nach deiner Freigabe liefere ich diesen Fahrplan als **PDF + MD** ins Documents-Verzeichnis (Bordeaux-Header), damit du ihn mit Alex und Grok teilen kannst.

Danach schließen wir **Phase 1** mit Onboarding-UI und Sprachrichtungs-Migration ab.

---

## Backlog (nicht in aktueller Phase, terminiert nach Phase 1-Nacharbeit)

- **Admin-Onboarding-Preview** — Als Admin das gesamte Onboarding jederzeit ansehen/durchklicken können, auch wenn das eigene Onboarding bereits abgeschlossen ist. Idealerweise als Preview/Testmodus (Read-only oder mit `?preview=1`-Flag), der nichts in das echte Profil schreibt. Ziel: Onboarding-UI prüfen ohne neuen Test-Account anlegen zu müssen. **Priorität: nach aktueller Phase-1-Nacharbeit, vor Phase 2-Abschluss.**

