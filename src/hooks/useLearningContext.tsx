import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Level } from "@/lib/learning";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface LearningCtx {
  level: Level;
  topic: string;
  ready: boolean;
  setSelection: (level: Level, topic: string, opts?: { persist?: boolean }) => void;
}

const STORAGE_KEY = "hello.activeSelection";
const Ctx = createContext<LearningCtx>({
  level: "A1",
  topic: "Alltag",
  ready: false,
  setSelection: () => {},
});

function loadLocal(): { level: Level; topic: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p?.level && p?.topic) return { level: p.level as Level, topic: String(p.topic) };
  } catch { /* ignore */ }
  return null;
}

export const LearningProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const local = loadLocal();
  const [level, setLevel] = useState<Level>(local?.level ?? "A1");
  const [topic, setTopic] = useState<string>(local?.topic ?? "Alltag");
  const [ready, setReady] = useState<boolean>(!!local);
  const hydratedForUser = useRef<string | null>(null);

  // Hydrate from profile on first login (only if no local override yet)
  useEffect(() => {
    if (!user) {
      hydratedForUser.current = null;
      return;
    }
    if (hydratedForUser.current === user.id) return;
    hydratedForUser.current = user.id;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("default_level, default_topic")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!local && data) {
        const lv = (data.default_level as Level) ?? "A1";
        const tp = data.default_topic ?? "Alltag";
        setLevel(lv);
        setTopic(tp);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ level: lv, topic: tp })); } catch { /* ignore */ }
      }
      setReady(true);
    })();
  }, [user, local]);

  const setSelection = useCallback((nextLevel: Level, nextTopic: string, opts?: { persist?: boolean }) => {
    setLevel(nextLevel);
    setTopic(nextTopic);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ level: nextLevel, topic: nextTopic }));
    } catch { /* ignore */ }
    if (opts?.persist && user) {
      supabase.from("profiles")
        .update({ default_level: nextLevel, default_topic: nextTopic })
        .eq("user_id", user.id)
        .then(() => {});
    }
  }, [user]);

  return <Ctx.Provider value={{ level, topic, ready, setSelection }}>{children}</Ctx.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLearning = () => useContext(Ctx);
