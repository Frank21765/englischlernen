import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Level } from "@/lib/learning";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface LearningCtx {
  level: Level;
  topic: string;
  ready: boolean;
  hasSelection: boolean;
  // `persist` is kept for API compatibility but selection is ALWAYS persisted to
  // the server when a user is signed in. Local cache is only used to avoid a
  // cold-start flash; the server profile is the source of truth.
  setSelection: (level: Level, topic: string, opts?: { persist?: boolean }) => void;
}

// Per-user cache key avoids leaking another user's focus on a shared device.
const cacheKey = (userId: string | null | undefined) =>
  userId ? `hello.activeSelection.${userId}` : "hello.activeSelection.anon";
// Legacy key — read once for migration, then cleared.
const LEGACY_KEY = "hello.activeSelection";

const Ctx = createContext<LearningCtx>({
  level: "A1",
  topic: "Alltag",
  ready: false,
  hasSelection: false,
  setSelection: () => {},
});

interface Stored { level: Level; topic: string }
function readCache(userId: string | null | undefined): Stored | null {
  try {
    const raw = localStorage.getItem(cacheKey(userId)) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p?.level && p?.topic) return { level: p.level as Level, topic: String(p.topic) };
  } catch { /* ignore */ }
  return null;
}
function writeCache(userId: string | null | undefined, value: Stored) {
  try { localStorage.setItem(cacheKey(userId), JSON.stringify(value)); } catch { /* ignore */ }
}
function clearAllCaches() {
  try {
    // Clear the legacy key plus any per-user keys we wrote.
    localStorage.removeItem(LEGACY_KEY);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("hello.activeSelection.")) localStorage.removeItem(k);
    }
  } catch { /* ignore */ }
}

export const LearningProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  // Optimistic first paint from anonymous/legacy cache; will be overwritten by
  // server hydration as soon as the user is known.
  const initial = readCache(null);
  const [level, setLevel] = useState<Level>(initial?.level ?? "A1");
  const [topic, setTopic] = useState<string>(initial?.topic ?? "Alltag");
  const [hasSelection, setHasSelection] = useState<boolean>(!!initial);
  const [ready, setReady] = useState<boolean>(false);
  const hydratedForUser = useRef<string | null>(null);

  // Hydrate from server whenever the signed-in user changes. Server wins.
  useEffect(() => {
    if (!user) {
      // Signed out: drop any cached focus so the next user starts clean.
      hydratedForUser.current = null;
      clearAllCaches();
      setReady(true);
      return;
    }
    if (hydratedForUser.current === user.id) return;
    hydratedForUser.current = user.id;

    // While hydrating, prefer this user's own cached value (if any) over the
    // anonymous/legacy initial value to avoid showing stale cross-user data.
    const userCached = readCache(user.id);
    if (userCached) {
      setLevel(userCached.level);
      setTopic(userCached.topic);
      setHasSelection(true);
    }

    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("default_level, default_topic")
        .eq("user_id", user.id)
        .maybeSingle();
      const serverLevel = data?.default_level as Level | undefined;
      const serverTopic = data?.default_topic ?? undefined;
      if (serverLevel && serverTopic) {
        // Server is authoritative — overwrite local state and refresh cache.
        setLevel(serverLevel);
        setTopic(serverTopic);
        setHasSelection(true);
        writeCache(user.id, { level: serverLevel, topic: serverTopic });
      }
      setReady(true);
    })();
  }, [user]);

  const setSelection = useCallback((nextLevel: Level, nextTopic: string, _opts?: { persist?: boolean }) => {
    setLevel(nextLevel);
    setTopic(nextTopic);
    setHasSelection(true);
    if (user) {
      writeCache(user.id, { level: nextLevel, topic: nextTopic });
      // Always persist to server — no silent local-only writes for important
      // account state. Empty topic is treated as transient (typing in input).
      if (nextTopic.trim().length > 0) {
        supabase.from("profiles")
          .update({ default_level: nextLevel, default_topic: nextTopic })
          .eq("user_id", user.id)
          .then(() => {});
      }
    }
  }, [user]);

  return <Ctx.Provider value={{ level, topic, ready, hasSelection, setSelection }}>{children}</Ctx.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLearning = () => useContext(Ctx);
