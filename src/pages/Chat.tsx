import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { ArrowLeft, ChevronDown, Loader2, MessageSquare, Plus, Send, Sparkles } from "lucide-react";
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

function isDefaultChatTitle(title?: string | null): boolean {
  return !title || title === "Neuer Chat";
}

export default function Chat() {
  const { user } = useAuth();
  const { level, topic, hasSelection } = useLearning();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showSessions, setShowSessions] = useState(false);
  // Sessions opened via a context launcher (Frag Ellie / explain mistake / etc.).
  // For these, we suppress the generic starter prompts and show a "Zurück zur Übung" button.
  const [contextSessions, setContextSessions] = useState<Record<string, { returnTo: string; returnLabel: string }>>({});
  const handledIncomingKeyRef = useRef<string | null>(null);
  // Sessions whose messages we should NOT auto-load (because we just created them
  // for a context-prefill flow and are about to stream the first answer).
  const skipLoadRef = useRef<Set<string>>(new Set());
  const messageLoadRequestRef = useRef(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastAssistantRef = useRef<HTMLDivElement>(null);
  const scrollToLastAssistantTop = useRef(false);

  // Handle ?new=1 from the main Coach tab — always start a fresh generic chat.
  const handledNewKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user) return;
    if (searchParams.get("new") !== "1") return;
    // Don't interfere with context-prefill flow.
    if (searchParams.get("prefill")) return;
    const key = `${user.id}:${searchParams.get("t") ?? ""}`;
    if (handledNewKeyRef.current === key) return;
    handledNewKeyRef.current = key;
    (async () => {
      const { data: created } = await supabase
        .from("chat_sessions")
        .insert({ user_id: user.id, title: "Neuer Chat" })
        .select("id,title,updated_at")
        .single();
      if (created) {
        setSessions((prev) => {
          const without = prev.filter((s) => s.id !== created.id);
          return [created as ChatSession, ...without];
        });
        setActiveId(created.id);
        setMessages([]);
      }
      const next = new URLSearchParams(searchParams);
      next.delete("new");
      next.delete("t");
      setSearchParams(next, { replace: true });
    })();
  }, [user, searchParams, setSearchParams]);

  // Load list of sessions; auto-create one if none exist
  useEffect(() => {
    if (!user) return;
    // If we're about to create a fresh chat from the main Coach tab, skip auto-selecting old one.
    const startingFresh = searchParams.get("new") === "1" && !searchParams.get("prefill");
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
          setActiveId((prev) => prev ?? created.id);
        }
      } else {
        setSessions(list);
        if (!startingFresh) {
          setActiveId((prev) => prev ?? list[0].id);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load messages for the active session
  useEffect(() => {
    if (!user || !activeId) return;
    const sessionId = activeId;
    const requestId = ++messageLoadRequestRef.current;
    if (skipLoadRef.current.has(sessionId)) {
      // We're about to stream into this freshly-created session — don't wipe it.
      skipLoadRef.current.delete(sessionId);
      return;
    }
    setMessages([]);
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id,role,content")
        .eq("user_id", user.id)
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (messageLoadRequestRef.current !== requestId) return;
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
    if (!user) return;
    const prefill = searchParams.get("prefill");
    if (!prefill) {
      handledIncomingKeyRef.current = null;
      return;
    }
    const auto = searchParams.get("auto") === "1";
    const fresh = searchParams.get("fresh") !== "0";
    const isContext = searchParams.get("ctx") === "1";
    const returnTo = searchParams.get("return") ?? "";
    const returnLabel = searchParams.get("returnLabel") ?? "Zurück zur Übung";
    const launchTitle = searchParams.get("title")?.trim() ?? "";
    const incomingKey = [prefill, auto ? "1" : "0", fresh ? "1" : "0", isContext ? "1" : "0", returnTo, returnLabel, launchTitle].join("::");
    if (handledIncomingKeyRef.current === incomingKey) return;
    handledIncomingKeyRef.current = incomingKey;

    (async () => {
      let targetId = activeId;
      let targetTitle = launchTitle;
      if (fresh) {
        const { data: created } = await supabase
          .from("chat_sessions")
          .insert({ user_id: user.id, title: launchTitle || "Neuer Chat" })
          .select("id,title,updated_at")
          .single();
        if (created) {
          // Prevent the load-messages effect from wiping our about-to-stream content.
          skipLoadRef.current.add(created.id);
          setSessions((prev) => [created as ChatSession, ...prev]);
          setActiveId(created.id);
          setMessages([]);
          targetId = created.id;
          targetTitle = created.title;
        }
      }
      if (isContext && targetId) {
        setContextSessions((prev) => ({ ...prev, [targetId!]: { returnTo, returnLabel } }));
      }
      const next = new URLSearchParams(searchParams);
      next.delete("prefill");
      next.delete("auto");
      next.delete("fresh");
      next.delete("ctx");
      next.delete("return");
      next.delete("returnLabel");
      setSearchParams(next, { replace: true });

      if (auto && targetId) {
        void send(prefill, targetId, [], targetTitle);
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

  const send = async (text?: string, sessionIdOverride?: string, baseMessagesOverride?: Msg[], sessionTitleOverride?: string) => {
    const sessionId = sessionIdOverride ?? activeId;
    if (!user || busy || !sessionId) return;
    const content = (text ?? input).trim();
    if (!content) return;
    setInput("");
    const baseMessages = baseMessagesOverride ?? messages;
    const isFirstChat = baseMessages.length === 0;
    const existingSessionTitle = sessionTitleOverride ?? sessions.find((s) => s.id === sessionId)?.title;

    const userMsg: Msg = { role: "user", content };
    const optimistic = [...baseMessages, userMsg];
    setMessages(optimistic);
    setBusy(true);

    supabase
      .from("chat_messages")
      .insert({ user_id: user.id, session_id: sessionId, role: "user", content })
      .then(() => {});

    // If this is the first message, derive a title
    if (isFirstChat && isDefaultChatTitle(existingSessionTitle)) {
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
        setMessages(baseMessages);
        return;
      }
      if (resp.status === 402) {
        toast.error("AI-Guthaben aufgebraucht.");
        setMessages(baseMessages);
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
      setMessages(baseMessages);
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
        {activeId && contextSessions[activeId] && (
          <div className="flex">
            <Button
              variant="soft"
              size="sm"
              className="rounded-full"
              onClick={() => {
                const ctx = contextSessions[activeId];
                if (ctx?.returnTo) navigate(ctx.returnTo);
                else navigate(-1);
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              {contextSessions[activeId].returnLabel || "Zurück zur Übung"}
            </Button>
          </div>
        )}
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
            {messages.length === 0 && !(activeId && contextSessions[activeId]) && (
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
            {messages.length === 0 && activeId && contextSessions[activeId] && (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Ellie bereitet eine Erklärung vor…
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
