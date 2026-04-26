# Sprint 1A — Blocker-Fixes 🔧

Otto, Alex und Perplexity sind sich einig: **erst die Blocker raus, dann der Rest.** Frank, du hast den finalen Call. Hier ist, was Otto in **Sprint 1A** anfasst — eng gehalten, keine Navigation, keine Startseite, kein Wintergarten.

## 🐛 Bug-Fix (neu, von Frank entdeckt)

**1. Multiple-Choice: immer erste Antwort richtig**
- **Ursache gefunden:** In `src/pages/Lektion.tsx` (Zeile 460) werden `task.options` direkt aus `lessons.ts` gerendert. Die `shuffle()`-Funktion existiert zwar (Zeile 64), wird aber nur für Wort-Sortier-Aufgaben verwendet, nie für MC.
- **Fix:** Optionen einmal pro Aufgabe mischen (mit `useMemo`, damit sie beim Re-Render nicht erneut springen) und in stabiler Reihenfolge anzeigen.
- Gilt auch für Quiz/Grammatik-Quiz — Otto checkt parallel, ob dort derselbe Bug schlummert.

## 🔴 Blocker (alle drei Berater einig)

**2. Toast verdeckt „Weiter"-Button**
- Toast-Position so anpassen, dass sie weder „Weiter" noch „Prüfen" verdeckt — auf Mobile am oberen Rand statt unten, oder Button bekommt sicheren `safe-area`-Abstand.

**3. Tastatur springt im Lückentext sofort auf**
- `autoFocus` aus dem Input entfernen. User tippt selbst, wenn er bereit ist.

**4. Vokabel-Platzhalter „z. B. aufgeben" ersetzen**
- Generischer, neutraler Hinweistext statt eines konkreten Wortes (verwirrt Anfänger).

**5. Button-Farben vereinheitlichen**
- „Weiter"/„Prüfen"/„Nächste" überall **primary** (kein Mix aus grün/rot/blau).
- Erfolgs-/Fehler-Feedback bleibt grün/rot, aber **Action-Buttons** sind konsistent.

**6. Groß-/Kleinschreibung im Satzbau & Wortpuzzle vereinheitlichen**
- Eine zentrale Regel: Satzanfang groß, Rest klein (außer Eigennamen).
- Kleine Helper-Funktion in `src/lib/text.ts` (oder direkt in `lessons.ts`-Helpern), damit alle Module dieselbe Logik nutzen.

## 🚫 Was Otto in 1A NICHT anfasst

- Bottom-Tab-Bar (kommt in 1B)
- Startseite-Umbau (kommt in 1C)
- Sub-Tab-Navigation (kommt in 1B)
- Lektionskarten entschlacken (kommt in 1B)
- Skip-Buttons überall (kommt in Sprint 2 — Alex' Vorschlag, weil das mehr Module berührt)

## 📋 Ablauf

1. Otto baut alle 6 Punkte in einem Rutsch (kleine, sichere Edits).
2. Du testest auf dem Handy.
3. Wenn 1A clean ist → Sprint 1B (Mobile-Struktur: Bottom-Nav + Sub-Navs).
4. Dann 1C (Startseite-3-Box).

## 🤔 Offene Frage an Frank

Soll Otto direkt loslegen, oder willst du Alex erst noch einen finalen Bau-Prompt für 1A formulieren lassen? Beides ok — sag einfach Bescheid.

---

**Otto wartet auf grünes Licht.** Wenn du auf „Approve" klickst, baue ich Sprint 1A in einem Aufwasch durch. 🛠️
