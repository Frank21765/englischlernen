

## Plan: Sitemap-Doku (PDF + Markdown) + Code-Aufräumen

### Teil 1 — App-Doku erstellen (8–12 Seiten)

Ich erstelle **zwei Dateien** in `/mnt/documents/`, generiert per Skript (Markdown + reportlab-PDF mit der Hello!-Optik: warmes Cremeweiß, Akzentfarbe gold/gelb, Inter/Georgia):

- `Hello-App-Doku.md` (zum Einfügen in ChatGPT)
- `Hello-App-Doku.pdf` (zum Lesen & Teilen)

**Inhalt (identisch in beiden Dateien):**

1. **Über Hello!** — Vision, Zielgruppe (Mama/Karo & ähnliche Erwachsene-Anfänger:innen), Tonalität (warm, geduldig, ermutigend, deutsch).
2. **Navigation & Seitenstruktur** — Top-Level-Tabs mit ihrer Funktion:
   - **Start** (`/lernen`) — Niveau/Thema wählen, Wörter nachschlagen, „Frag mich!"
   - **Training** (`/uben`) — Lektionen, Wortpuzzle, Quiz, Lückentext, Grammatik, Vokabeln
   - **Coach** (`/chat`) — Coach Ellie (KI-Tutorin)
   - **Profil** (`/profil`) — Erfolge, Statistik, Unterstützen, Einstellungen
   - **Admin** (`/admin`) — nur Admins, Nutzerverwaltung & Freischaltung
3. **Detailseiten** — pro Seite: Zweck, Hauptaktionen, Datenquelle (z.B. „Vokabeln aus `vocabulary`-Tabelle, KI-generiert").
4. **Coach Ellie** — wann sie auftaucht (Frag-Ellie-Buttons in Quiz, Lückentext, Grammatik, Wörter), wie der Kontext-Übergabe-Flow funktioniert, „Zurück zur Übung"-Logik.
5. **Gamification** — XP-System, Level (`levelFromXp`), Streaks, Badges.
6. **Zugangs-System** — `pending` → `active` (1 Monat / 1 Jahr) → `expired` / `blocked`. AccessGate, Onboarding-Flow, Admin-Freischaltung.
7. **Datenmodell (vereinfacht)** — Tabellen profiles, vocabulary, chat_sessions, chat_messages, learning_sessions, user_badges, user_roles, feedback. Was wo liegt.
8. **KI-Funktionen (Edge Functions)** — chat-tutor, generate-vocabulary, generate-cloze, generate-grammar, generate-puzzle, translate-word, delete-account. Welches Modell (Lovable AI Gateway, Gemini/GPT).
9. **Glossar alt → neu** — Tabelle mit umbenannten Begriffen:
   - „Lernen" → **Start** (Tab-Label, Route bleibt `/lernen`)
   - „Üben" → **Training** (Tab-Label, Route bleibt `/uben`)
   - sowie weitere die ich beim Code-Audit finde
10. **Tonalitäts-Cheatsheet** — Beispielsätze: wie Hello! mit Nutzer:innen spricht (du-Form, warm, kein Fachjargon).
11. **Bekannte Baustellen** — kurze Liste offener Punkte aus dem Report + neue (Lückentext „Frag Ellie" + „Überspringen", Auth-Fehlertoasts, Selbst-Account-Löschen).

### Teil 2 — Code-Aufräumen „alte Wörter"

Nach der Doku gehe ich systematisch durch und räume auf, **ohne Routen zu ändern** (Routen-Umbenennung wäre riskant: bestehende Links/Bookmarks/Mails brechen). Statt dessen: **interne Bezeichner & Kommentare** angleichen, sodass der Code mit den Labels „Start" und „Training" konsistent ist.

**Was ich anfasse:**
- Kommentare und JSDoc, die noch von „Lernen-Hub" / „Üben" sprechen → „Start-Hub" / „Training"
- Toast-Texte und Hilfetexte mit „zur Lernen-Seite" → „zum Start"
- Variablen wie `lernenState` / interne Konstanten, falls vorhanden → umbenennen
- Konsole-Log-Strings

**Was ich bewusst NICHT ändere:**
- Die Routen `/lernen` und `/uben` (+ Komponenten-Dateinamen `Lernen.tsx`, `Uben.tsx`) — Umbenennen würde alle Verlinkungen, Legacy-Redirects und ggf. gespeicherte Lesezeichen brechen. Das machen wir erst in einer dedizierten „Routen-Migration", wenn du es willst.
- Tab-Labels selbst (sind ja schon richtig: „Start", „Training")

**Vorgehen:** Ich erstelle erst eine **Liste der gefundenen Stellen** als Markdown-Anhang zur Doku (Kapitel „Code-Audit"), arbeite die Stellen dann ab und gebe dir eine kurze Zusammenfassung was geändert wurde.

### Reihenfolge

1. Doku-Skripte schreiben & PDF + Markdown generieren → QA per Bild-Inspektion
2. Code-Audit durchführen, Liste erstellen
3. Aufräumen Schritt für Schritt
4. Kurzer Abschluss-Bericht

