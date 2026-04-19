import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLearning } from "@/hooks/useLearningContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChatSessionList } from "@/components/chat/ChatSessionList";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { ChevronDown, Loader2, MessageSquare, Plus, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { awardActivity, celebrate } from "@/lib/gamification";

interface Msg {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
}

const SUGGESTIONS = [
  "Erklär mir den Unterschied zwischen 'do' und 'make'.",
  "Lass uns ein Rollenspiel im Café machen!",
  "Wie bilde ich das Present Perfect richtig?",
  "Gib mir 5 typische Reise-Sätze auf Englisch.",
];

function deriveTitle(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Neuer Chat";
  return cleaned.length > 48 ? cleaned.slice(0, 45) + "…" : cleaned;
}

export default function Chat() {
  const { user } = useAuth();
  const { level, topic, hasSelection } = useLearning();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showSessions, setShowSessions] = useState(false);
  const handledIncomingRef = useRef(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastAssistantRef = useRef<HTMLDivElement>(null);
  const scrollToLastAssistantTop = useRef(false);

  // Load list of sessions; auto-create one if none exist
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("chat_sessions")
        .select("id,title,updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      const list = (data ?? []) as ChatSession[];
      if (list.length === 0) {
        const { data: created } = await supabase
          .from("chat_sessions")
          .insert({ user_id: user.id, title: "Neuer Chat" })
          .select("id,title,updated_at")
          .single();
        if (created) {
          setSessions([created as ChatSession]);
          setActiveId(created.id);
        }
      } else {
        setSessions(list);
        setActiveId(list[0].id);
      }
    })();
  }, [user]);

  // Load messages for the active session
  useEffect(() => {
    if (!user || !activeId) return;
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id,role,content")
        .eq("user_id", user.id)
        .eq("session_id", activeId)
        .order("created_at", { ascending: true })
        .limit(200);
      setMessages(
        (data ?? [])
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content })),
      );
    })();
  }, [user, activeId]);

  useEffect(() => {
    if (scrollToLastAssistantTop.current && lastAssistantRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const target = lastAssistantRef.current;
      const top = target.offsetTop - 8;
      container.scrollTo({ top, behavior: "smooth" });
      scrollToLastAssistantTop.current = false;
    }
  }, [messages]);

  // Handle incoming context from Quiz/Vokabeln/Review (?prefill=...&auto=1&fresh=1)
  useEffect(() => {
    if (!user || handledIncomingRef.current) return;
    const prefill = searchParams.get("prefill");
    if (!prefill) return;
    const auto = searchParams.get("auto") === "1";
    const fresh = searchParams.get("fresh") !== "0";
    handledIncomingRef.current = true;

    (async () => {
      let targetId = activeId;
      if (fresh) {
        const { data: created } = await supabase
          .from("chat_sessions")
          .insert({ user_id: user.id, title: "Neuer Chat" })
          .select("id,title,updated_at")
          .single();
        if (created) {
          setSessions((prev) => [created as ChatSession, ...prev]);
          setActiveId(created.id);
          setMessages([]);
          targetId = created.id;
        }
      }
      const next = new URLSearchParams(searchParams);
      next.delete("prefill");
      next.delete("auto");
      next.delete("fresh");
      setSearchParams(next, { replace: true });

      if (auto && targetId) {
        setTimeout(() => { void send(prefill); }, 60);
      } else {
        setInput(prefill);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeId, searchParams]);

  const refreshSessions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_sessions")
      .select("id,title,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    setSessions((data ?? []) as ChatSession[]);
  };

  const newChat = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, title: "Neuer Chat" })
      .select("id,title,updated_at")
      .single();
    if (data) {
      setSessions((prev) => [data as ChatSession, ...prev]);
      setActiveId(data.id);
      setMessages([]);
    }
  };

  const deleteSession = async (id: string) => {
    if (!user) return;
    if (!confirm("Diesen Chat wirklich löschen?")) return;
    await supabase.from("chat_messages").delete().eq("user_id", user.id).eq("session_id", id);
    await supabase.from("chat_sessions").delete().eq("id", id);
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeId === id) {
      if (remaining.length) {
        setActiveId(remaining[0].id);
      } else {
        setActiveId(null);
        setMessages([]);
        await newChat();
      }
    }
  };

  const startRename = (s: ChatSession) => {
    setRenamingId(s.id);
    setRenameValue(s.title);
  };

  const commitRename = async () => {
    if (!renamingId) return;
    const title = renameValue.trim() || "Neuer Chat";
    await supabase.from("chat_sessions").update({ title }).eq("id", renamingId);
    setSessions((prev) => prev.map((s) => (s.id === renamingId ? { ...s, title } : s)));
    setRenamingId(null);
  };

  const send = async (text?: string) => {
    if (!user || busy || !activeId) return;
    const content = (text ?? input).trim();
    if (!content) return;
    setInput("");
    const isFirstChat = messages.length === 0;
    const sessionId = activeId;

    const userMsg: Msg = { role: "user", content };
    const optimistic = [...messages, userMsg];
    setMessages(optimistic);
    setBusy(true);

    supabase
      .from("chat_messages")
      .insert({ user_id: user.id, session_id: sessionId, role: "user", content })
      .then(() => {});

    // If this is the first message, derive a title
    if (isFirstChat) {
      const title = deriveTitle(content);
      await supabase.from("chat_sessions").update({ title }).eq("id", sessionId);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, title } : s)));
    }

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
        body: JSON.stringify({
          messages: optimistic,
          level: hasSelection ? level : undefined,
          topic: hasSelection ? topic : undefined,
        }),
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
      scrollToLastAssistantTop.current = true;
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
          session_id: sessionId,
          role: "assistant",
          content: assistantText,
        });
        // Bump session updated_at so it climbs to the top of the list
        await supabase.from("chat_sessions").update({ updated_at: new Date().toISOString() }).eq("id", sessionId);
        await refreshSessions();
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

  const activeTitle = sessions.find((s) => s.id === activeId)?.title ?? "Neuer Chat";

  return (
    <div className="w-full max-w-5xl mx-auto min-w-0 overflow-x-hidden">
      {/* Mobile session toggle */}
      <div className="md:hidden flex gap-2 min-w-0 mb-3 sm:mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSessions(true)}
          className="flex-1 min-w-0 justify-between rounded-xl px-3"
        >
          <span className="flex items-center gap-2 min-w-0">
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="truncate">{activeTitle}</span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${showSessions ? "rotate-180" : ""}`} />
        </Button>
        <Button onClick={newChat} size="sm" variant="hero" className="rounded-xl shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isMobile && (
        <Sheet open={showSessions} onOpenChange={setShowSessions}>
          <SheetContent side="left" className="w-[85vw] max-w-xs p-3 sm:p-4">
            <SheetHeader className="mb-3 pr-8">
              <SheetTitle>Chats</SheetTitle>
              <SheetDescription>Gespeicherte Unterhaltungen öffnen, umbenennen oder löschen.</SheetDescription>
            </SheetHeader>
            <ChatSessionList
              activeId={activeId}
              onCommitRename={commitRename}
              onCreate={async () => {
                await newChat();
                setShowSessions(false);
              }}
              onDelete={deleteSession}
              onRenameCancel={() => setRenamingId(null)}
              onRenameChange={setRenameValue}
              onSelect={(id) => {
                setActiveId(id);
                setShowSessions(false);
              }}
              onStartRename={startRename}
              renameValue={renameValue}
              renamingId={renamingId}
              sessions={sessions}
            />
          </SheetContent>
        </Sheet>
      )}

      <div className="md:grid md:grid-cols-[260px_minmax(0,1fr)] gap-3 sm:gap-4 min-w-0">
        {/* Sidebar with sessions */}
        {!isMobile && (
          <aside className="space-y-3 min-w-0">
            <ChatSessionList
              activeId={activeId}
              onCommitRename={commitRename}
              onCreate={newChat}
              onDelete={deleteSession}
              onRenameCancel={() => setRenamingId(null)}
              onRenameChange={setRenameValue}
              onSelect={setActiveId}
              onStartRename={startRename}
              renameValue={renameValue}
              renamingId={renamingId}
              sessions={sessions}
            />
          </aside>
        )}

        {/* Chat area */}
        <div className="space-y-4 min-w-0 w-full">
        <header className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl">Coach Ellie 💬</h1>
            {hasSelection && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-accent-foreground/90">
                <Sparkles className="h-3 w-3 text-accent" />
                <span className="font-mono">{level}</span>
                <span className="text-muted-foreground/60">·</span>
                <span className="truncate max-w-[10rem]">{topic}</span>
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Dein KI-Tutor. Schreib auf Deutsch oder Englisch – stell Fragen, übe Dialoge, lass dich korrigieren.
          </p>
        </header>

        <Card className="bg-gradient-card shadow-card flex flex-col h-[60vh] min-h-[400px] min-w-0 w-full overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-4">
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
            {(() => {
              let lastAssistantIdx = -1;
              for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i].role === "assistant") { lastAssistantIdx = i; break; }
              }
              return messages.map((m, i) => (
                <div
                  key={i}
                  ref={i === lastAssistantIdx ? lastAssistantRef : undefined}
                  className={`flex min-w-0 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 max-w-[88%] sm:max-w-[85%] min-w-0 overflow-hidden ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none break-words [overflow-wrap:anywhere] [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_code]:break-words">
                        <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{m.content}</div>
                    )}
                  </div>
                </div>
              ));
            })()}
          </div>

          <div className="border-t border-border p-2.5 sm:p-3 flex gap-2 items-end min-w-0">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="What would you like to learn?"
              className="min-h-[44px] max-h-32 resize-none rounded-xl flex-1 min-w-0 text-base sm:text-sm"
              disabled={busy}
            />
            <Button onClick={() => send()} disabled={busy || !input.trim()} size="icon" className="h-11 w-11 shrink-0 rounded-xl">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </Card>
      </div>
      </div>
    </div>
  );
}
