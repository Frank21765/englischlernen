## Plan: Mobile-Audit der Hello!-App (Markdown + PDF)

### Ziel

Ein **gründliches, ehrliches Audit** der App in Handy-Ansicht (375×812 px, typisches Smartphone), mit:
- Beobachtungen pro Seite (was funktioniert, was geht besser, was stört wirklich)
- **Konkreten Lösungsvorschlägen** zu jedem Problem (keine reine Symptom-Liste)
- Übergreifenden Prinzipien am Ende (z. B. Bottom-Nav ja/nein, Schriftgrößen, Tap-Targets)
- **Priorisierung** (Muss / Soll / Kann), damit du danach gleich entscheiden kannst, womit wir starten

### Wichtig: Keine Code-Änderungen

In dieser Runde **nur lesen, schauen, dokumentieren**. Du bekommst das Audit, liest es in Ruhe, ergänzt deine eigenen Beobachtungen — und erst dann entscheiden wir gemeinsam, was wir umsetzen.

### Was ich untersuchen werde

**Seite für Seite (mobile Ansicht 375×812):**
1. Auth / Login (`/auth`)
2. Onboarding (`/onboarding`)
3. Start (`/start`) — die Hauptseite
4. Training-Übersicht (`/training`)
5. Lektionen (`/training/lektionen`)
6. Eine Lektion in Aktion (`/lektion/...`)
7. Wortpuzzle (`/training/wortpuzzle`)
8. Quiz (`/training/quiz`)
9. Lückentext (`/training/lueckentext`)
10. Grammatik (`/training/grammatik`)
11. Vokabeln (`/vokabeln`)
12. Chat mit Ellie (`/chat`)
13. Profil (`/profil`)
14. Statistik (`/statistik`)
15. Erfolge (`/erfolge`)
16. Einstellungen (`/einstellungen`)
17. Unterstützen (`/unterstuetzen`)

**Wonach ich pro Seite schaue:**
- **Tap-Targets** (Buttons min. 44×44 px für Daumen)
- **Schriftgrößen** (lesbar ohne Zoom, min. 16 px für Body)
- **Abstände & Atmen** (gequetscht oder luftig?)
- **Daumen-Erreichbarkeit** (wichtige Aktionen unten oder weit oben?)
- **Eingabefelder** (groß genug, Tastatur verdeckt nichts Wichtiges)
- **Layout-Struktur** (sauber eine Spalte, oder versucht's noch zu quetschen?)
- **Scroll-Verhalten** (sinnvoll, oder unnötig viel scrollen?)
- **Modals/Dialoge** (mobil-freundlich oder Desktop-übernommen?)
- **Ladezustände & Feedback** (sieht man, dass was passiert?)
- **Navigation** (kommt man flüssig zurück/weiter?)

### Format des Audits

Pro Seite:
- **Zustand:** kurze Beschreibung, was die Seite tut
- **GUT:** was am Handy schon gut funktioniert
- **OKAY:** was geht, aber besser ginge
- **STÖRT:** was wirklich problematisch ist
- **Vorschlag:** konkreter Lösungsweg (z. B. „Buttons auf 48 px Höhe, in 2-Spalten-Grid bleiben, aber mit größerem Gap")

Am Ende:
- **Übergreifende Beobachtungen** (Muster, die auf mehreren Seiten auftauchen)
- **Strukturelle Vorschläge** (z. B. Bottom-Navigation einführen?, Sticky-Action-Buttons?)
- **Priorisierte Roadmap** — was zuerst, was später, geschätzter Aufwand
- **Design-Prinzipien-Vorschlag** für die Mobile-Spur (Schriftgrößen, Abstände, Farben, Tap-Targets als verbindliche Regeln)

### Vorgehen

1. **Code lesen** — ich gehe durch alle Seiten-Dateien und schaue mir an, wie sie aktuell aufgebaut sind (Tailwind-Klassen, Layout-Entscheidungen, responsive-Verhalten via `sm:`/`md:`-Breakpoints)
2. **Visuell prüfen** — ich öffne die App im Browser auf 375×812 px und mache Screenshots der wichtigsten Seiten, damit ich nicht nur „theoretisch" urteile, sondern wirklich sehe, was du siehst
3. **Beobachtungen sammeln** — pro Seite strukturiert notieren
4. **Lösungsvorschläge** formulieren — konkret, umsetzbar, mit grobem Aufwand
5. **Übergreifende Muster** herausarbeiten
6. **Priorisierung** vorschlagen
7. **Markdown + PDF rendern** (gleicher Stil wie die Doku v3, gleiche Farben, klare Struktur)
8. **QA der PDF** — Seiten als Bilder prüfen, Layout/Lesbarkeit/Umbrüche checken
9. **Übergabe** — beide Dateien in `/mnt/documents/`, mit Kurz-Zusammenfassung

### Dateien

- `Hello-Mobile-Audit-v1.md`
- `Hello-Mobile-Audit-v1.pdf`

### Was NICHT passiert

- Keine Code-Änderungen
- Keine neuen Features
- Keine Datenbank-Eingriffe
- Keine Entscheidungen vorweggenommen — du bekommst Vorschläge, du entscheidest

### Aufwand

Ein konzentrierter Durchgang. Kein Schnellschuss — gründlich, aber fokussiert. Erwarte ein Dokument von ca. 15–25 Seiten PDF.

### Danach

Du liest in Ruhe, ergänzt deine eigenen Beobachtungen aus dem Handy-Test, und dann setzen wir uns hin und priorisieren gemeinsam, was als Erstes umgesetzt wird.
