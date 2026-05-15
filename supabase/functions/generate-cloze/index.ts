// Lückentext-Generator: erstellt englische Sätze mit einer Lücke
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Package 5 — Explanation Quality Upgrade
const EXPLANATION_RECIPE = `ERKLÄRUNGS-REZEPTUR (für "explanation"):
Wähle den Typ und folge dem jeweiligen Mini-Format. Schreibe wie ein guter privater Tutor — nicht wie ein Grammatikbuch.

- "contrast" (DE↔EN unterscheidet sich):
  Format: "DE: <deutsche Form>. EN: <englische Form>. → <der entscheidende Unterschied>"
  Pflicht: konkretes deutsches Wort/Satzteil nennen (z.B. "seit", "schon", Perfekt).
- "pattern" (Form verallgemeinern):
  Format: "Form: <Regel>. Gilt immer wenn <Trigger>."
- "trap" (typischer deutscher Fehler):
  Format: "Deutscher Reflex: <falsche EN-Form>. Korrekt: <richtige Form>. Grund: <kurz>."
- "function" (kommunikative Funktion):
  Format: "Funktion: <was sagt der Sprecher damit>. Genau dann, wenn <Situation>."
- "register": "<falsch> klingt wie <vergleich>. Natürlich: <besser>."
- "mnemonic": "Merksatz: <kurz>. Anker: <warum es haftet>."
- "chunk": "Feste Wendung: <chunk>. Immer mit <festes Element>."

AHA-PFLICHT: Jede Erklärung muss EINEN Aha-Moment auslösen — etwas, das ein deutscher Lerner nicht schon ahnt. Wenn die Erklärung auch ohne die Übung wahr wäre, ist sie zu generisch.

VERBOTEN: "wird verwendet um…", "beschreibt Routinen/Gewohnheiten", "man benutzt/verwendet…", "drückt aus, dass…", "im Englischen sagt man…", "passt am besten", reine Wiederholung der Antwort.

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

    const { level, topic, vocab } = await req.json();
    if (!level || !topic) {
      return new Response(JSON.stringify({ error: "level und topic erforderlich" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY fehlt");

    const vocabList: Array<{ german: string; english: string }> = Array.isArray(vocab) ? vocab.slice(0, 20) : [];
    const vocabBlock = vocabList.length
      ? `\n\nNutze möglichst diese Vokabeln:\n${vocabList.map((v) => `- ${v.english} (${v.german})`).join("\n")}`
      : "";

    const systemPrompt = `Du erstellst Lückentext-Übungen auf Englisch für deutschsprachige Lernende. Niveau ${level}, Thema "${topic}". Markiere in jedem Satz GENAU EIN Wort als Lücke (das wichtige Zielwort, idealerweise eine Vokabel oder ein konjugiertes Verb). Gib zur Hilfe immer die deutsche Übersetzung des ganzen Satzes mit.

"hint" = kurzer Richtungshinweis VOR der Antwort (max. 8 Wörter), gibt die Antwort NICHT preis.
Wähle EINES dieser vier Muster (mit Beispielen):
- DE-Kontrast: "🇩🇪 'seit 3 Jahren' → 'for 3 years'"
- Trigger-Signal: "'yesterday' → Simple Past"
- Formenkürzel: "I/he/she → am/is/are"
- Fallen-Hinweis: "'I have hunger' → 'I'm hungry'"
KEINE generischen Floskeln wie "Verlaufsform" oder "Past Simple" allein. Immer Trigger oder Kontrast nennen.

${EXPLANATION_RECIPE}

Wortlimit für explanation.short: A1=25, A2=35, B1=50, B2=70 Wörter (Niveau: ${level}).`;

    const userPrompt = `Erstelle 10 Lückentext-Sätze auf Englisch für Niveau ${level}, Thema "${topic}". Befolge die Regeln für "hint" und "explanation" aus dem System-Prompt.${vocabBlock}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "cloze_items",
            description: "10 Lückentext-Sätze",
            parameters: {
              type: "object",
              properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        full_sentence: { type: "string" },
                        missing_word: { type: "string" },
                        translation: { type: "string" },
                        hint: {
                          type: "string",
                          description: "Max. 4 Wörter. Nur grammatische Kategorie, keine Erklärung.",
                        },
                        explanation: {
                          type: "object",
                          description: "Typisierte Erklärung nach der Antwort.",
                          properties: {
                            type: {
                              type: "string",
                              enum: ["pattern", "function", "contrast", "trap", "chunk", "register", "mnemonic"],
                            },
                            short: { type: "string", description: "1–2 Sätze, konkrete Regel, KEIN Floskel." },
                            contrastDE: { type: "string", description: "Optional: DE-EN Kontrast." },
                            trapNote: { type: "string", description: "Optional: typische Deutsche Falle." },
                            generalization: { type: "string", description: "Optional: Lernanker mit neuem Beispiel." },
                          },
                          required: ["type", "short"],
                          additionalProperties: false,
                        },
                      },
                      required: ["full_sentence", "missing_word", "translation", "hint", "explanation"],
                      additionalProperties: false,
                    },
                  },
              },
              required: ["items"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "cloze_items" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Zu viele Anfragen." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI-Guthaben aufgebraucht." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI-Aufruf fehlgeschlagen" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Keine strukturierte Antwort erhalten");
    const args = JSON.parse(toolCall.function.arguments);
    const items = (args.items ?? []).slice(0, 10);

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-cloze error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
