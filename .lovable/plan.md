# Phase 5 — NGSL-Vokabelpool, SRS-Engine, Audio

## Ziel der Phase

Aus der App wird ein echtes Lerninstrument: ein gemeinsamer Wortschatz-Pool (NGSL ~2.800 Wörter), ein SRS-Algorithmus, der fällige Karten priorisiert, und Aussprache per Web Speech API. Alles bestehende (Quiz, Wortpuzzle, Lückentext, Grammar, Lektionen, Coach Ellie, Vokabeln-Seite) bleibt funktional und nutzt den neuen Pool transparent.

## Was sich ändert (Überblick)

```text
                ┌──────────────────────────┐
                │  ngsl_words (global pool)│  ← NEU: ~2.800 Wörter, von dir/Grok importiert
                │  read-only für alle User │
                └─────────────┬────────────┘
                              │ Auswahl nach Level + Topic
                              ▼
   ┌─────────────────────────────────────────────────────┐
   │  vocabulary (pro User)                              │  ← bleibt, leicht erweitert
   │  + source: 'ngsl' | 'manual' | 'ai'                 │
   │  + ngsl_id (FK, nullable)                           │
   │  + Index auf next_review_at                         │
   └────────┬────────────────────┬──────────────────────┘
            │                     │
            ▼                     ▼
   ┌──────────────────┐   ┌──────────────────────────┐
   │  Übungen         │   │  Review-Queue (SM-2)     │
   │  Quiz/Puzzle/... │──▶│  „Fällige Karten zuerst" │
   └──────────────────┘   └──────────────────────────┘
            │
            ▼
   computeNextReview() pro Antwort  →  vocabulary.next_review_at, ease, interval
```

## 1. Datenbank — neue Tabelle `ngsl_words`

**Migration:**
- `ngsl_words` (read-only Pool, public select):
  - `id` uuid PK
  - `rank` int (NGSL-Frequenzrang, 1–2800)
  - `english` text not null (Lemma)
  - `german` text not null (deutsche Übersetzung — füllt Grok)
  - `pos` text (part of speech: noun/verb/adj/...)
  - `cefr_level` text ('A1'..'B2') — abgeleitet aus Frequenzrang
  - `topics` text[] (z. B. ['Alltag','Arbeit'] — optional, wo zuordenbar)
  - `example_en` text, `example_de` text (optional)
  - `created_at` timestamptz default now()
  - Index: `(cefr_level, rank)`, GIN auf `topics`
- RLS: nur **SELECT** für authentifizierte User (kein insert/update/delete vom Client).
- `vocabulary`-Tabelle erweitern:
  - `source` text not null default `'ai'` — Werte: `ngsl` | `manual` | `ai`
  - `ngsl_id` uuid nullable, FK auf `ngsl_words(id)` on delete set null
  - Index: `(user_id, next_review_at)` für schnelle Review-Abfragen
  - Index: `(user_id, status)`

**Datenimport (machst du parallel mit Grok):**
- Ich liefere ein leeres `ngsl_words`-Schema und einen Import-Endpoint / SQL-Pattern. Du importierst die ~2.800 NGSL-Zeilen mit deutschen Übersetzungen. Für den Code reicht: Tabelle existiert, ein paar Beispielzeilen drin.

## 2. SRS-Engine vollständig verdrahten

`src/lib/srs.ts` existiert bereits (SM-2-Logik). Was fehlt:

- **Neuer Hook `useReviewQueue(level, topic, limit)`** in `src/hooks/useReviewQueue.tsx`:
  - Lädt fällige Karten: `next_review_at <= now()` ODER `next_review_at IS NULL` (neue Karten)
  - Sortierung: zuerst überfällige, dann neue, dann nach `interval_days` ASC
  - Default Limit: 20
- **Helper `applySrsResult(vocabId, isCorrect)`** in `src/lib/srs.ts`:
  - Liest aktuellen Stand, ruft `computeNextReview`, schreibt zurück nach `vocabulary`
  - Wird zentral verwendet — kein duplizierter Update-Code mehr
- **Übungen anschließen:**
  - `Quiz.tsx` (Vokabel-Modus): nach jedem `handlePick` → `applySrsResult`. Statt aller Karten zufällig, **erst Review-Queue**, dann Auffüllen aus Pool falls leer.
  - `Wortpuzzle.tsx`: nach Lösung → `applySrsResult` für das gepuzzelte Wort, falls es ein Vocabulary-Eintrag ist.
  - `Lueckentext.tsx`: dito für jede gefüllte Lücke, die einer Vocab entspricht.
  - `Lektion.tsx`: dito für trainierte Wörter.
  - `Vokabeln.tsx`: Statusbadges (`new` | `learning` | `mastered`) zeigen jetzt echten SRS-Stand; Filter „fällig heute" wird hinzugefügt.

