

## Plan

Zwei Themen, sauber getrennt.

---

### 1) Versatz beim Seitenwechsel beheben

**Ursache:** Der Header zeigt zwei optionale Elemente, die je nach Seite/Datenstand erscheinen oder verschwinden — der **Niveau/Thema-Chip** (nur sichtbar wenn `ctxReady && hasSelection`) und auf manchen Seiten zusätzlich die **Sub-Navigation** (Training, Profil) gegenüber Seiten ohne Sub-Nav (Coach, Vokabeln direkt). Dadurch springt der Inhalt beim Routenwechsel um ein paar Pixel.

Außerdem: der **Scroll-Position** wird beim Routenwechsel nicht zurückgesetzt → man landet je nach vorheriger Seite mal oben, mal mittendrin.

**Fix in `src/components/AppLayout.tsx`:**
- Niveau/Thema-Chip immer rendern, solange `ctxReady` ist — bei fehlender Auswahl als dezenter Platzhalter („Niveau wählen"), damit die Header-Höhe stabil bleibt.
- Die Header-Zeile bekommt eine **feste Mindesthöhe**, damit das An/Aus von Chips den Inhalt nie verschiebt.
- `main` bekommt eine **min-height**, damit kurze Seiten (z. B. Erfolge ohne Daten) nicht „nach oben springen".

**Fix in `src/App.tsx` (oder neuer kleiner `ScrollToTop`-Helper):**
- Bei jedem Routenwechsel `window.scrollTo(0, 0)` — Standardlösung, exakt wie auf den meisten Webseiten.

Kein visuelles Redesign, nur Stabilisierung.

---

### 2) Echte Erfolge statt Mini-Badges

Die aktuelle Liste (11 Stück) wird komplett ersetzt durch ein **gestaffeltes, ehrgeizigeres System** mit klaren Stufen. Jedes Thema hat mehrere Stufen, damit man immer was zum Anstreben hat.

**Neue Badge-Liste (4 Kategorien, 22 Badges):**

**Streak (Tage in Folge)**
- 🔥 *Dranbleiber* — 7 Tage in Folge
- ⚡ *Eisern* — 14 Tage in Folge
- 💎 *Unaufhaltsam* — 30 Tage in Folge
- 👑 *Legende* — 100 Tage in Folge
- 🏆 *Marathonläufer* — 365 Tage in Folge

**Vokabeln (gelernt = Status „mastered" oder gleichwertig)**
- 📘 *Wortsammler* — 100 Vokabeln gemeistert
- 📚 *Wortschatz-Profi* — 500 Vokabeln gemeistert
- 🏛️ *Bibliothekar* — 1.000 Vokabeln gemeistert
- 🧠 *Wortgenie* — 2.500 Vokabeln gemeistert

**Lektionen / Übungen**
- 🎯 *Perfektionist* — 1 Lektion ohne Fehler
- 🎯🎯 *Doppelt sauber* — 10 Lektionen ohne Fehler
- 🎯🎯🎯 *Makellos* — 50 Lektionen ohne Fehler
- 🧩 *Puzzlemeister* — 25 Wortpuzzle gelöst
- 📝 *Grammatikfuchs* — 25 Grammatik-Übungen abgeschlossen
- 🔤 *Lückenfüller* — 25 Lückentexte abgeschlossen
- 🚀 *Combo-Held* — 25 richtige Antworten in Folge
- 🌪️ *Combo-King* — 50 richtige Antworten in Folge

**Level / Fortschritt**
- 🎓 *Student* — Level 5 erreicht
- ✈️ *Traveller* — Level 10 erreicht
- 🌍 *Advanced* — Level 15 erreicht
- 🗣️ *Fluent Speaker* — Level 20 erreicht
- 👑 *Master* — Level 25 erreicht

**Was fliegt raus:** „First Steps" (10 Vokabeln), „Hello, Coach!" (erste Chat-Nachricht), „Collector" (50 Vokabeln) — zu klein, kein echter Erfolg.

**Datenmodell:** keine Tabellenänderung nötig. Die Tabelle `user_badges` speichert nur `badge_key` — wir aktualisieren nur die Liste in `src/lib/gamification.ts` und die Vergabe-Logik in `awardActivity`. Alte Keys bleiben in der DB harmlos liegen, werden in der UI aber nicht mehr angezeigt (oder optional einmalig still gelöscht).

**Neue Vergabelogik (`awardActivity` + Aufrufstellen):**
- `vocabCount` zählt künftig **nur gemeisterte Vokabeln** (Status `mastered`), nicht die Sammlung. Das spiegelt echten Lernfortschritt.
- Neue Zähler in `profiles` müssen wir **nicht** anlegen — wir prüfen Stufen direkt mit Aggregat-Queries beim Award (z. B. `count(*) where status='mastered'`, `count(*) from learning_sessions where mode='lesson' and correct=total`).
- Aufrufer (`Lektion.tsx`, `Wortpuzzle.tsx`, `Quiz.tsx`, `Grammar.tsx`, `Lueckentext.tsx`) übergeben künftig `mode` mit, damit die richtigen Counter geprüft werden.

**UI in `src/pages/Erfolge.tsx`:**
- Badges nach Kategorien gruppiert anzeigen (Streak / Vokabeln / Übungen / Level), je mit Überschrift.
- Pro Badge zusätzlich kleiner Fortschritts-Hinweis bei verschlossenen („3/7 Tage", „120/500 Vokabeln") — macht es konkret und motivierend.

---

### Was nicht angefasst wird

- Design, Farben, Layout (außer Header-Stabilisierung)
- XP-/Level-Kurve
- Andere Seiten als Header-Container und Erfolge

### Technische Notizen

- Reine Frontend-Anpassungen + minimal erweiterte Aggregat-Queries
- Keine Migration nötig
- Alte `user_badges`-Einträge bleiben bestehen, werden ignoriert
- Dateien: `AppLayout.tsx`, `App.tsx` (ScrollToTop), `src/lib/gamification.ts`, `src/pages/Erfolge.tsx`, kleine Anpassungen in Aufrufern von `awardActivity`

