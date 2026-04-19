// Vokabel-Generator (Deutsch ↔ Englisch) via Lovable AI
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    const { level, topic, existing } = await req.json();
    const validLevels = ["A1","A2","B1","B2","C1","C2"];
    if (!level || !topic || !validLevels.includes(level)) {
      return new Response(JSON.stringify({ error: "Gültiges CEFR-Niveau (A1–C2) und Thema erforderlich" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY fehlt");

    const existingList: string[] = Array.isArray(existing) ? existing.slice(0, 200) : [];
    const avoidBlock = existingList.length
      ? `\n\nVermeide diese bereits gelernten deutschen Begriffe/Sätze:\n${existingList.map((e) => `- ${e}`).join("\n")}`
      : "";

    const cefrGuide = `Strikte CEFR-Niveau-Vorgaben:
- A1: nur die häufigsten Grundwörter; sehr kurze Sätze (3–6 Wörter); simple present, einfache Substantive/Adjektive.
- A2: alltägliche Wörter; kurze Sätze (4–8 Wörter); simple past basics, can/must, going to.
- B1: alltagstaugliches Vokabular mit ein paar weniger häufigen Wörtern; mittlere Sätze (6–12 Wörter); present perfect, will, 1st conditional, Relativsätze.
- B2: differenziertes Vokabular, einige Kollokationen/Phrasal verbs; mittellange Sätze (8–15 Wörter); reported speech, Passiv, 2nd/3rd conditional.
- C1: gehobenes, präzises Vokabular, idiomatische Wendungen; längere/komplexere Sätze; nuancierte Modalverben, inversion in Beispielen wo natürlich.
- C2: sehr nuanciertes, fast muttersprachliches Vokabular, formelle/literarische Wendungen; komplexe Satzstrukturen, register-bewusst.

WICHTIG: Beispielsätze müssen wirklich zum Niveau passen – KEINE A1-Sätze für C1/C2! Inhalt soll natürlich klingen, nicht künstlich kompliziert.`;

    const systemPrompt = `Du bist ein erfahrener Englischlehrer für deutschsprachige Lernende. Du erstellst hochwertige Vokabel- und Satzpaare passend zu CEFR-Niveau (A1–C2) und Thema.
${cefrGuide}
Die Grammatiknotiz ist optional, kurz (max. 1 Satz, Deutsch). Nutze gängiges britisches oder amerikanisches Englisch.`;

    const userPrompt = `Erstelle GENAU 20 deutsch-englische Lernpaare für CEFR-Niveau ${level} zum Thema "${topic}".${avoidBlock}\n\nMische Einzelvokabeln (ca. 8) und Beispielsätze (ca. 12). Sätze MÜSSEN dem Niveau ${level} entsprechen. Keine Duplikate. Nutze die Funktion vocabulary_pairs.`;

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
        tools: [
          {
            type: "function",
            function: {
              name: "vocabulary_pairs",
              description: "Liefert genau 20 Vokabelpaare zurück",
              parameters: {
                type: "object",
                properties: {
                  pairs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        german: { type: "string" },
                        english: { type: "string" },
                        grammar_note: { type: "string" },
                      },
                      required: ["german", "english"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["pairs"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "vocabulary_pairs" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Zu viele Anfragen. Bitte gleich nochmal versuchen." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI-Guthaben aufgebraucht. Bitte im Workspace aufladen." }), {
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
    const pairs = (args.pairs ?? []).slice(0, 20);

    return new Response(JSON.stringify({ pairs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-vocabulary error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