## 3. NGSL-Pool in Übungen verfügbar machen

- Wenn ein User in `Quiz` „Neu starten" wählt und sein Pool für Level + Topic leer/klein ist, ziehen wir Karten aus `ngsl_words` (level + topic-match) und legen sie als `vocabulary`-Zeilen mit `source='ngsl'` und `ngsl_id` an. Kein AI-Call mehr nötig wenn Pool reicht.
- Fallback (NGSL-Pool für Topic leer): wie bisher per `generate-vocabulary`-Edge-Function. So gibt es keinen Bruch während des Imports.
- Auf `Vokabeln.tsx` neuer Block **„Aus Wortliste hinzufügen"**: zeigt 10 NGSL-Wörter zum aktuellen Level/Topic, die der User noch nicht hat — ein Klick speichert.

## 4. Audio per Web Speech API

- Neuer Helper `src/lib/tts.ts`:
  - `speak(text, lang)` mit `SpeechSynthesisUtterance`
  - Sprach-Auswahl: `en-GB` für englische Wörter, `de-DE` für deutsche
  - Stimme cachen (Voices laden async)
  - Graceful fallback: wenn Browser keine Web Speech unterstützt → Lautsprecher-Icon ausblenden
- Neue Komponente `<SpeakButton text lang />` (kleines Lautsprecher-Icon, ghost variant)
- Eingebaut in:
  - `Quiz.tsx` — neben Frage und (nach Auflösung) neben korrekter Antwort
  - `Vokabeln.tsx` — neben jedem englischen/deutschen Wort in Lookup, Vorschlägen, Sammlung
  - `Lektion.tsx` und `Wortpuzzle.tsx` — neben dem Zielwort
- Settings (`Einstellungen.tsx`): Toggle „Aussprache automatisch abspielen (nach jeder Antwort)" — default off.

## 5. Was sich NICHT ändert

- Keine UI-Politur, keine Border-Themen — Phase 8.
- Bottom-Bar, Routing, Auth, Gamification bleiben.
- `generate-vocabulary` und andere Edge-Functions bleiben als Fallback.
- Streak-, XP-, Badge-Logik bleibt.

## 6. Reihenfolge der Umsetzung

1. **Migration** anlegen (Tabelle `ngsl_words`, Spalten in `vocabulary`, Indizes, RLS).
2. **SRS-Helper** (`applySrsResult`) und **`useReviewQueue`**-Hook bauen.
3. **Quiz.tsx** umstellen auf Review-Queue + `applySrsResult`.
4. **Wortpuzzle, Lückentext, Lektion** an `applySrsResult` hängen.
5. **NGSL-Pool-Auswahl** in Quiz „Neu starten" und Vokabeln „Aus Wortliste hinzufügen" einbauen.
6. **TTS-Helper + SpeakButton** + Einbindung in vier Seiten + Setting.
7. **Vokabeln.tsx**: Filter „fällig heute", Status-Badges aus echten SRS-Werten, NGSL-Block.

Nach jedem Schritt sage ich kurz Bescheid und du kannst zwischendrin testen.

## 7. Was du parallel machst

- Mit Grok: NGSL-CSV mit deutschen Übersetzungen vorbereiten und in `ngsl_words` importieren. Sobald die Tabelle existiert (Schritt 1), gebe ich dir das genaue Spaltenformat.

## 8. Bericht nach jedem Schritt

- Welche Datei/Tabelle geändert
- Was der User nun sehen/testen kann
- Was als Nächstes ansteht

---

## Technische Details (für später, falls nötig)

- SM-2-Werte aus `src/lib/srs.ts` bleiben (MIN_EASE 1.3, MAX_EASE 2.8, MAX_INTERVAL 180).
- Review-Query: `select * from vocabulary where user_id = $1 and (next_review_at <= now() or next_review_at is null) and level = $2 and topic = $3 order by next_review_at nulls last limit $4`.
- NGSL-Auswahl-Query: `select * from ngsl_words where cefr_level <= $1 and ($2 = any(topics) or topics is null) order by rank limit $3`, anschließend `not in (select ngsl_id from vocabulary where user_id = ...)` filter clientseitig oder per left join.
- TTS-Voices: `speechSynthesis.getVoices()` ist async; `voiceschanged`-Event abwarten und Result memoizen.
