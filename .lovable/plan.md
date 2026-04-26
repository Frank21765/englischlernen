# Hello! — Phasen-Fahrplan v3 🗺️

Otto's Gesamtplan, wieder hergestellt nach kurzer Strategie-Diskussion zur Vokabel-Quelle. Die Vokabel-Datenbank-Strategie steht **nicht mehr oben**, sondern als **Phase 5** mit klarer Lizenz-Leitplanke von Alex.

**Entscheidungs-Regel:** Frank + Otto entscheiden gemeinsam. Alex und Perplexity liefern Input — Bauchgefühl + technische Umsetzbarkeit haben Vorrang.

---

## ✅ Phase 1 — Auth, Onboarding, Foundation *(erledigt)*

- E-Mail-Login + Google
- Onboarding-Flow (Niveau, Thema, Standardrichtung)
- Profile, Roles, RLS, Admin-Bereich
- Access-Gate für Test-/Pro-Zugänge
- Streak + XP + Level-System

---

## 🔧 Phase 2 — Übungen & Trainings-Flow *(läuft, fast fertig)*

Ziel: Alle Lern-Modi sauber, konsistent, ohne Reibungsverluste.

### Schon erledigt (Sprint 1A + 1B + 2A)
- **MC-Bug** gefixt (Antworten werden gemischt)
- **Toasts** liegen oben, blockieren keinen Button mehr
- **Button-Farben** vereinheitlicht (alle Action-Buttons = primary)
- **Casing-Helper** (`src/lib/text.ts`) zentral für Satzanfang-Regel
- **Vokabel-Platzhalter** neutralisiert
- **Lückentext:** Auto-Focus mit 600ms Delay, Skip-Button, Ellie-Mini-Erklärung bei richtig/falsch
- **Skip-Buttons** in Lektion + Quiz
- **Frag Ellie:** bessere Markdown-Formatierung (Fettung, Listen, Abstand)

### Noch offen — Phase 2 Restarbeit
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

## 📱 Phase 3 — Mobile-Navigation *(als nächstes nach Phase 2)*

Hier wird's spannender. Frank, das ist der Punkt, an dem du Alex+Perplexity nochmal explizit einbeziehen kannst.

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

## 🎨 Phase 4 — Frank's Design (Farben & Look)

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

## 📚 Phase 5 — Vokabel-Datenbank (Master-Liste) *(später, mit harter Lizenz-Prüfung)*

Aktuell werden alle Vokabeln per KI on-the-fly generiert. Mittelfristig wollen wir auf **eine lizenzierte A1–B2 Master-Liste** umsteigen, KI bleibt nur noch Helfer für Beispielsätze, Erklärungen, Übungen.

### 🛑 Alex' Lizenz-Leitplanke (vor jedem Import zwingend!)

Eine Wortliste darf **nur dann** importiert werden, wenn **alle sechs** Punkte schriftlich/nachweisbar erfüllt sind:

1. **Klare Nutzungsrechte** oder schriftliche Freigabe vom Rechteinhaber
2. **Erlaubte Speicherung** in unserer Datenbank (Supabase)
3. **Erlaubte Anzeige** gegenüber unseren Nutzer:innen
4. **Erlaubte Bearbeitung/Korrektur** durch Karo / das Team
5. **Erlaubte Nutzung** für abgeleitete Inhalte (Quiz, Lückentexte, Puzzle, Erklärungen)
6. **Brauchbares Format** — CSV/XLSX bevorzugt, sauber strukturiert nach Niveau

### ⚠️ Wichtige Klarstellung
- **Goethe-Wortlisten sind öffentlich, aber NICHT automatisch app-legal.** „Öffentlich als Prüfungsvorbereitung" ≠ „freie kommerzielle Weiterverwendung".
- **„Andere Apps nutzen sie" ist KEIN Lizenzbeweis.** Andere können falsch liegen oder eine eigene Lizenz haben.
- **Hueber B2 etc.:** nicht kaufen vor schriftlicher Lizenz-Klärung per Mail.

### Bevorzugte Strategie
- Gekaufte oder eindeutig lizenzierte A1–B2 Master-Liste (~50–200 €)
- C1 später, C2 nicht geplant (kein Markt für App-Lerner)
- KI für Ableitungen (Beispielsätze, Erklärungen) — bleibt
- Karo prüft Stichproben statt jede Vokabel

### Phasen V1–V3 (erst wenn Liste lizenziert da ist)
- **V1:** Liste beschaffen *(Frank + Alex, läuft parallel)*
- **V2:** Datenmodell `master_vocabulary` + Import-Script *(Otto, ~1 Sprint)*
- **V3:** Edge Functions umbauen — `generate-vocabulary`, `generate-cloze`, `generate-puzzle` ziehen aus Master-Liste *(Otto)*

### CEFR-J / NGSL als Backup
Beide gelten lizenztechnisch als sauberer und bleiben in der Hinterhand, falls keine kaufbare Liste passt.

**Aufwand:** mittel-groß. **Risiko:** niedrig (wenn Lizenz steht), hoch (wenn ohne Lizenz importiert). **Vorbedingung:** alle 6 Leitplanken erfüllt.

---

## 📋 Vorgeschlagene Reihenfolge

1. **Phase 2 sauber abschließen** (2.1–2.4) — klein, schnell sichtbar
2. **Phase 3** (Mobile-Navigation) — Frank entscheidet vorher: nur Sub-Tabs oder direkt Bottom-Bar?
3. **Phase 4** (Farben) — sobald Hex-Codes da sind
4. **Phase 5** (Vokabel-DB) — erst wenn lizenzierte Liste vorliegt

Zwischen jeder Phase: **Frank testet auf dem Handy**, Otto wartet auf Feedback.

---

## 🤔 Was Otto von Frank, Alex und Perplexity jetzt hören will

1. **Phase 2 erst komplett (2.1–2.4), oder direkt zu Phase 3 springen?**
2. **Phase 3:** Bottom-Bar jetzt, oder erst nur Sub-Tabs aufräumen?
3. **Phase 4:** Farb-Codes — wann kommen die? Soll Otto in der Zwischenzeit einen Vorschlag machen?
4. **Phase 5:** Frank kümmert sich um Lizenz-Recherche parallel — kein Bau-Sprint, bis grünes Licht.

---

**Otto wartet an der Werkbank.** Sobald du entschieden hast, leg ich los. 🔧
