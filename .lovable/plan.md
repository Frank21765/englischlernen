# Strategie-Plan v2: Vokabel-Quelle für „Hello!"
*Otto's überarbeiteter Vorschlag nach Frank's Klarstellung*

---

## 🎯 Klare Entscheidung statt drei Optionen

Frank hat den Markt sauber analysiert — wir machen es uns nicht unnötig schwer:

- **Zielgruppe:** A1–B2 Lerner (Beruf, Uni, Alltag, Auswanderer, Expats)
- **C1:** später, optional, als „goldener Tropfen" — kein MVP-Thema
- **C2:** komplett gestrichen — diese Lerner brauchen keine App
- **Lizenz:** Es gibt fertige, kommerziell nutzbare DE/EN-Datenbanken **bis B2** zu kaufen. Genau das holen wir uns.
- **KI bleibt Helfer:** Beispielsätze, Ellie-Erklärungen, Lückentexte, Quizfragen — alles wo KI sicher und stark ist.

**Strategie in einem Satz:**
> Gekaufte Master-Wortliste A1–B2 als Fundament, KI für alles drumherum.

---

## ✅ Was sich dadurch ändert (vs. heute)

| Bereich | Heute | Nach Umstellung |
|---|---|---|
| Vokabeln | KI generiert pro User | Aus lizenzierter Master-Liste |
| Beispielsätze | KI generiert | KI generiert (bleibt) |
| Lückentexte | KI generiert | KI auf Master-Vokabeln basierend |
| Ellie-Erklärungen | KI generiert | KI generiert (bleibt) |
| Karo's Aufwand | Theoretisch alles prüfen | Stichproben reichen |
| AI-Kosten | Wachsen mit Usern | Bleiben niedrig (nur Ableitungen) |
| Halluzinations-Risiko | Vorhanden | Bei Vokabeln = 0 |

---

## 🛠️ Umsetzung in 3 Phasen

### Phase V1 — Liste beschaffen *(Frank + Alex)*
- Konkrete Anbieter recherchieren (Hueber, Klett, Cornelsen, Cambridge, Oxford, EFLIT, kaikki.org, etc.)
- Lizenzbedingungen prüfen: **kommerzielle Nutzung in App** muss erlaubt sein
- Format: idealerweise CSV/Excel, sonst PDF→Otto konvertiert
- **Lieferumfang:** A1, A2, B1, B2 — sortiert nach Niveau, idealerweise auch Themen
- **Output:** Eine Datei, die Otto importieren kann

### Phase V2 — Datenmodell + Import *(Otto)*
- Neue Tabelle `master_vocabulary`:
  - `level` (A1, A2, B1, B2)
  - `topic` (Alltag, Reise, Arbeit, …)
  - `german`, `english`
  - `grammar_note` (optional)
  - `source` (welche Liste), `license_ref` (für Compliance)
- RLS: lesbar für alle eingeloggten User
- Import-Script: CSV → Supabase (idempotent, damit Re-Imports gehen)
- Indexe auf `(level, topic)` für schnelle Queries

### Phase V3 — Edge Function umbauen *(Otto)*
- `generate-vocabulary` zieht künftig aus `master_vocabulary`
- KI-Aufruf nur noch für: Beispielsatz + Grammar-Note **pro Wort**
- Fallback: Wenn keine Master-Vokabeln zum Topic vorhanden → KI wie bisher (Notnagel für seltene Themen)
- Cache: gleiche Wörter werden nicht doppelt verarbeitet
- `generate-cloze` und `generate-puzzle` ziehen ebenfalls aus Master-Liste

---

## 🎯 C1 — der goldene Tropfen (später)

**Nicht jetzt, aber nicht vergessen:**
- Wenn die App läuft und Frank sieht, dass User wirklich B2 abschließen → C1 nachkaufen
- Positionierung: „Premium-Stufe für Fortgeschrittene"
- Möglicher Trigger: User hat 80% der B2-Vokabeln gelernt → Upgrade-Prompt
- Bis dahin: kein Code, keine Liste, kein Aufwand

**C2 = nicht geplant.** Wer C2 spricht, braucht kein Vokabel-Training mehr.

---

## 💪 Warum das die richtige Entscheidung ist

1. **Realismus:** Frank kennt seinen Markt (Karo, Indonesien, internationales Unternehmen). Datenbasis ist solide.
2. **Risiko ↓:** Lizenz-Liste = juristisch sauber, qualitativ geprüft, kein Halluzinations-Stress.
3. **Aufwand ↓:** 4 Niveaus statt 6, klare Sortierung, einmaliger Import.
4. **Kosten ↓:** Einmalig ~50–200 € statt monatlich wachsende AI-Kosten.
5. **Karo entlastet:** Stichproben statt jede Vokabel.
6. **KI bleibt sinnvoll eingesetzt:** für genau das, wo sie glänzt (Erklärungen, personalisierte Beispiele).

---

## 📋 Was Frank jetzt tun kann

1. **Liste suchen:** Welche Anbieter hast du im Netz gesehen? Schick Otto die Links/Namen.
2. **Budget setzen:** Was ist dir die Liste wert? (Otto's Tipp: bis ~200 € wäre fair)
3. **Lizenz checken (lassen):** Bei Anbieter-Auswahl unbedingt „kommerzielle App-Nutzung" bestätigen lassen — schriftlich.

**Sobald die Liste da ist, baut Otto V2 + V3 in 1 Sprint (≈ 2–3 Sessions).**

---

## ❌ Was wir verwerfen

- Aktuell: KI generiert alle Vokabeln (zu riskant, zu teuer auf Dauer)
- Vorher diskutiert: Hybrid mit KI für A1/A2 (überflüssig, wenn Liste eh A1–B2 abdeckt)
- C2-Support (kein Markt)

---

*Plan v2 · erstellt von Otto · Werkbank · nach Frank's Marktklärung · Endentscheidung: Frank + Otto*
