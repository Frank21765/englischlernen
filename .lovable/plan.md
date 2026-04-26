# Hello! — Gesamtplan ab jetzt 🗺️

Otto's Vorschlag, wie wir die nächsten Wochen ordentlich strukturieren. Vier Phasen, jede klein genug zum Testen, groß genug um sichtbar was zu bewegen. **Frank hat den finalen Call** — Alex und Perplexity dürfen mitreden, aber Frank+Otto entscheiden.

---

## ✅ Schon erledigt (Sprint 1A + 1B)

Damit klar ist, was schon steht:

- **MC-Bug** gefixt (Antworten werden gemischt)
- **Toasts** liegen oben, blockieren keinen Button mehr
- **Button-Farben** vereinheitlicht (alle Action-Buttons = primary)
- **Casing-Helper** (`src/lib/text.ts`) zentral für Satzanfang-Regel
- **Vokabel-Platzhalter** neutralisiert
- **Lückentext:** Auto-Focus mit 600ms Delay, Skip-Button, Ellie-Mini-Erklärung bei richtig/falsch
- **Skip-Buttons** in Lektion + Quiz
- **Frag Ellie:** bessere Markdown-Formatierung (Fettung, Listen, Abstand)

---

## 🔵 Phase 2 — Aufräumen & Konsistenz (klein, sicher, schnell)

Ziel: Die letzten kleinen Reibungen aus den Übungen rausholen, bevor wir an größere Umbauten gehen.

**2.1 Skip-Button überall**
- Prüfen, ob `Wortpuzzle`, `Grammatik`, `Vokabeln` auch einen sauberen „Überspringen" haben. Falls nein → einbauen.

**2.2 Ellie-Mini-Erklärung überall konsistent**
- Aktuell nur in Lektion und Lückentext. Otto prüft Quiz, Wortpuzzle, Grammatik — überall wo es sinnvoll ist, kommt eine kurze Ellie-Box bei richtig **und** falsch.

**2.3 Casing-Helper flächendeckend anwenden**
- `toSentenceCase` ist nur in 2 Dateien. Otto checkt Quiz, Grammatik, Lückentext — überall wo Lösungen oder Sätze angezeigt werden.

**2.4 Lektionskarten entschlacken**
- Beispielsätze raus aus der Karten-Übersicht (Alex' & Perplexity's Wunsch). Karte zeigt: Titel, Niveau, Fortschritt. Beispiele erst beim Öffnen.

**Aufwand:** klein. **Risiko:** niedrig. **Testbarkeit:** sofort.

---

## 🟡 Phase 3 — Mobile-Struktur (Navigation)

Hier wird's spannender. Frank, das ist der Punkt, an dem du Alex+Perplexity nochmal explizit fragen solltest.

**3.1 Bottom-Tab-Bar (Alex' Empfehlung)**
- Vier Tabs unten: Start · Training · Coach · Profil
- Admin wandert ins Profil
- Daumen-freundlich, Standard auf Mobile
- **Perplexity war vorsichtiger** → wir können auch erst nur die Sub-Tabs entscrollen und die Bottom-Bar später bauen

**3.2 Sub-Tab-Navigation aufräumen**
- Training- und Profil-Tabs scrollen aktuell horizontal → entweder wrappen, kompakter machen, oder als Dropdown
- Otto's Empfehlung: erst wrappen (kleinere Änderung), Bottom-Bar danach

**3.3 Header verschlanken**
- Aktuell: Logo + Level + Streak + Niveau-Chip + Abmelden — auf 390px Viewport eng
- Vorschlag: Level/Streak ins Profil, Header nur Logo + Niveau-Chip + Menü

**Aufwand:** mittel. **Risiko:** mittel (UI-Umbau). **Testbarkeit:** gut, da visuell sofort sichtbar.

---

## 🎨 Phase 4 — franxs-Design (Farben & Look)

Frank liefert die Hex-Codes (Bordeaux glänzend auf schwarz). Sobald die da sind:

**4.1 Farb-Tokens umstellen**
- `src/index.css` → CSS-Variablen für Background, Primary, Accent neu setzen
- Tailwind-Config zieht automatisch nach
- Wirkt sich auf **alle** Komponenten aus → einmalig prüfen

**4.2 „Lack-Glanz"-Effekt**
- Gradient + subtiler Highlight auf Primary-Buttons (wie poliert)
- Vorsichtig dosieren — sonst wirkt's billig

**4.3 Komponenten-Check**
- Cards, Buttons, Toasts, Chips, Active-States — alles einmal durchklicken
- Kontrast prüfen (Lesbarkeit auf Schwarz!)

**Aufwand:** mittel. **Risiko:** mittel-hoch (visueller Gesamteindruck). **Vorbedingung:** Hex-Codes von Frank.

---

## 🚀 Phase 5 — Wachstum & Strategie (kein Code, sondern Konzept)

Frank's Frage „was wenn wir 1.000.000 Downloads wollen?" — das gehört in eine eigene Diskussion, nicht in einen Sprint.

**Otto's Empfehlung:** Bevor wir an Marketing/Skalierung denken, müssen drei Dinge stehen:

1. **USP klar formulieren** — was macht Hello! anders als Duolingo, Babbel, Busuu?
2. **Onboarding bullet-proof** — neue User müssen in 30 Sekunden „aha" sagen
3. **Retention-Loop** — warum kommt jemand am Tag 2, 7, 30 wieder?

Das ist ein Strategie-Gespräch zwischen Frank und Alex (mit Otto als Sparring), kein Bau-Sprint. **Vorschlag:** Phase 5 parken, bis Phase 2–4 durch sind.

---

## 📋 Vorgeschlagene Reihenfolge

1. **Phase 2** (Aufräumen) — 1 Sprint, klein, schnell sichtbar
2. **Phase 3** (Navigation) — Frank entscheidet vorher: nur Sub-Tabs oder direkt Bottom-Bar?
3. **Phase 4** (Farben) — sobald Hex-Codes da sind
4. **Phase 5** (Strategie) — separates Gespräch, kein Sprint

Zwischen jeder Phase: **Frank testet auf dem Handy**, Otto wartet auf Feedback.

---

## 🤔 Was Otto von Frank, Alex und Perplexity hören will

1. **Phase 2 erst komplett, oder direkt zu Phase 3 springen?**
2. **Phase 3:** Bottom-Bar jetzt, oder erst nur Sub-Tabs?
3. **Phase 4:** Farb-Codes — wann kommen die? Soll Otto in der Zwischenzeit einen Vorschlag machen?
4. **Phase 5:** Wann reden wir über Strategie? Jetzt parallel, oder nach Phase 4?

---

**Otto wartet an der Werkbank.** Sobald du (mit oder ohne Alex/Perplexity) entschieden hast, leg ich los. 🔧
