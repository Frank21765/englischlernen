import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Level } from "@/lib/learning";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface LearningCtx {
  level: Level;
  topic: string;
  ready: boolean;
  hasSelection: boolean;
  setSelection: (level: Level, topic: string, opts?: { persist?: boolean }) => void;
}

const STORAGE_KEY = "hello.activeSelection";
const Ctx = createContext<LearningCtx>({
  level: "A1",
  topic: "Alltag",
  ready: false,
  hasSelection: false,
  setSelection: () => {},
});

interface Stored { level: Level; topic: string }
function loadLocal(): Stored | null {
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
  const [hasSelection, setHasSelection] = useState<boolean>(!!local);
  const [ready, setReady] = useState<boolean>(!!local);
  const hydratedForUser = useRef<string | null>(null);

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
      if (!local && data?.default_level && data?.default_topic) {
        setLevel(data.default_level as Level);
        setTopic(data.default_topic);
        setHasSelection(true);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ level: data.default_level, topic: data.default_topic })); } catch { /* ignore */ }
      }
      setReady(true);
    })();
  }, [user, local]);

  const setSelection = useCallback((nextLevel: Level, nextTopic: string, opts?: { persist?: boolean }) => {
    setLevel(nextLevel);
    setTopic(nextTopic);
    setHasSelection(true);
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

  return <Ctx.Provider value={{ level, topic, ready, hasSelection, setSelection }}>{children}</Ctx.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLearning = () => useContext(Ctx);
