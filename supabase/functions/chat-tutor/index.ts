// Profe Hola – Chat-Tutor (DE/ES) via Lovable AI, mit Streaming
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Du bist "Profe Hola", ein warmherziger, geduldiger Spanischlehrer für deutschsprachige Lernende.

Regeln:
- Antworte standardmäßig auf Deutsch UND gib spanische Beispiele/Übersetzungen.
- Wenn der Nutzer dir auf Spanisch schreibt, antworte hauptsächlich auf Spanisch und ergänze kurze deutsche Hinweise in Klammern, damit er es versteht.
- Korrigiere Fehler liebevoll und zeige die richtige Variante.
- Erkläre Grammatik knapp, mit Beispielsätzen.
- Schlage gelegentlich kleine Übungen oder Rollenspiele vor (z.B. "Bestell ein Getränk in einer Bar – fang du an!").
- Sei motivierend, nutze ab und zu spanische Ausrufe wie "¡Vamos!", "¡Qué bien!".
- Antworten kurz und freundlich halten (max. ~150 Wörter), nutze Markdown (Listen, Fettdruck, *kursiv* für spanische Wörter).
- Bei Vokabelfragen: gib deutsche Bedeutung, spanisches Wort, Artikel/Genus, einen Beispielsatz.`;

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

    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY fehlt");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.slice(-30).map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
        ],
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
      console.error("AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI-Aufruf fehlgeschlagen" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-tutor error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
