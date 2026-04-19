import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Send, Sparkles, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { awardActivity, celebrate } from "@/lib/gamification";

interface Msg {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Erklär mir den Unterschied zwischen 'do' und 'make'.",
  "Lass uns ein Rollenspiel im Café machen!",
  "Wie bilde ich das Present Perfect richtig?",
  "Gib mir 5 typische Reise-Sätze auf Englisch.",
];

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id,role,content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(100);
      setMessages(
        (data ?? [])
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content })),
      );
    })();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    if (!user || busy) return;
    const content = (text ?? input).trim();
    if (!content) return;
    setInput("");
    const isFirstChat = messages.length === 0;

    const userMsg: Msg = { role: "user", content };
    const optimistic = [...messages, userMsg];
    setMessages(optimistic);
    setBusy(true);

    supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content }).then(() => {});

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-tutor`;

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ messages: optimistic }),
      });

      if (resp.status === 429) {
        toast.error("Zu viele Anfragen. Bitte kurz warten.");
        setMessages(messages);
        return;
      }
      if (resp.status === 402) {
        toast.error("AI-Guthaben aufgebraucht.");
        setMessages(messages);
        return;
      }
      if (!resp.ok || !resp.body) {
        throw new Error("Fehler beim Streamen");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      let done = false;
      while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantText += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistantText };
                return copy;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      if (assistantText.trim()) {
        await supabase.from("chat_messages").insert({
          user_id: user.id,
          role: "assistant",
          content: assistantText,
        });
        const result = await awardActivity(user.id, 5, { firstChat: isFirstChat });
        celebrate(result);
      }
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Fehler beim Chat");
      setMessages(messages);
    } finally {
      setBusy(false);
    }
  };

  const clearHistory = async () => {
    if (!user) return;
    if (!confirm("Wirklich den ganzen Chatverlauf mit Coach Ellie löschen?")) return;
    await supabase.from("chat_messages").delete().eq("user_id", user.id);
    setMessages([]);
    toast.success("Verlauf gelöscht");
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl">Coach Ellie 💬</h1>
          <p className="text-sm text-muted-foreground">
            Dein KI-Tutor. Schreib auf Deutsch oder Englisch – stell Fragen, übe Dialoge, lass dich korrigieren.
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearHistory}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </header>

      <Card className="bg-gradient-card shadow-card flex flex-col h-[60vh] min-h-[400px]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-4 py-6">
              <div className="text-center space-y-2">
                <div className="text-4xl">👩‍🏫</div>
                <p className="font-display text-xl">Hello! I'm Coach Ellie.</p>
                <p className="text-sm text-muted-foreground">Was möchtest du heute lernen?</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left rounded-xl bg-muted hover:bg-muted/70 p-3 text-sm transition-smooth"
                  >
                    <Sparkles className="inline h-3.5 w-3.5 mr-1.5 text-primary" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`rounded-2xl px-4 py-2.5 max-w-[85%] ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none break-words">
                    <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border p-3 flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="What would you like to learn? (Enter zum Senden, Shift+Enter für Zeilenumbruch)"
            className="min-h-[44px] max-h-32 resize-none rounded-xl"
            disabled={busy}
          />
          <Button onClick={() => send()} disabled={busy || !input.trim()} size="icon" className="h-11 w-11 rounded-xl">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}
