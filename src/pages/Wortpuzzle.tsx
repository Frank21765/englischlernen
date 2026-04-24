import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLearning } from "@/hooks/useLearningContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EllieButton } from "@/components/EllieButton";

import { ellieAskWordPrompt } from "@/lib/ellie";
import { toast } from "sonner";
import { ArrowRight, Check, Loader2, Puzzle, RefreshCw, RotateCcw, Sparkles, X } from "lucide-react";
import { awardActivity, celebrate } from "@/lib/gamification";

interface PuzzleItem {
  english: string;
  german: string;
}

type Direction = "en_to_de" | "de_to_en";

interface ActiveTask {
  source: string;     // sentence to translate (shown as prompt)
  target: string;     // expected reconstruction
  targetLang: "en" | "de";
  tokens: string[];   // shuffled chips of target
}

const RETURN_FLAG_KEY = "wortpuzzle.returningFromEllie";

const tokenize = (s: string): string[] =>
  s.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);

const normalize = (s: string): string =>
  s.toLowerCase().replace(/[.,!?¿¡;:"„"'']/g, "").replace(/\s+/g, " ").trim();

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Avoid identical order if possible
  if (a.length > 1 && a.every((v, i) => v === arr[i])) {
    [a[0], a[1]] = [a[1], a[0]];
  }
  return a;
};

const buildTask = (item: PuzzleItem): ActiveTask => {
  const dir: Direction = Math.random() < 0.5 ? "en_to_de" : "de_to_en";
  if (dir === "de_to_en") {
    const tokens = shuffle(tokenize(item.english));
    return { source: item.german, target: item.english, targetLang: "en", tokens };
  }
  const tokens = shuffle(tokenize(item.german));
  return { source: item.english, target: item.german, targetLang: "de", tokens };
};

