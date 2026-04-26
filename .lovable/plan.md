# Hello! — Phasen-Fahrplan v3.1 🗺️

Otto's Gesamtplan, mit Alex' finalen Korrekturen aus der Phase-3-Diskussion. Die Vokabel-Datenbank-Strategie steht **nicht oben**, sondern als **Phase 5** mit klarer Lizenz-Leitplanke.

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

### Noch offen — Phase 2 Restarbeit (jetzt)
- **2.1 Skip-Button überall** — Wortpuzzle/Grammatik/Vokabeln prüfen, fehlende einbauen
- **2.2 Ellie-Mini-Erklärung konsistent** — Quiz, Wortpuzzle, Grammatik durchchecken
- **2.3 Casing-Helper flächendeckend** — Quiz, Grammatik, Lückentext-Lösungen
- **2.4 Lektionskarten entschlacken** — Beispielsätze raus aus der Übersicht

**Aufwand:** klein. **Risiko:** niedrig. **Testbarkeit:** sofort.

---

## 📱 Phase 3 — Mobile Navigation *(direkt nach Phase 2)*

**Alex' klare Ansage:** Direkt Bottom-Tab-Bar bauen. **Keine Zwischenlösung.**

**3.1 Bottom-Tab-Bar**
- Vier Tabs unten: **Start · Training · Coach · Profil**
- Daumen-freundlich, Standard auf Mobile
- Admin **wandert ins Profil** (nicht in die Bottom-Bar)

**3.2 Sub-Tab-Navigation (Training, Profil)**
- Aktuell horizontal scrollbar — wird mit Bottom-Bar überflüssig oder kompakter wrappen

**3.3 Header verschlanken (Alex' Korrektur!)**
- **Header:** Logo links · kompakter Niveau/Fokus-Chip rechts
- **Bottom-Bar:** Start · Training · Coach · Profil
- **Profil-Seite:** Einstellungen · Admin · Logout
- ❌ **KEIN zusätzlicher Menüknopf im Header**, solange nicht zwingend nötig
- Sonst hätten wir doppelte Navigation — genau das, was wir loswerden wollen

**Aufwand:** mittel. **Risiko:** mittel (UI-Umbau). **Testbarkeit:** gut, da visuell sofort sichtbar.

---

## 🎨 Phase 4 — Frank's Design (Farben & Look) *(erst nach Phase 3)*

Frank sammelt die Hex-Codes parallel, **Otto baut sie noch nicht ein.**

**4.1 Farb-Tokens umstellen** *(später)*
- `src/index.css` → CSS-Variablen für Background, Primary, Accent neu setzen
- Tailwind-Config zieht automatisch nach

**4.2 „Lack-Glanz"-Effekt**
- Gradient + subtiler Highlight auf Primary-Buttons (wie poliert)

**4.3 Komponenten-Check**
- Cards, Buttons, Toasts, Chips, Active-States
- Kontrast prüfen (Lesbarkeit auf Schwarz!)

**Aufwand:** mittel. **Risiko:** mittel-hoch (visueller Gesamteindruck). **Vorbedingung:** Hex-Codes von Frank + Phase 3 fertig.

---

## 📚 Phase 5 — Vokabel-Datenbank (Master-Liste) *(geparkt)*

Aktuell werden alle Vokabeln per KI on-the-fly generiert. Mittelfristig wollen wir auf **eine lizenzierte A1–B2 Master-Liste** umsteigen, KI bleibt nur noch Helfer für Beispielsätze, Erklärungen, Übungen.

### 🛑 Alex' Lizenz-Leitplanke (vor jedem Import zwingend!)

Eine Wortliste darf **nur dann** importiert werden, wenn **alle sechs** Punkte schriftlich/nachweisbar erfüllt sind:

1. **Klare Nutzungsrechte** oder schriftliche Freigabe vom Rechteinhaber
2. **Erlaubte Speicherung** in unserer Datenbank
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
- **V3:** Edge Functions umbauen *(Otto)*

### CEFR-J / NGSL als Backup
Beide gelten lizenztechnisch als sauberer und bleiben in der Hinterhand.

**Aufwand:** mittel-groß. **Risiko:** niedrig (wenn Lizenz steht), hoch (wenn ohne Lizenz). **Vorbedingung:** alle 6 Leitplanken erfüllt.

---

## 📋 Vorgeschlagene Reihenfolge *(von Frank am 26.04. freigegeben)*

1. **Phase 2 sauber abschließen** (2.1–2.4) ← *jetzt aktiv*
2. **Phase 3** Mobile-Navigation mit **Bottom-Bar direkt** (keine Zwischenlösung)
3. **Phase 4** Farben — sobald Hex-Codes da sind UND Phase 3 fertig
4. **Phase 5** Vokabel-DB — erst wenn lizenzierte Liste vorliegt

Zwischen jeder Phase: **Frank testet auf dem Handy**, Otto wartet auf Feedback.

---

**Otto an der Werkbank.** Phase 2 läuft. 🔧
