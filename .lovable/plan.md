## Ziel

Den bestehenden `systemPrompt` für den Quiz-Modus in `supabase/functions/generate-grammar/index.ts` durch deine geschärfte Version ersetzen. Sonst nichts.

## Was sich ändert

**Datei:** `supabase/functions/generate-grammar/index.ts`

Im `if (isQuiz)`-Block wird der aktuelle, lange `systemPrompt` (mit den B1/B2-„Mindestens 5 von 8…"-Vorgaben und dem ausführlichen Explanation-Block) ersetzt durch deinen kompakteren Prompt:

- Klare Typ-Definitionen (contrast / pattern / trap / function / register / mnemonic) als Auswahlhilfe für das Modell.
- Wortlimit pro Niveau direkt im Prompt.
- Verbotene Floskeln explizit gelistet.
- Pflicht: grammatische Form + Funktion ODER deutscher Kontrast.

Der `cefrGuide` (Niveau-Definitionen A1–B2) und das Tool-Schema (`grammar_quiz` mit `explanation: { type, short, contrastDE?, trapNote?, generalization? }`) bleiben **unverändert** — sie sind die strukturelle Grundlage, der neue Prompt ist die didaktische Anweisung obendrauf.

## Was NICHT geändert wird

- Lesson-Modus (Nicht-Quiz) bleibt unangetastet.
- Tool-Schema bleibt identisch.
- Frontend (`Quiz.tsx`, `explanations.ts`) bleibt unangetastet.
- Andere Edge Functions (`generate-cloze`, etc.) bleiben unangetastet.
- Wortlimit-Konstante (`wordLimit`) im Code bleibt — sie wird im Prompt-Template weiterhin als `${wordLimit}` für die Schema-Description gebraucht.

## Risiko / Hinweis

Dein neuer Prompt entfernt die expliziten „Mindestens 5 von 8 Fragen müssen Present Perfect / Conditional / …"-Vorgaben für B1/B2. Der `cefrGuide` enthält weiterhin den NIVEAU-CHECK und das Verbot von A1/A2-Material auf B1/B2 — das sollte reichen, ist aber etwas weniger erzwingend als vorher. Falls B1/B2-Fragen wieder zu leicht werden, fügen wir den „mindestens 5 von 8"-Hinweis als kurze Zeile am Ende wieder ein.

## Nach der Umsetzung

- Edge Function deployen.
- Quiz auf B1 + B2 testen: Erklärungstypen sichtbar, keine Floskeln, Form + Funktion/Kontrast genannt.
