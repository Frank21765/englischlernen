## Plan: Vorbereitungsdokument Phase 3 (Grundwortschatz) + Skizze Phase 4 (Grammatik)

### Ziel

Ein gründlich recherchiertes Vorbereitungsdokument als **Markdown + PDF**, das klärt:
- Welche Wortlisten wir nehmen (Oxford 3000/5000 oder Alternativen)
- Wie die Lizenz aussieht (kommerziell nutzbar?)
- Welches Datenformat (CSV/JSON, Felder, Struktur)
- Wie wir importieren und mit der App verbinden
- Erste grobe Skizze Phase 4 (Grammatik-Themen nach CEFR)

**Wichtig:** Keine Code-Änderungen, keine Datenbank-Änderungen. Nur Recherche + Dokument.

### Ablage

Beide Dateien landen unter `/mnt/documents/` und sind über **Files** in Lovable einsehbar/herunterladbar:
- `Hello-Phase3-Grundwortschatz-v1.md`
- `Hello-Phase3-Grundwortschatz-v1.pdf`

### Was ich recherchiere

**Wortlisten:**
1. **Oxford 3000 / Oxford 5000** — offizielle Quelle (Oxford Learner's Dictionaries) prüfen, Lizenzbedingungen lesen, Verfügbarkeit als Liste/Download checken
2. **Falls Lizenz problematisch ist:** Alternativen prüfen
   - **NGSL** (New General Service List) — frei, akademisch, sehr gut dokumentiert
   - **GSL** (General Service List, klassisch)
   - **CEFR-J Wordlist** (frei, japanische Forschung, CEFR-sortiert)
3. Vergleich der Optionen: Vollständigkeit, CEFR-Zuordnung, Lizenz, Format

**Datenstruktur:**
- Welche Felder pro Wort (Englisch, Deutsch, CEFR-Niveau, Wortart, Aussprache IPA, Beispielsatz)
- Wie deutsche Übersetzungen ergänzen (offizielle Quellen vs. KI-generiert mit Prüfung)

**App-Integration:**
- Neue Tabelle `curated_vocabulary` (geteilt, read-only für alle Nutzer)
- Wie bestehende Vokabel-Logik angepasst wird (Kern-Wortschatz zuerst, KI ergänzt)
- Neuer Lernmodus „Grundwortschatz nach Niveau"

**Phase 4 Skizze (nur grob):**
- Grammatik-Themen nach CEFR (A1: to be, Artikel, Plural, Present Simple … B1: Conditionals, Passiv … B2: Reported Speech, Mixed Conditionals)
- Inspiration aus Cambridge/CEFR-Curricula (frei zugängliche Übersichten), **nicht** aus geschützten Büchern
- Hinweis: Detail-Plan kommt in einer eigenen späteren Phase

### Format des Dokuments

1. **Zusammenfassung** (1 Seite, was empfehle ich, warum)
2. **Wortlisten-Vergleich** (Tabelle: Oxford vs. NGSL vs. CEFR-J — Lizenz, Umfang, Niveau-Sortierung, Format)
3. **Empfehlung** mit Begründung
4. **Datenstruktur-Vorschlag** (Tabellen-Schema, Beispiel-Zeilen)
5. **Übersetzungs-Strategie** (wie kommen deutsche Übersetzungen rein, wer prüft)
6. **App-Logik-Änderungen** (wie sich Vokabel-Lernmodus verhält)
7. **Aufwand-Schätzung** (klein/mittel/groß je Schritt)
8. **Phase 4 Skizze** (Grammatik-Themen-Liste nach Niveau, ca. 1–2 Seiten)
9. **Offene Fragen** (was wir vor Phase 3 noch entscheiden müssen)

### Vorgehen (im Build-Modus, nach deiner Freigabe)

1. Web-Recherche zu Oxford 3000/5000 (offizielle Seite, Lizenztext)
2. Web-Recherche zu Alternativen (NGSL, GSL, CEFR-J)
3. Stichproben-Download/Sichtung der Listen, Format prüfen
4. Recherche zu deutschen Übersetzungs-Quellen (z. B. dict.cc-Lizenz, Wiktionary)
5. CEFR-Grammatik-Curriculum-Übersicht recherchieren (Cambridge English, Council of Europe)
6. Alles in Markdown strukturiert schreiben
7. Markdown → PDF rendern (gleicher Stil wie Mobile-Audit, klare Typo, Tabellen)
8. **PDF-QA**: Seiten zu Bildern konvertieren, Layout/Tabellen/Umbrüche prüfen
9. Übergabe mit kurzer Zusammenfassung im Chat

### Was NICHT passiert

- Keine Datenbank-Änderungen
- Kein Datenimport
- Keine Code-Änderungen an der App
- Keine Entscheidungen für dich vorweggenommen — du bekommst Empfehlungen, du entscheidest
- Kein Detail-Plan für Phase 4 (kommt später, eigener Plan)

### Aufwand

Konzentrierter Recherche-Durchgang. Erwarte ein PDF von ca. 10–15 Seiten.

### Danach

Du liest, entscheidest, welche Wortliste wir nehmen, und ob wir Phase 3 direkt nach dem Mobile-Umbau starten — oder zuerst Phase 2 (deine Bug-Liste).
