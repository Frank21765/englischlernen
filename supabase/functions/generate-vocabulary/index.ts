// Vokabel-Generator via Lovable AI
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- Auth-Check: nur eingeloggte Nutzer dürfen das AI-Budget verbrauchen ---
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

    const { level, topic, existing } = await req.json();
    if (!level || !topic) {
      return new Response(JSON.stringify({ error: "level und topic erforderlich" }), {
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

    const systemPrompt = `Du bist ein erfahrener Spanischlehrer für deutschsprachige Lernende. Du erstellst hochwertige Vokabel- und Satzpaare passend zu einem Niveau (CEFR-ähnlich, A1 bis C3) und einem Thema. Niveau-Logik: A1-A3 = einfache Wörter und kurze Sätze, B1-B3 = mittlere Sätze mit gängiger Grammatik, C1-C3 = komplexe Strukturen, idiomatische Wendungen. Die Grammatiknotiz ist optional und kurz (max. 1 Satz, auf Deutsch).`;

    const userPrompt = `Erstelle GENAU 20 deutsch-spanische Lernpaare für Niveau ${level} zum Thema "${topic}".${avoidBlock}\n\nMische Einzelvokabeln und kurze Beispielsätze. Keine Duplikate. Nutze die Funktion vocabulary_pairs.`;

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
                        spanish: { type: "string" },
                        grammar_note: { type: "string" },
                      },
                      required: ["german", "spanish"],
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
