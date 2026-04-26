# Strategie-Plan: Vokabel-Quelle für „Hello!"
*Otto's Vorschlag zur Diskussion mit Frank, Alex & Perplexity*

---

## 🎯 Ausgangslage

Aktuell werden **alle Vokabeln per KI on-the-fly generiert** (`generate-vocabulary` Edge Function, Gemini 2.5 Flash). Das bedeutet:
- ✅ Flexibel, dynamisch, themenbezogen
- ❌ Qualität schwankt, Halluzinations-Risiko, keine Garantie
- ❌ Karo müsste theoretisch jede Vokabel prüfen
- ❌ Bei Wachstum steigen AI-Kosten linear

Frank's Sorge: **„Was, wenn die KI falsch übersetzt? Ist das kommerziell safe?"** → Berechtigt.

---

## 📋 Drei Optionen zur Entscheidung

### Option A — Vollkauf (lizenzierte Master-Liste A1–C2)
Komplette Wortlisten kaufen, KI nur noch für Beispielsätze nutzen.

- **Kosten:** ~100–300 € einmalig (je nach Anbieter)
- **Aufwand:** 1 Sprint Import + Umbau
- **Qualität:** ⭐⭐⭐⭐⭐
- **Risiko:** Statisch, weniger Personalisierung

### Option B — KI behalten + Validierungs-Layer
Aktuelles System bleibt, aber Karo bekommt ein Review-Tool zum Freigeben/Ablehnen.

- **Kosten:** 0 € extra, aber Karos Zeit
- **Aufwand:** 1–2 Sprints (Review-UI + Workflow)
- **Qualität:** ⭐⭐⭐⭐ (mit Geduld)
- **Risiko:** Karo wird Engpass, Skalierung schwierig

### Option C — Hybrid (Otto's Empfehlung)
Master-Liste für **B2 + C1** kaufen, **A1/A2** weiter mit KI, **Beispielsätze immer KI-generiert**.

- **Kosten:** ~50–150 € einmalig (nur 2 Levels)
- **Aufwand:** 1 Sprint
- **Qualität:** ⭐⭐⭐⭐⭐ wo's zählt, ⭐⭐⭐ wo Risiko gering
- **Risiko:** Niedrig, weil Anfänger-Vokabeln simpler sind

---

## 🛠️ Phasen (falls Option A oder C gewählt wird)

### Phase V1 — Listen recherchieren & kaufen *(Frank + Alex)*
- Kandidaten prüfen: Hueber, Klett, Cornelsen, Cambridge, Oxford, EFLIT, etc.
- Lizenz-Bedingungen checken (kommerzielle Nutzung in App!)
- Format prüfen (CSV idealerweise, sonst PDF→OCR)
- **Output:** 1–2 lizenzierte Listen im Haus

### Phase V2 — Datenmodell & Import *(Otto)*
- Neue Tabelle `master_vocabulary`:
  - `level` (A1–C2), `topic`, `german`, `english`, `grammar_note`, `source`, `license_ref`
- RLS: nur lesbar für eingeloggte User
- Import-Script: CSV → Supabase
- Indizierung für schnelle Topic-Queries

### Phase V3 — Edge Function umbauen *(Otto)*
- `generate-vocabulary` zieht künftig aus `master_vocabulary` statt zu halluzinieren
- KI-Aufruf nur noch für: Beispielsätze + Grammar-Note pro Wort
- Fallback: Wenn keine Master-Vokabeln zum Topic vorhanden → KI wie bisher
- Cache-Mechanismus, damit gleiche Wörter nicht doppelt generiert werden

### Phase V4 — Karo's Review-Dashboard (optional, parallel) *(Otto)*
- Admin-Bereich: „neue KI-generierte Vokabeln" → Approve/Edit/Reject
- Approved Vokabeln wandern in `master_vocabulary` mit `source: "Karo-approved"`
- Wächst die Master-Liste organisch über Zeit

### Phase V5 — B2/C1 Fokus-Marketing *(Frank + Alex)*
- App-Beschreibung schärfen: „Englisch für Beruf & Uni"
- Onboarding: B2 als Default vorschlagen
- C1 als „Premium-Stufe" positionieren
- A1/A2 als „Einstiegs-Bonus" benennen

---

## ❓ Offene Fragen für die Diskussion

1. **Welche Option** — A, B oder C? *(Otto tendiert zu C)*
2. **Budget** — wie viel ist Frank bereit, einmalig zu investieren?
3. **Listen-Recherche** — übernimmt Alex (Markt) oder Perplexity (Anbieter-Check)?
4. **B2-Fokus** — auch in der App-Navigation/Marketing sichtbar machen, oder nur intern?
5. **Karo's Review-Tool** — gleich mitbauen (Phase V4) oder erst später?
6. **A1/A2** — wirklich weiter KI, oder doch auch kaufen wenn günstig?

---

## 🎬 Otto's nächster Schritt (nach Entscheidung)

Sobald die Richtung steht:
1. Otto baut die `master_vocabulary`-Tabelle + Import-Script
2. Frank/Alex liefern die gekaufte Liste
3. Otto integriert sie in `generate-vocabulary`
4. Test mit echten B2-Vokabeln → Frank prüft Qualitätssprung

**Geschätzter Zeitrahmen:** 1 Sprint (≈ 2–3 Sessions) nach Lieferung der Liste.

---

*Plan erstellt von Otto · Werkbank · zur Diskussion mit Frank, Alex, Perplexity · Endentscheidung: Frank + Otto*
