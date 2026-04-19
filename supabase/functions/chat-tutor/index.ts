// Coach Ellie – Chat-Tutor (DE/EN) via Lovable AI, mit Streaming
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BASE_SYSTEM_PROMPT = `You are "Coach Ellie", a warm, patient English teacher for German-speaking learners.

Rules:
- By default, answer in German AND give English examples/translations.
- If the user writes to you in English, answer mainly in English and add short German hints in parentheses so they understand.
- Correct mistakes lovingly and show the right version.
- Explain grammar concisely with example sentences.
- Occasionally suggest small exercises or roleplays (e.g. "Order a coffee in a London café – you start!").
- Be motivating, use occasional English exclamations like "Awesome!", "Brilliant!", "Let's go!".
- Keep replies short and friendly (max ~150 words), use Markdown (lists, **bold**, *italic* for English words/phrases).
- For vocab questions: give German meaning, English word, part of speech, and an example sentence.`;

const LEVEL_GUIDANCE: Record<string, string> = {
  A1: "Learner level: A1 (beginner). Use very simple, high-frequency vocabulary. Short sentences (max ~8 words). Present tense mostly. Explain in German with very basic English examples. Avoid idioms and complex grammar.",
  A2: "Learner level: A2 (elementary). Simple vocabulary, common everyday phrases. Short and clear sentences. Use past simple and future with 'will/going to' carefully. Explanations mostly in German with clear English examples.",
  B1: "Learner level: B1 (intermediate). Use common everyday vocabulary plus some less common words with brief explanations. Mix tenses naturally. Encourage the learner to respond in English. Corrections should be gentle but clear.",
  B2: "Learner level: B2 (upper-intermediate). Use varied vocabulary including some idiomatic expressions. Natural sentence complexity. Discuss nuance. Encourage longer English replies. Point out collocations and register.",
  C1: "Learner level: C1 (advanced). Use sophisticated vocabulary, idioms, phrasal verbs and varied register. Discuss subtle nuances, connotation, and style. Push the learner with challenging follow-up questions in English.",
  C2: "Learner level: C2 (proficient). Near-native level. Discuss nuance, style, register, irony, and cultural context. Use advanced vocabulary naturally. Most of the conversation should happen in English; German only for tricky nuances.",
};

function buildSystemPrompt(level?: string, topic?: string): string {
  const parts = [BASE_SYSTEM_PROMPT];
  const lvl = level && LEVEL_GUIDANCE[level] ? level : null;
  if (lvl) parts.push(LEVEL_GUIDANCE[lvl]);
  if (topic && topic.trim()) {
    parts.push(
      `Active learning topic: "${topic.trim()}". When relevant and natural, prefer examples, vocabulary, dialogues and exercises related to this topic. If the learner asks about something else, help them naturally — don't refuse or force the topic.`,
    );
  }
  if (lvl || topic) {
    parts.push(
      `Briefly acknowledge the active context only if it makes sense (don't repeat it every turn). Keep the tutoring style aligned to the level above.`,
    );
  }
  return parts.join("\n\n");
}

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

    // Server-side access check (RLS limits this to the caller's own profile)
    const { data: profile } = await supabase
      .from("profiles")
      .select("access_status, valid_until")
      .eq("user_id", claims.claims.sub)
      .maybeSingle();
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", claims.claims.sub);
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