export default function Wortpuzzle() {
  const { user } = useAuth();
  const { level, topic, hasSelection } = useLearning();
  const [searchParams] = useSearchParams();
  const freshKey = searchParams.get("fresh") ?? "";

  const [items, setItems] = useState<PuzzleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [task, setTask] = useState<ActiveTask | null>(null);
  const [bank, setBank] = useState<{ word: string; key: number }[]>([]);
  const [picked, setPicked] = useState<{ word: string; key: number }[]>([]);
  const [checked, setChecked] = useState<null | "right" | "wrong">(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [sessionRecorded, setSessionRecorded] = useState(false);
  const [combo, setCombo] = useState(0);
  const [done, setDone] = useState(false);
  const keyCounter = useRef(0);

  const load = async () => {
    if (!user || !hasSelection) return;
    setLoading(true);
    setDone(false);
    setIndex(0);
    setCorrectCount(0);
    setAnsweredCount(0);
    setSessionRecorded(false);
    setItems([]);
    setTask(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-puzzle", {
        body: { level, topic },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const list: PuzzleItem[] = (data?.items ?? []).filter(
        (i: PuzzleItem) => i?.english && i?.german,
      );
      if (!list.length) throw new Error("Keine Sätze erhalten");
      setItems(list);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sätze konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  // Initial load + reload when "fresh" query changes
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, level, topic, freshKey]);

  // Build a new task whenever we move to a new item
  useEffect(() => {
    if (!items.length) return;
    if (index >= items.length) {
      setDone(true);
      setTask(null);
      return;
    }
    const t = buildTask(items[index]);
    setTask(t);
    keyCounter.current = 0;
    setBank(t.tokens.map((w) => ({ word: w, key: keyCounter.current++ })));
    setPicked([]);
    setChecked(null);
  }, [items, index]);

  const pick = (key: number) => {
    if (checked === "right") return;
    const item = bank.find((b) => b.key === key);
    if (!item) return;
    setBank((b) => b.filter((x) => x.key !== key));
    setPicked((p) => [...p, item]);
    setChecked(null);
  };

  const unpick = (key: number) => {
    if (checked === "right") return;
    const item = picked.find((p) => p.key === key);
    if (!item) return;
    setPicked((p) => p.filter((x) => x.key !== key));
    setBank((b) => [...b, item]);
    setChecked(null);
  };

  const reset = () => {
    if (!task) return;
    keyCounter.current = 0;
    setBank(task.tokens.map((w) => ({ word: w, key: keyCounter.current++ })));
    setPicked([]);
    setChecked(null);
  };

  const check = async () => {
    if (!task) return;
    const guess = picked.map((p) => p.word).join(" ");
    const ok = normalize(guess) === normalize(task.target);
    setChecked(ok ? "right" : "wrong");
    setAnsweredCount((c) => c + 1);
    if (ok) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setCorrectCount((c) => c + 1);
      if (user) {
        const result = await awardActivity(user.id, 5, { mode: "wortpuzzle", comboReached: newCombo });
        if (result.leveledUp || result.newBadges.length) celebrate(result);
      }
    } else {
      setCombo(0);
    }
  };

  const next = () => setIndex((i) => i + 1);

  // Record a single session at end of round (only if at least one answer given)
  useEffect(() => {
    if (!done || sessionRecorded || !user || !hasSelection || answeredCount === 0) return;
    setSessionRecorded(true);
    supabase
      .from("learning_sessions")
      .insert({
        user_id: user.id,
        mode: "wortpuzzle",
        level,
        topic,
        total_answers: answeredCount,
        correct_answers: correctCount,
      })
      .then(() => undefined);
  }, [done, sessionRecorded, user, hasSelection, level, topic, answeredCount, correctCount]);

  const total = items.length;
  const progress = total ? Math.round(((index + (checked ? 1 : 0)) / total) * 100) : 0;

  const elliePrompt = useMemo(() => {
    if (!task) return "";
    const en = task.targetLang === "en" ? task.target : task.source;
    const de = task.targetLang === "de" ? task.target : task.source;
    return ellieAskWordPrompt(de, en, level);
  }, [task, level]);

  if (!hasSelection) {
    return (
      <Card className="p-6 text-center space-y-2">
        <Puzzle className="h-8 w-8 mx-auto text-muted-foreground" />
        <h2 className="text-lg font-bold">Wortpuzzle</h2>
        <p className="text-sm text-muted-foreground">
          Bitte zuerst auf der Startseite ein Niveau und Thema festlegen.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="hover-lift p-4 sm:p-5 bg-gradient-card shadow-card">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <div className="rounded-2xl bg-emerald-500/15 p-2.5 shrink-0">
              <Puzzle className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold">Wortpuzzle</h1>
              <p className="text-sm text-muted-foreground">
                Setze die Wörter in die richtige Reihenfolge — mal Englisch, mal Deutsch.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Niveau <span className="font-mono font-bold text-primary">{level}</span> · {topic}
              </p>
            </div>
          </div>
          <Button
            variant="soft"
            size="sm"
            onClick={load}
            disabled={loading}
            className="shrink-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span>Neue Sätze</span>
          </Button>
        </div>

        {/* Progress */}
        {total > 0 && !done && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Satz {Math.min(index + 1, total)} von {total}</span>
              <span>{correctCount} richtig</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Loading */}
      {loading && (
        <Card className="p-8 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
          Lade neue Sätze…
        </Card>
      )}

      {/* Done */}
      {!loading && done && (
        <Card className="p-6 sm:p-8 text-center space-y-4 bg-gradient-card shadow-card">
          <div className="rounded-full bg-primary/15 w-16 h-16 mx-auto grid place-items-center">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Geschafft!</h2>
            <p className="text-muted-foreground mt-1">
              {correctCount} von {total} Sätzen richtig zusammengesetzt.
            </p>
          </div>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button variant="hero" onClick={load}>
              <RefreshCw className="h-4 w-4" /> Neue Runde
            </Button>
          </div>
        </Card>
      )}

      {/* Task */}
      {!loading && !done && task && (
        <Card className="hover-lift p-4 sm:p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              {task.targetLang === "en" ? "Auf Englisch zusammensetzen" : "Auf Deutsch zusammensetzen"}
            </div>
            <p className="text-lg sm:text-xl font-display leading-snug">{task.source}</p>
          </div>

          {/* Construction area — neutral container, color lives on the chips */}
          <div className="min-h-[64px] rounded-xl border-2 border-dashed border-border bg-muted/30 p-3 flex flex-wrap gap-2 transition-colors">
            {picked.length === 0 && (
              <span className="text-sm text-muted-foreground self-center">
                Tippe unten auf die Wörter…
              </span>
            )}
            {picked.map((p) => {
              const chipClass = checked === "right"
                ? "bg-success/15 border border-success/40 text-success"
                : checked === "wrong"
                ? "bg-destructive/10 border border-destructive/40 text-destructive"
                : "bg-primary/15 hover:bg-primary/25 border border-transparent text-foreground";
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => unpick(p.key)}
                  disabled={checked === "right"}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-smooth disabled:cursor-default ${chipClass}`}
                >
                  {p.word}
                </button>
              );
            })}
          </div>

          {/* Word bank */}
          <div className="flex flex-wrap gap-2">
            {bank.map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => pick(b.key)}
                disabled={checked === "right"}
                className="rounded-lg bg-muted hover:bg-muted/70 px-3 py-1.5 text-sm font-semibold text-foreground transition-smooth disabled:opacity-50 disabled:cursor-default"
              >
                {b.word}
              </button>
            ))}
          </div>

          {/* Feedback — neutral container, color lives on chips */}
          {checked && (
            <div className="rounded-xl p-3 sm:p-4 text-sm space-y-2 bg-muted/30 border border-border">
              <div className="flex items-center gap-2 font-bold">
                {checked === "right" ? (
                  <>
                    <Check className="h-4 w-4 text-success" /> Richtig!
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 text-destructive" /> Nicht ganz.
                  </>
                )}
              </div>
              <div className="text-foreground/90">
                <span className="text-muted-foreground">Richtige Lösung: </span>
                <span className="font-semibold">{task.target}</span>
              </div>
              {checked === "wrong" && (
                <div className="pt-1">
                  <Button variant="soft" size="sm" onClick={reset}>
                    <RotateCcw className="h-4 w-4" /> Nochmal versuchen
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Action row */}
          {!checked && (
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <EllieButton
                prefill={elliePrompt}
                title={task.targetLang === "en" ? task.target : task.source}
                returnTo="/training/wortpuzzle"
                returnLabel="Zurück zum Wortpuzzle"
                returnFlagKey={RETURN_FLAG_KEY}
                variant="sm"
              />
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={reset} disabled={picked.length === 0}>
                  <RotateCcw className="h-4 w-4" /> Zurücksetzen
                </Button>
                <Button variant="hero" size="sm" onClick={check} disabled={picked.length === 0 || bank.length > 0}>
                  Prüfen <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* After check: Frag Ellie + Weiter side by side */}
          {checked && (
            <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
              <EllieButton
                prefill={elliePrompt}
                title={task.targetLang === "en" ? task.target : task.source}
                returnTo="/training/wortpuzzle"
                returnLabel="Zurück zum Wortpuzzle"
                returnFlagKey={RETURN_FLAG_KEY}
                variant="sm"
              />
              <Button variant="hero" size="sm" onClick={next}>
                Weiter <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
