// Wörterbuch-Lookup (Deutsch ↔ Englisch) via Lovable AI
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

    const { word } = await req.json();
    if (!word || typeof word !== "string" || word.trim().length === 0 || word.length > 80) {
      return new Response(JSON.stringify({ error: "Bitte ein Wort oder eine kurze Phrase angeben" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY fehlt");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You translate single words or short phrases between German and English for a learner app. Detect the source language automatically. Always return concise output via the provided tool.",
          },
          { role: "user", content: `Übersetze: "${word.trim()}"` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "translate_result",
            description: "Return a structured translation result.",
            parameters: {
              type: "object",
              properties: {
                source_lang: { type: "string", enum: ["de", "en"] },
                german: { type: "string", description: "The German word/phrase." },
                english: { type: "string", description: "The English word/phrase." },
                part_of_speech: { type: "string", description: "Short word type, e.g. 'noun', 'verb', 'adjective', 'phrase'." },
                example_de: { type: "string", description: "Short German example sentence using the word." },
                example_en: { type: "string", description: "Short English example sentence using the word." },
                note: { type: "string", description: "Optional brief grammar/usage hint, e.g. 'der/die/das' or irregular form. Empty if not needed." },
              },
              required: ["source_lang", "german", "english", "part_of_speech", "example_de", "example_en"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "translate_result" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Zu viele Anfragen. Bitte gleich nochmal versuchen." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI-Guthaben aufgebraucht." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("translate-word AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Übersetzung fehlgeschlagen" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await aiResp.json();
    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Keine Übersetzung erhalten" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let result;
    try { result = JSON.parse(toolCall.function.arguments); }
    catch {
      return new Response(JSON.stringify({ error: "Antwort konnte nicht gelesen werden" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-word error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
