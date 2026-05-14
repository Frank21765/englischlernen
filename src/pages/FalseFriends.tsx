import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLearning } from "@/hooks/useLearningContext";
import { logLearningEvent } from "@/lib/events";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";

interface FalseFriend {
  id: string;
  german_trigger_word_or_phrase: string | null;
  german_meaning: string | null;
  wrong_english: string;
  correct_english_primary: string;
  correct_english_alternatives: string[] | null;
  example_de: string | null;
  example_wrong_en: string | null;
  example_correct_en: string | null;
  explanation_de: string;
  memory_hook_de: string | null;
  feedback_if_wrong_de: string | null;
  feedback_if_correct_de: string | null;
  cefr_level: string;
  category: string | null;
  l1_interference_strength: number | null;
}

const MIN_ITEMS = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function highlight(sentence: string | null, word: string | null): React.ReactNode {
  if (!sentence) return null;
  if (!word) return sentence;
  const idx = sentence.toLowerCase().indexOf(word.toLowerCase());
  if (idx < 0) return sentence;
  return (
    <>
      {sentence.slice(0, idx)}
      <span className="font-bold underline decoration-2 underline-offset-2">
        {sentence.slice(idx, idx + word.length)}
      </span>
      {sentence.slice(idx + word.length)}
    </>
  );
}

// Build 2–3 answer options: correct, wrong (false-friend trap), optional neutral distractor
function buildOptions(current: FalseFriend, pool: FalseFriend[]): string[] {
  const opts = new Set<string>();
  opts.add(current.correct_english_primary);
  opts.add(current.wrong_english);
  // Neutral distractor: a correct_english_primary from another item
  const others = pool.filter(
    (i) =>
      i.id !== current.id &&
      i.correct_english_primary &&
      i.correct_english_primary !== current.correct_english_primary &&
      i.correct_english_primary !== current.wrong_english,
  );
  if (others.length) {
    const pick = others[Math.floor(Math.random() * others.length)];
    opts.add(pick.correct_english_primary);
  }
  return shuffle(Array.from(opts));
}

