

## Ziel

Hinweise und Erklärungen in den Lektionen werden deutlich tiefer und konkreter — mit echter Mini-Grammatik, einem klaren Tipp zum gesuchten Wort und einem zusätzlichen Beispielsatz.

## Was sich ändert

### 1) Hinweise mit echtem Sinn-Tipp (statt nur Wortart)

Aktuell stehen Hinweise wie *„Hier fehlt genau das Wort, das in dieser Situation üblich ist“* — das hilft beim Beispiel `Free ___ on orders over 50 euros.` nicht weiter.

Neu zeigt jeder Hinweis drei kurze Bausteine:

- **Was für ein Wort** (z. B. „kurzes Strukturwort“, „-ing-Form“, „Adjektiv mit Geschmack“)
- **Bedeutungs-/Sinn-Tipp** in einfachen Worten — wonach der Lerner inhaltlich suchen soll (z. B. „etwas, das beim Versand kostenlos ist“, „Lieferung ohne Extrakosten“)
- **Eine kleine Eingrenzung** (Anfangsbuchstabe, Wortlänge oder eine deutsche Übersetzung in Klammern), damit der Lerner sich erinnert, ohne dass die Lösung verraten wird

Beispiel `Free ___ on orders over 50 euros.`:
> *„Hier fehlt ein Nomen, das beschreibt, was bei Bestellungen über 50 € kostenlos ist — also der Vorgang, wie die Ware zu dir nach Hause kommt. Englisches Wort beginnt mit **sh** und endet auf **-ping**.“*

### 2) Erklärungen mit Mini-Grammatik + zweitem Beispielsatz

Die Erklärung in der Coach-Ellie-Box wird zu einem kleinen Lernbaustein erweitert. Jede Antwort (richtig oder falsch) bekommt jetzt diese Struktur:

1. **Lösung im Satz** — warum „X“ hier passt (1 Satz)
2. *(nur bei falsch)* **Warum die eigene Antwort nicht passt** (1 Satz)
3. **Mini-Grammatik / Wortwissen** — kurze, lerngerechte Regel oder Bedeutungserklärung, z. B. *„‚shipping‘ ist die -ing-Form von ‚to ship‘ und wird im Englischen als Nomen für den Versand benutzt. Viele englische Tätigkeiten werden so zu Nomen: cooking, parking, shopping.“*
4. **Zusätzlicher Beispielsatz** mit Übersetzung, z. B. *„We offer free shipping worldwide. — Wir bieten weltweit kostenlosen Versand.“*
5. *(optional)* Wiederverwendbares Muster (wie heute schon)

Damit hat jede Erklärung 4–5 echte Sätze mit konkretem Lerninhalt — nie nur Floskeln.

### 3) Bessere Abdeckung statt Einzelfälle

Heute sind viele gute Hinweise/Erklärungen an einzelnen Sätzen festgemacht (per `if (task.sentence === ...)`). Das wird umgebaut zu **strukturierten Pattern-Helfern**, die für ähnliche Aufgaben automatisch greifen:

- `-ing`-Formen (working, shipping, parking, …)
- `write down`, `keep updated`, `pick up` u. ä. — Verb + Partikel
- Adjektive aus Nomen (`salt → salty`, `rain → rainy`)
- Strukturwörter (`to`, `for`, `at`, `than`, …) mit konkreter Bedeutungserklärung im jeweiligen Satz
- Feste englische Kollokationen (`good at`, `interested in`, `free shipping`)

So bekommen auch die Aufgaben, die heute nur den generischen Fallback sehen, automatisch einen sinnvollen Tipp und eine echte Mini-Erklärung.

### 4) Hinweis-Box optisch klarer

Der Hinweis bekommt im UI eine zusätzliche zweite Zeile in etwas größerer Schrift für den Sinn-Tipp, damit klar erkennbar ist: *„das hier ist die wichtige Information“*. Stil bleibt vollständig im aktuellen Dark-Theme — keine neue Farbpalette, keine neuen Komponenten.

## Was ausdrücklich erhalten bleibt

- 8 Lektionskarten, Level-Konsistenz, Fortschritt, Häkchen, Wieder-Aufnehmen
- Confetti & Abschluss-Screen, Wiederholen-Optionen, „Schwierige nochmal“ inkl. Zurück-Button
- Coach-Ellie-Box nach jeder Aufgabe + „Frag Ellie“-Button
- Quiz / Grammatik / Lückentext unverändert
- Mobile- und Desktop-Layout, dunkle Optik

## Technische Umsetzung (kurz)

- `src/lib/lessons.ts`
  - Optionales Feld `meaningHint?: string` und `extraExample?: { en: string; de: string }` an `LessonTask` anhängen (rückwärtskompatibel — bestehende Tasks ohne diese Felder bekommen automatisch generierte Inhalte aus den Pattern-Helfern).
  - `getTaskHint` und `getTaskExplanation` umbauen auf:
    - `buildMeaningHint(task)` → Sinn-Tipp + Wort-Hinweis (Anfang/Endung)
    - `buildMiniGrammar(task)` → kurze Regel
    - `buildExtraExample(task)` → zweiter Beispielsatz mit Übersetzung
  - Pattern-Erkennung nach Wortform/Endung statt nach exakter Satz-ID, mit kuratierten Overrides für die wichtigsten Aufgaben (Versand/`shipping`, `working`, `salty`, `write down`, `keep updated`, `call/phone`, …).
- `src/pages/Lektion.tsx`
  - Hinweis-Karte: Zwei Zeilen (Wortart-Tipp + Sinn-Tipp).
  - Coach-Ellie-Feedback-Box: strukturierte Anzeige mit kleiner Trennung zwischen Erklärung, Mini-Grammatik und Beispielsatz (kein neues Design, nur Absätze).

Keine weiteren Dateien werden geändert.

