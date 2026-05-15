// Grammatik-Lektion + Übungen für deutschsprachige Englischlernende
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Package 5 — Explanation Quality Upgrade
// Gemeinsame Rezeptur, die in jeden Erklärungs-Prompt injiziert wird.
// Ziel: weg von Lehrbuch-Definitionen, hin zu Tutor-Erklärungen mit AHA-Moment.
const EXPLANATION_RECIPE = `ERKLÄRUNGS-REZEPTUR (für "explanation"):
Wähle den Typ und folge dem jeweiligen Mini-Format. Schreibe wie ein guter privater Tutor — nicht wie ein Grammatikbuch.

- "contrast" (DE↔EN unterscheidet sich):
  Format: "DE: <deutsche Form>. EN: <englische Form>. → <der entscheidende Unterschied>"
  Pflicht: konkretes deutsches Wort/Satzteil nennen (z.B. "seit", "schon", Perfekt).
- "pattern" (Form verallgemeinern):
  Format: "Form: <Regel>. Gilt immer wenn <Trigger>."
  Pflicht: einen wiederverwendbaren Auslöser nennen, kein Lehrbuch-Satz.
- "trap" (typischer deutscher Fehler):
  Format: "Deutscher Reflex: <falsche EN-Form>. Korrekt: <richtige Form>. Grund: <kurz>."
  Pflicht: den deutschen Denkfehler explizit benennen.
- "function" (was leistet die Form kommunikativ):
  Format: "Funktion: <was sagt der Sprecher damit>. Genau dann, wenn <Situation>."
  Pflicht: eine konkrete Sprech-Situation, nicht nur "wird verwendet".
- "register" (klingt unnatürlich):
  Format: "<falsch> klingt wie <vergleich>. Natürlich: <besser>."
- "mnemonic" (Eselsbrücke):
  Format: "Merksatz: <kurz, bildhaft>. Anker: <warum es haftet>."
- "chunk" (feste Wendung):
  Format: "Feste Wendung: <chunk>. Immer mit <festes Element>."

AHA-PFLICHT: Jede Erklärung muss EINEN Aha-Moment auslösen — etwas, das ein deutscher Lerner nicht schon ahnt. Wenn die Erklärung auch ohne die Übung wahr wäre, ist sie zu generisch.

VERBOTEN (führt zu Verwerfen):
- "wird (im Englischen) verwendet, um …"
- "beschreibt eine Routine / Gewohnheit / allgemeine Wahrheit"
- "man benutzt / verwendet / nimmt hier …"
- "drückt aus, dass …"
- "im Englischen sagt/nutzt man …"
- "Diese Option ist korrekt", "passt am besten", "ist die richtige Wahl"
- Reine Wiederholung der richtigen Antwort.

PFLICHT: Form benennen UND entweder deutschen Kontrast ODER Sprech-Funktion ODER expliziten Denkfehler nennen.`;


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: profile } = await supabase
      .from("profiles").select("access_status, valid_until")
      .eq("user_id", claims.claims.sub).maybeSingle();
    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", claims.claims.sub);
    const isAdmin = (roles ?? []).some((r: { role: string }) => r.role === "admin");
    if (!isAdmin) {
      if (profile?.access_status === "blocked") {
        return new Response(JSON.stringify({ error: "Zugang gesperrt" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (profile?.valid_until && new Date(profile.valid_until) < new Date()) {
        return new Response(JSON.stringify({ error: "Zugang abgelaufen" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { level, topic, mode } = await req.json();
    const validLevels = ["A1","A2","B1","B2","C1","C2"];
    if (!level || !validLevels.includes(level)) {
      return new Response(JSON.stringify({ error: "Gültiges CEFR-Niveau (A1–C2) erforderlich" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY fehlt");

    const isQuiz = mode === "quiz";
    const topicHint = topic ? ` Wenn es sinnvoll ist, beziehe Beispiele lose auf das Thema "${topic}".` : "";

    const cefrGuide = `CEFR-Leitfaden (welche Grammatik passt — STRENG einhalten, KEIN Material aus tieferen Stufen mischen):
- A1: be/have, Pronomen, Artikel, simple present, einfache Fragen, Plural, einfache Präpositionen.
- A2: simple past (regulär/irregulär), was/were, can/must/should, going to, einfache Komparative, some/any, Häufigkeitsadverbien.
- B1: Present Perfect vs Simple Past, since/for, already/yet/just, Past Continuous vs Simple Past, 1st Conditional, will vs going to, Relativsätze (who/which/that), Passiv (Present/Past Simple), used to, Reported Speech (Aussagen), Gerund vs Infinitiv (Basics), Phrasal Verbs in Kontext, state vs process verbs ("is getting"). NIEMALS A1/A2-Niveau wie bloßes "go/went/gone" oder "can/could" als Hauptfrage — nur in kontrastiver/anspruchsvoller Form (z.B. Present Perfect mit Zeitmarker).
- B2: Present Perfect Continuous, Past Perfect, 2nd/3rd Conditional, Mixed Conditionals (Einstieg), Reported Speech (Fragen/Befehle), Passiv (alle Zeiten), Modalverben der Vergangenheit (must have / could have / should have), wish/if only, Causative (have sth done), nuanciertes Tempus, Diskursmarker (although/however/despite), defining vs non-defining Relativsätze, idiomatische Grammatik.
- C1: inversion, mixed conditionals, advanced linking words, cleft sentences, nuancierter Modalgebrauch, formelle Strukturen.
- C2: stilistische Inversion, advanced collocations, fortgeschrittene formelle vs informelle Register, idiomatische Strukturen.

NIVEAU-CHECK vor jeder Frage: "Würde ein A2-Lerner das schon können?" Wenn JA und du baust für B1/B2 → verwerfen und schwierigere Variante wählen.`;

    if (isQuiz) {
      const wordLimit = level === "A1" ? 25 : level === "A2" ? 35 : level === "B1" ? 50 : 70;
      const systemPrompt = `Du erstellst Englisch-Grammatik-Quizfragen für deutschsprachige Lernende.
${cefrGuide}
Erzeuge GENAU 8 Multiple-Choice-Fragen passend zu Niveau ${level}.${topicHint}
Jede Frage hat 4 Optionen, GENAU EINE richtige Antwort.

${EXPLANATION_RECIPE}

ELLIE-FORMAT (Audit Welle 1) — Fokus der Erklärung:
- Erkläre primär: "Warum war die falsche Antwort verlockend (deutscher Reflex)?", NICHT "Warum ist richtig richtig?"
- contrastDE: nutze 🇩🇪-Anker, z.B. "🇩🇪 'seit 2010' verleitet zu 'since 2010' im Simple Past — englisch braucht aber Present Perfect."
- trapNote: nutze ✗ falsch / ✓ richtig mit kurzem Kontrast, z.B. "✗ I have hunger  ✓ I'm hungry — DE 'Hunger haben' ≠ EN."

Wortlimit für "short": A1=25, A2=35, B1=50, B2=70 Wörter. Halte das Limit für Niveau ${level} ein.`;

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Erstelle 8 Grammatik-Quizfragen für Niveau ${level}.` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "grammar_quiz",
              description: "8 Grammatik-Quizfragen mit typed explanations",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        prompt: { type: "string", description: "Die Frage oder der Satz mit Lücke (Englisch)." },
                        options: { type: "array", items: { type: "string" }, description: "Genau 4 Antwortoptionen." },
                        correct: { type: "string", description: "Die richtige Option (exakt wie in options)." },
                        explanation: {
                          type: "object",
                          description: "Typed pedagogical explanation. KEINE Floskeln.",
                          properties: {
                            type: { type: "string", enum: ["pattern","function","contrast","trap","chunk","register","mnemonic"] },
                            short: { type: "string", description: `1–2 Sätze auf Deutsch (max ${wordLimit} Wörter), konkrete Regel/Funktion.` },
                            contrastDE: { type: "string", description: "Optional: DE↔EN Unterschied." },
                            trapNote: { type: "string", description: "Optional: typische deutsche Falle." },
                            generalization: { type: "string", description: "Optional: wiederverwendbarer Lernanker." },
                          },
                          required: ["type", "short"],
                          additionalProperties: false,
                        },
                      },
                      required: ["prompt", "options", "correct", "explanation"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "grammar_quiz" } },
        }),
      });

      if (!aiResp.ok) {
        if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Zu viele Anfragen." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI-Guthaben aufgebraucht." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "AI-Aufruf fehlgeschlagen" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const data = await aiResp.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("Keine strukturierte Antwort");
      const args = JSON.parse(toolCall.function.arguments);
      const questions = (args.questions ?? []).slice(0, 8);
      return new Response(JSON.stringify({ questions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Lesson mode — pick a varied grammar focus per level so users don't always get the same topic.
    const topicsByLevel: Record<string, string[]> = {
      A1: [
        "to be (am/is/are)", "to have (have/has)", "Personalpronomen", "Possessivpronomen (my/your/his/her)",
        "Artikel a/an/the", "Plural von Nomen", "Simple Present (Aussage)", "Simple Present (Frage & Verneinung)",
        "this/that/these/those", "there is / there are", "can (Fähigkeit)", "Präpositionen (in/on/at)",
        "Imperativ", "Uhrzeit & Zahlen",
      ],
      A2: [
        "Simple Past (regelmäßige Verben)", "Simple Past (unregelmäßige Verben)", "Past von to be (was/were)",
        "Present Continuous", "Simple Present vs Present Continuous", "going to – Future",
        "will – Future (Spontanentscheidung)", "Komparativ & Superlativ", "much/many/a lot of",
        "some/any", "Adverbien der Häufigkeit", "must / have to", "should (Ratschlag)",
        "Possessiv-'s", "Object pronouns (me/him/her/us/them)",
      ],
      B1: [
        "Present Perfect (Erfahrung)", "Present Perfect vs Simple Past", "for / since",
        "Past Continuous", "Past Continuous vs Simple Past", "1st Conditional",
        "will vs going to", "Modalverben (could/might/should/must)", "Relativsätze (who/which/that)",
        "Passiv (Present & Past Simple)", "used to", "Reported Speech (Aussagen)",
        "Gerund vs Infinitiv (Basics)", "too / enough",
      ],
      B2: [
        "Present Perfect Continuous", "Past Perfect", "Past Perfect Continuous",
        "2nd Conditional", "3rd Conditional", "Mixed Conditionals (Einstieg)",
        "Reported Speech (Fragen & Befehle)", "Passiv (alle Zeiten)", "Gerund vs Infinitiv (vertieft)",
        "Modalverben der Vergangenheit (must have / could have / should have)",
        "Linking words (although/however/despite)", "Relativsätze (defining vs non-defining)",
        "wish / if only", "have something done (Causative)",
      ],
      C1: [
        "Inversion nach negativen Adverbien", "Mixed Conditionals", "Cleft sentences (It is … that …)",
        "Advanced linking (notwithstanding, hence, thereby)", "Subjunctive (formelle Strukturen)",
        "Modalverben für nuancierte Wahrscheinlichkeit", "Participle clauses",
        "Emphatic structures (do/does/did + Infinitiv)", "Ellipsis & Substitution",
        "Hedging language", "Discourse markers", "Advanced passives (be said to / be reported to)",
      ],
      C2: [
        "Stilistische Inversion", "Fronting & Cleft (vertieft)", "Idiomatische Konditionalstrukturen",
        "Advanced collocations & Kollokationsdichte", "Register-Wechsel (formell ↔ informell)",
        "Subjunctive in formellen Kontexten", "Komplexe Nominalisierung",
        "Diskursorganisation (cohesion devices)", "Hedging & Stance markers (akademisch)",
        "Advanced Modalität (would / might well / may very well)",
      ],
    };
    const pool = topicsByLevel[level] ?? topicsByLevel.A2;
    const focus = pool[Math.floor(Math.random() * pool.length)];

    const lessonWordLimit = level === "A1" ? 25 : level === "A2" ? 35 : level === "B1" ? 50 : 70;
    const systemPrompt = `Du bist ein freundlicher Englischlehrer für deutschsprachige Lernende.
${cefrGuide}
WICHTIG: Behandle in dieser Lektion GENAU dieses Grammatikthema: "${focus}" (Niveau ${level}). Wähle KEIN anderes Thema.${topicHint}
Liefere eine kurze, klare Lektion: typisierte Erklärung (Objekt), 3 Beispielsätze (Englisch + deutsche Übersetzung), 1 typischer Fehler mit Korrektur, 3 kleine Übungssätze (Englisch mit einer Lücke __, plus richtiger Antwort und kurzer Hinweis).

${EXPLANATION_RECIPE}

"short": 1–2 Sätze auf Deutsch (max ${lessonWordLimit} Wörter). Halte das Wortlimit ein.

Halte alles freundlich und lernerfreundlich, KEIN Fachjargon-Overload.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Erstelle eine Grammatik-Lektion für Niveau ${level}.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "grammar_lesson",
            description: "Eine kurze Grammatik-Lektion mit Übungen",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Name des Grammatikthemas auf Deutsch, z.B. 'Present Perfect vs Simple Past'." },
                explanation: {
                  type: "object",
                  description: "Typisierte Erklärung auf Deutsch",
                  properties: {
                    type: { type: "string", enum: ["pattern", "function", "contrast", "trap", "chunk", "register", "mnemonic"] },
                    short: { type: "string" },
                    contrastDE: { type: "string" },
                    trapNote: { type: "string" },
                    generalization: { type: "string" },
                  },
                  required: ["type", "short"],
                  additionalProperties: false,
                },
                examples: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      en: { type: "string" },
                      de: { type: "string" },
                    },
                    required: ["en", "de"],
                    additionalProperties: false,
                  },
                  description: "3 Beispielsätze.",
                },
                common_mistake: {
                  type: "object",
                  properties: {
                    wrong: { type: "string", description: "Typischer Fehler (Englisch)." },
                    correct: { type: "string", description: "Richtige Form (Englisch)." },
                    why: { type: "string", description: "Kurze Erklärung auf Deutsch." },
                  },
                  required: ["wrong", "correct", "why"],
                  additionalProperties: false,
                },
                practice: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      sentence: { type: "string", description: "Englischer Satz mit '__' für die Lücke." },
                      answer: { type: "string", description: "Das Wort/die Wörter, die in die Lücke gehören." },
                      hint: { type: "string", description: "Kurzer Hinweis auf Deutsch." },
                    },
                    required: ["sentence", "answer", "hint"],
                    additionalProperties: false,
                  },
                  description: "3 Übungssätze.",
                },
              },
              required: ["title", "explanation", "examples", "common_mistake", "practice"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "grammar_lesson" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Zu viele Anfragen." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI-Guthaben aufgebraucht." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await aiResp.text();
      console.error("generate-grammar AI", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI-Aufruf fehlgeschlagen" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Keine strukturierte Antwort");
    const lesson = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ lesson }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-grammar error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