export default function FalseFriends() {
  const { level } = useLearning();
  const [items, setItems] = useState<FalseFriend[]>([]);
  const [queue, setQueue] = useState<FalseFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooFew, setTooFew] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [knewIt, setKnewIt] = useState(0);
  const [needsPractice, setNeedsPractice] = useState(0);

  const load = async () => {
    setLoading(true);
    setError(null);
    setTooFew(false);
    setRevealed(false);
    setSelected(null);
    setKnewIt(0);
    setNeedsPractice(0);

    const { data, error } = await supabase
      .from("false_friends_master")
      .select(
        "id, german_trigger_word_or_phrase, german_meaning, wrong_english, correct_english_primary, correct_english_alternatives, example_de, example_wrong_en, example_correct_en, explanation_de, memory_hook_de, feedback_if_wrong_de, feedback_if_correct_de, cefr_level, category, l1_interference_strength",
      )
      .eq("cefr_level", level)
      .order("l1_interference_strength", { ascending: false, nullsFirst: false })
      .limit(50);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    const list = (data ?? []) as unknown as FalseFriend[];
    if (list.length < MIN_ITEMS) {
      setTooFew(true);
      setItems(list);
      setQueue([]);
    } else {
      const shuffled = shuffle(list);
      setItems(shuffled);
      setQueue(shuffled);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const current = queue[0];
  const options = useMemo(
    () => (current ? buildOptions(current, items) : []),
    [current, items],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center space-y-3">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => void load()} variant="outline">Nochmal versuchen</Button>
      </Card>
    );
  }

  if (tooFew) {
    return (
      <Card className="p-6 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold">Zu wenig Material auf {level}</h2>
        <p className="text-sm text-muted-foreground">
          Für dein aktuelles Niveau ({level}) sind aktuell nur {items.length} False
          Friends kuratiert. Wir mischen bewusst keine anderen Level rein, damit
          das Training auf deinem Niveau bleibt. Bitte später erneut versuchen
          oder das Niveau wechseln.
        </p>
      </Card>
    );
  }

  if (!current) {
    return (
      <Card className="p-6 text-center space-y-3">
        <Sparkles className="h-8 w-8 text-accent mx-auto" />
        <h2 className="text-lg font-bold">Runde geschafft!</h2>
        <p className="text-sm text-muted-foreground">
          Wusste ich: <span className="font-semibold text-success">{knewIt}</span>
          {" · "}
          Brauche Übung: <span className="font-semibold text-foreground">{needsPractice}</span>
        </p>
        <Button variant="hero" onClick={() => void load()} className="rounded-full">
          <RefreshCw className="h-4 w-4" /> Neue Runde
        </Button>
      </Card>
    );
  }

  const trigger = current.german_trigger_word_or_phrase || current.german_meaning || "—";
  const isCorrect = revealed && selected === current.correct_english_primary;

  const handleSelect = (option: string) => {
    if (revealed) return;
    setSelected(option);
    setRevealed(true);
    const correct = option === current.correct_english_primary;
    if (correct) setKnewIt((n) => n + 1);
    else setNeedsPractice((n) => n + 1);
    void logLearningEvent({
      eventType: correct ? "false_friend_correct" : "false_friend_wrong",
      objectType: "false_friend",
      level: current.cefr_level,
      metadata: {
        false_friend_id: current.id,
        userAnswer: option,
        correct_english_primary: current.correct_english_primary,
        wrong_english: current.wrong_english,
      },
    });
  };

  const handleNext = () => {
    const [head, ...rest] = queue;
    if (isCorrect) {
      setQueue(rest);
    } else {
      // Re-insert ~3 positions later, no infinite loop
      const insertAt = Math.min(rest.length, 3);
      const next = [...rest.slice(0, insertAt), head, ...rest.slice(insertAt)];
      setQueue(next);
    }
    setRevealed(false);
    setSelected(null);
  };

  const totalRound = items.length;
  const remaining = queue.length;
  const position = totalRound - remaining + 1;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          False Friends
        </h1>
        <p className="text-sm text-muted-foreground">
          Wähle die richtige englische Übersetzung — nicht die, die gleich klingt.
        </p>
        <div className="text-xs text-muted-foreground">
          Karte {position} · noch {remaining} in der Runde · Niveau {current.cefr_level}
          {current.category ? ` · ${current.category}` : ""}
        </div>
      </header>

      <Card className="p-5 sm:p-6 space-y-4 bg-gradient-card shadow-card">
        {/* Phase A: Frage */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Auf Deutsch
          </div>
          <div className="font-display text-2xl sm:text-3xl leading-tight">
            „{trigger}"
          </div>
          {current.example_de && (
            <div className="text-sm text-muted-foreground mt-2 italic">
              🇩🇪 {current.example_de}
            </div>
          )}
          <div className="text-sm font-semibold mt-3">
            Wie sagst du das auf Englisch?
          </div>
        </div>

        {/* Optionen */}
        <div className="grid gap-2">
          {options.map((opt) => {
            const isPicked = selected === opt;
            const isRight = revealed && opt === current.correct_english_primary;
            const isWrongPick = revealed && isPicked && !isRight;
            const base = "rounded-xl border-2 p-3 text-left text-base font-semibold transition-smooth";
            let cls = "border-border hover:bg-muted";
            if (revealed) {
              if (isRight) cls = "border-success bg-success/15 text-foreground";
              else if (isWrongPick) cls = "border-destructive bg-destructive/15 text-foreground";
              else cls = "border-border opacity-60";
            } else if (isPicked) {
              cls = "border-primary bg-primary/10";
            }
            return (
              <button
                key={opt}
                type="button"
                disabled={revealed}
                onClick={() => handleSelect(opt)}
                className={`${base} ${cls}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>„{opt}"</span>
                  {revealed && isRight && <Check className="h-5 w-5 text-success shrink-0" />}
                  {revealed && isWrongPick && <X className="h-5 w-5 text-destructive shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Phase B: Auflösung */}
        {revealed && (
          <div className="space-y-3">
            <div
              className={`rounded-xl border p-3 ${
                isCorrect
                  ? "border-success/40 bg-success/10"
                  : "border-destructive/40 bg-destructive/10"
              }`}
            >
              <div className="text-sm font-bold">
                {isCorrect ? "✅ Richtig!" : "❌ Leider falsch"}
              </div>
              <div className="text-sm mt-1">
                Korrekt: <span className="font-semibold">„{current.correct_english_primary}"</span>
                {current.correct_english_alternatives && current.correct_english_alternatives.length > 0 && (
                  <span className="text-muted-foreground"> · auch: {current.correct_english_alternatives.join(", ")}</span>
                )}
              </div>
              <div className="text-xs text-amber-400 font-semibold mt-2">
                ⚠ Achtung: „{current.wrong_english}" ist hier der False Friend.
              </div>
            </div>

            <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm leading-relaxed space-y-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                  Warum?
                </div>
                <p className="text-foreground/90">{current.explanation_de}</p>
              </div>
              {current.memory_hook_de && (
                <p className="text-foreground/90">
                  <span className="font-bold">💡 Eselsbrücke: </span>
                  {current.memory_hook_de}
                </p>
              )}
              {isCorrect && current.feedback_if_correct_de && (
                <p className="text-muted-foreground italic">{current.feedback_if_correct_de}</p>
              )}
              {!isCorrect && current.feedback_if_wrong_de && (
                <p className="text-muted-foreground italic">{current.feedback_if_wrong_de}</p>
              )}
            </div>

            {(current.example_wrong_en || current.example_correct_en) && (
              <div className="grid gap-2">
                {current.example_wrong_en && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-sm">
                    <span className="text-xs font-bold text-destructive">❌ </span>
                    <span className="italic">{highlight(current.example_wrong_en, current.wrong_english)}</span>
                  </div>
                )}
                {current.example_correct_en && (
                  <div className="rounded-lg border border-success/30 bg-success/5 p-2 text-sm">
                    <span className="text-xs font-bold text-success">✅ </span>
                    <span className="italic">{highlight(current.example_correct_en, current.correct_english_primary)}</span>
                  </div>
                )}
              </div>
            )}

            <Button
              variant="hero"
              size="lg"
              onClick={handleNext}
              className="w-full rounded-full"
            >
              Weiter <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>

      <div className="text-center text-xs text-muted-foreground">
        Wusste ich: <span className="font-semibold text-success">{knewIt}</span>
        {" · "}
        Brauche Übung: <span className="font-semibold text-foreground">{needsPractice}</span>
      </div>
    </div>
  );
}
