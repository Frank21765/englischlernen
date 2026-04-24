

## Plan: Routen & Dateien sauber umbenennen (Lernen → Start, Uben → Training)

### Ziel

Code-Basis innen so konsistent machen wie die UI außen. Vorbereitung für: Mehrsprachigkeit (Spanisch/Französisch-Klone), Wartbarkeit durch Dritte, sauberes kommerzielles Setup.

### Was geändert wird

**1. Routen (URL-Pfade)**
- `/lernen` → `/start`
- `/uben` → `/training`
- `/uben/lektionen` → `/training/lektionen` (analog für `/wortpuzzle`, `/quiz`, `/lueckentext`, `/grammatik`)

**2. Datei-Namen**
- `src/pages/Lernen.tsx` → `src/pages/Start.tsx`
- `src/pages/Uben.tsx` → `src/pages/Training.tsx`

**3. Alle internen Verlinkungen**
- `<NavLink to="/lernen">` → `<NavLink to="/start">` (in 14 Dateien)
- `navigate("/lernen")` → `navigate("/start")`
- `returnTo="/uben/..."` → `returnTo="/training/..."`
- Match-Arrays in der Navigation (`match: ["/lernen"]` → `match: ["/start"]`)

**4. Legacy-Redirects (damit NICHTS kaputt geht)**

In `App.tsx` werden Weiterleitungen eingerichtet:
```
/lernen          → /start
/uben            → /training
/uben/lektionen  → /training/lektionen
/uben/quiz       → /training/quiz
/uben/wortpuzzle → /training/wortpuzzle
/uben/lueckentext → /training/lueckentext
/uben/grammatik  → /training/grammatik
```

So funktionieren Karos Bookmarks und alle alten Links automatisch weiter — sie landen einfach auf der neuen Adresse.

**5. Kommentare & Variable**
- Restliche Stellen mit „Lernen-Hub" / „Üben" in Kommentaren angleichen

### Was NICHT geändert wird

- **Datenbank-Tabellen** (`vocabulary`, `learning_sessions` etc.) — die bleiben technisch gleich. „Learning" ist englisch und passt ohnehin universell.
- **UI-Labels** („Start", „Training") — die sind ja schon richtig.
- **Andere Routen** (`/chat`, `/profil`, `/vokabeln`, `/admin`) — die sind sprachneutral oder schon ok.

### Risiko-Einschätzung

**Klein**, weil:
- Legacy-Redirects fangen alte URLs ab
- Keine Datenbank-Änderung nötig
- Vite/React baut die Datei-Umbenennungen sauber neu

**Was du nach dem Umbau merken wirst:**
- In der Adresszeile steht jetzt `/start` statt `/lernen`
- Sonst: nichts Sichtbares — die App fühlt sich identisch an

### Vorgehen

1. Datei-Umbenennungen (`Lernen.tsx` → `Start.tsx`, `Uben.tsx` → `Training.tsx`)
2. `App.tsx` umstellen: neue Routen + Legacy-Redirects
3. Alle 14 Dateien mit internen Links aktualisieren
4. Kommentare/Strings angleichen
5. Im Preview einmal durchklicken: Start → Training → Lektionen → Quiz → zurück zur Übersicht etc.
6. Test: Alte URL `/lernen` direkt eingeben → sollte auf `/start` umleiten
7. Kurzer Bericht, was geändert wurde

### Aufwand

Ein Durchgang, ca. 15–20 Edit-Schritte. Kein „Riesen-Projekt", aber gründlich und konzentriert.

