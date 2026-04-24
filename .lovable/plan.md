## Plan: Mobile-Test-Handout PDF

### Ziel

Ein kompaktes, gut lesbares **PDF (5–6 Seiten)**, das Frank durch den Mobile-Test der Hello!-App führt — strikt nach Checkliste, mit klarem Beobachtungs-Format.

### Ablage

- `/mnt/documents/Hello-Mobile-Test-Handout-v1.pdf` — finales PDF
- `/mnt/documents/Hello-Mobile-Test-Handout-v1.md` — Markdown-Quelle (zum Lesen am Handy ohne PDF-Reader)

### Inhalt der 6 Seiten

**Seite 1 — Der große Plan**
- Kurzer Überblick: Wo stehen wir, was kommt
- Phasen 1–4 als Tabelle (Mobile → Übungs-UX → Level-Treue → Optional)
- Was wir bewusst weglassen (CEFR-J-Komplettimport, Validator-Standard) und warum

**Seite 2 — Dein Auftrag**
- Gerät: Smartphone (iOS oder Android)
- URL: https://englischlernen.lovable.app
- Modus: Strikt nach Checkliste, jeden Punkt abhaken
- Was du NICHT bewertest: Inhalte, KI-Antworten, Level-Treue (kommt in Phase 3)
- Was du SEHR WOHL bewertest: Bedienbarkeit, Touch-Ziele, Layout, Lesbarkeit, Navigation

**Seite 3 — Die strikte Checkliste**
Sortiert nach Bereich, jeder Punkt zum Abhaken:
- **Header** (Logo, Level-Pille, Streak, Fokus-Pille, Logout)
- **Hauptnavigation** (Start, Training, Coach, Profil — scrollt sie? klemmt sie?)
- **Start-Seite** (Übersicht, CTA-Buttons, Ellie-Karten)
- **Training** (Sub-Tabs: Lektionen, Wortpuzzle, Quiz, Lückentext, Grammatik — passen sie? brechen sie um?)
- **Übungen einzeln** (Buttons groß genug? Tastatur verdeckt was? Skip-Buttons da?)
- **Coach/Chat** (Eingabe-Feld, Senden-Button, Verlauf)
- **Profil** (Sub-Tabs, Erfolge, Statistik, Einstellungen)
- **Allgemein** (Texte zu klein? Kontraste? Buttons mind. 44×44px? horizontaler Scroll?)

**Seite 4 — Beobachtungs-Format**
Wie du Findings notierst, mit Beispiel:
- **Wo:** Welche Seite/Komponente
- **Was nervt:** Konkretes Problem (1 Satz)
- **Was würdest du erwarten:** Deine Lösungs-Idee
- **Schwere:** 🔴 Blocker / 🟡 Stört / 🟢 Schönheitsfehler
- 2–3 Beispiel-Findings als Vorlage

**Seite 5 — Top-3-Verdächtige (vorab)**
Wo wir schon was vermuten, ohne dich zu beeinflussen — kurz erklärt, damit du weißt, worauf du besonders schauen solltest:
1. **Top-Navigation scrollt horizontal** (statt Bottom-Tab-Bar)
2. **Fokus-Pille verschwindet auf kleinen Screens** (`hidden xs:flex`)
3. **Training-Sub-Tabs passen vermutlich nicht in eine Reihe**

Jeweils mit „Worauf du achten solltest"-Hinweis, aber ohne dir die Wertung vorzugeben.

**Seite 6 — Was danach passiert**
- Du gibst mir deine gesammelten Findings
- Wir priorisieren gemeinsam (🔴 zuerst, 🟢 zuletzt)
- Ich setze in Phase 1 um — Datei für Datei (`AppLayout.tsx`, `Training.tsx`, `Profil.tsx`)
- Du testest jeden Schritt nach
- Wir iterieren bis Mobile-UX rund ist
- Erst DANN gehen wir zu Phase 2 (Übungs-Feinheiten)

### Stil

- **Hello!-Look**: Sans-Serif, klare Hierarchie, ruhige Typografie
- Wie das Mobile-Audit-PDF, das du schon hast
- Tabellen sauber, Checkboxen als ☐, Schwere-Marker farbig
- Kompakt: Lieber 5 als 7 Seiten

### Vorgehen (im Build-Modus)

1. Markdown-Datei mit allen 6 Sektionen schreiben
2. Per ReportLab (Python) zu PDF rendern, Hello!-Stil
3. **PDF-QA**: Jede Seite zu JPG konvertieren, Layout/Umbrüche/Lesbarkeit prüfen
4. Bei Problemen: nachjustieren, neu rendern, neu prüfen
5. Übergabe mit kurzer Zusammenfassung im Chat

### Was NICHT passiert

- Keine Code-Änderungen an der App
- Keine Datenbank-Aktionen
- Keine externen Recherchen — alles ist schon im Kopf
- Keine Bewertung der Findings vorab — du sammelst neutral

### Aufwand

Konzentrierter Build inkl. QA. Erwarte ein PDF von 5–6 Seiten innerhalb weniger Minuten.

### Danach

Frank-Modus „Testen, testen, testen!" 🔥
