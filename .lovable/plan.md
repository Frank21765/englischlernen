## Ziel

Boxen, Cards, Panels und Eingabefelder bekommen app-weit **eine** klar sichtbare Kontur. Schluss mit "stärker drehen". Wir entfernen alle konkurrierenden Border-Definitionen und ersetzen sie durch genau einen zentralen Stil.

## Warum der bisherige Ansatz scheitert

- **Bordeaux auf Schwarz** = zu wenig Helligkeitsunterschied. Das Auge erkennt Konturen primär über Helligkeit, nicht Farbe. Egal wie satt das Rot — es bleibt schwach.
- **Mehrfach-Stile konkurrieren**: globale `* { border-border }`-Regel, `.card-surface`, Spezial-Borders auf Training-Tiles und Chat-Bubbles. Auf Coach sieht man Linien gut, auf Training kaum — weil andere Klassen drüberliegen.
- **Border + Ring + Shadow gestapelt** wirkt matschig statt klar.

## Was sich ändert

### 1. Border-Token: warm-neutral statt Bordeaux

In `src/index.css`:
- `--border` von `355 45% 32%` (gesättigtes Bordeaux) → **`30 8% 38%`** (warmes Beige-Grau, deutlich heller).
- `--border-strong` → **`30 12% 50%`** (für aktive/wichtige Container).
- `--input` → **`30 8% 34%`** (Eingabefelder etwas zurückhaltender).

Begründung: Helligkeit ~38% liefert echten Kontrast zu Background (3%). Warmer Hue (30°) bleibt zur Bordeaux-Welt passend, ohne mit dem Primary-Rot zu konkurrieren.

### 2. Ein einziger Surface-Stil — Border, kein Ring

`.card-surface` wird vereinfacht:
- **1px solid** `hsl(var(--border))` (nicht mehr 1.5px — sauberer)
- Schatten bleibt dezent (`0 4px 12px schwarz/30%`)
- **Kein** zusätzlicher Ring/Box-Shadow-Outline mehr (war doppelt gemoppelt)

`.card-surface-interactive`: Hover hebt nur die Border auf `--border-strong` und fügt leichten `translateY(-1px)` hinzu. Kein Glow.

### 3. Spezial-Borders entfernen

Aufräumen:
- `src/components/ui/input.tsx`: zurück auf Standard `border` (nimmt automatisch `--input`), kein `border-[1.5px]` mehr.
- `src/components/ui/textarea.tsx`: dito.
- `src/pages/Chat.tsx`: explizite `border-[1.5px] border-[hsl(...)]` auf Bubbles und Suggestion-Buttons entfernen — sie nutzen wieder `.card-surface` einheitlich.
- `src/pages/Training.tsx`: Tiles behalten `.card-surface` + `.card-surface-interactive`, aber ohne die Spezial-Border-Farbe für aktiv. Aktive Tile bleibt durch `bg-primary` erkennbar, nicht durch andere Border.

### 4. Visuelle Verifikation auf jeder Hauptseite

Nach dem Code-Change öffne ich nacheinander Start, Training (mobile + desktop), Coach, Profil, eine Übung (Quiz) und prüfe per Browser-Tool, ob die Linien überall **gleich** und **deutlich** wirken. Erst dann melde ich fertig.

## Was sich NICHT ändert

- Farbsystem (Background, Primary, Card-Background) bleibt
- Bottom-Bar, Navigation, Routing, Trainingsablauf
- Lack-Effekt auf Buttons (`.lacquer`)
- `hover-lift` auf Start-/Profil-Cards (wirkt dort gut)
- Datenbank, Phasen-Plan

## Geänderte Dateien (geplant)

- `src/index.css` — Tokens + `.card-surface` vereinfacht
- `src/components/ui/input.tsx` — Border zurück auf Standard
- `src/components/ui/textarea.tsx` — Border zurück auf Standard
- `src/pages/Chat.tsx` — Spezial-Borders raus
- `src/pages/Training.tsx` — aktive-Tile-Border raus

## Bericht nach Umsetzung

1. Welche Tokens jetzt aktiv sind (Hex-Werte zur Kontrolle)
2. Bestätigung: nur noch **ein** Surface-Stil
3. Visuelle Prüfung pro Seite (Start, Training mobil/desktop, Coach, Profil, Quiz)
4. Falls eine Seite trotzdem schwach wirkt: konkrete Stelle benennen statt nochmal blind zu drehen

## Falls auch dieser Versuch nicht überzeugt

Dann liegt es nicht mehr an Tokens, sondern am Grundkonzept (z. B. Cards bräuchten leicht hellere Background-Fläche statt nur Border). In dem Fall stoppen wir das Thema bewusst und gehen weiter.

---

## Parallel: Plan v4.0 — noch nicht schreiben, erst besprechen

Nach dem Linien-Reset reden wir in Ruhe über die Grok-Vorschläge:
- Macht "SRS schon in Phase 2 vorbereiten" wirklich Sinn oder verzettelt es uns?
- Wie viele Vokabeln planen wir realistisch (1.000? 5.000? 10.000)?
- Audio: vorgenerierte Files oder Live-TTS? Budget?
- NGSL-Lizenz wirklich kommerziell nutzbar — wer prüft?
- Phase 6 Speaking: nur Browser-API oder externe Engine?

Sobald wir das geklärt haben, schreibe ich Plan v4.0 als PDF + MD nach `/mnt/documents/`.
