import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardDirection, Level, pickDirection } from "@/lib/learning";
import { awardActivity, celebrate, fireConfetti, randomPraise } from "@/lib/gamification";
import { toast } from "sonner";
import { ArrowLeft, Check, X } from "lucide-react";

interface Vocab {
  id: string;
  german: string;
  spanish: string;
  grammar_note: string | null;
  level: string;
  topic: string;
  status: string;
  correct_count: number;
  wrong_count: number;
}

interface QueueItem { vocab: Vocab; direction: CardDirection; options: string[] }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildOptions(target: Vocab, pool: Vocab[], direction: CardDirection): string[] {
  const correct = direction === "de_es" ? target.spanish : target.german;
  const distractors = shuffle(pool.filter((v) => v.id !== target.id))
    .map((v) => (direction === "de_es" ? v.spanish : v.german))
    .filter((s, i, arr) => arr.indexOf(s) === i && s !== correct)
    .slice(0, 3);
  while (distractors.length < 3) distractors.push("—");
  return shuffle([correct, ...distractors]);
}

export default function Quiz() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const level = (params.get("level") ?? "A1") as Level;
  const topic = params.get("topic") ?? "Alltag";

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [pool, setPool] = useState<Vocab[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [combo, setCombo] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [directionMode, setDirectionMode] = useState<"de_es" | "es_de" | "random">("random");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: profile }, { data: vocab }] = await Promise.all([
        supabase.from("profiles").select("direction_mode").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("vocabulary")
          .select("*")
          .eq("user_id", user.id)
          .eq("level", level)
          .eq("topic", topic),
      ]);
      const mode = (profile?.direction_mode as "de_es"|"es_de"|"random") ?? "random";
      setDirectionMode(mode);

      const all = (vocab ?? []) as Vocab[];
      setPool(all);
      const shuffled = shuffle(all);
      const items: QueueItem[] = shuffled.map((v) => {
        const dir = pickDirection(mode);
        return { vocab: v, direction: dir, options: buildOptions(v, all, dir) };
      });
      setQueue(items);
      setIdx(0);
      setPicked(null);
      setStats({ correct: 0, total: 0 });

      if (items.length) {
        const { data: ses } = await supabase
          .from("learning_sessions")
          .insert({ user_id: user.id, mode: "quiz", level, topic, total_answers: 0, correct_answers: 0 })
          .select("id")
          .single();
        setSessionId(ses?.id ?? null);
      }
      setLoading(false);
    })();
  }, [user, level, topic]);

  if (loading) return <div className="text-muted-foreground animate-shimmer">Lade Quiz…</div>;

  if (!queue.length) {
    return (
      <Card className="p-8 text-center space-y-4">
        <h2 className="text-2xl">Noch keine Vokabeln für {level} · {topic}</h2>
        <p className="text-muted-foreground">Lass dir zuerst welche generieren.</p>
        <Button variant="hero" onClick={() => navigate("/lernen")}>
          <ArrowLeft className="h-4 w-4" /> Zur Themenwahl
        </Button>
      </Card>
    );
  }

  const current = queue[idx];
  const correctAnswer = current.direction === "de_es" ? current.vocab.spanish : current.vocab.german;
  const promptText = current.direction === "de_es" ? current.vocab.german : current.vocab.spanish;
  const promptLang = current.direction === "de_es" ? "Deutsch" : "Español";
  const answerLang = current.direction === "de_es" ? "Español" : "Deutsch";

  const finish = async (finalStats: { correct: number; total: number }) => {
    if (sessionId) {
      await supabase.from("learning_sessions").update({
        total_answers: finalStats.total,
        correct_answers: finalStats.correct,
      }).eq("id", sessionId);
    }
    const perfect = finalStats.total > 0 && finalStats.correct === finalStats.total;
    if (user) {
      const result = await awardActivity(user.id, finalStats.correct * 2, {
        perfectQuiz: perfect,
        comboReached: combo,
      });
      celebrate(result);
    }
    if (perfect) fireConfetti(true);
    toast.success(`Quiz fertig! ${finalStats.correct}/${finalStats.total} richtig`);
    navigate("/lernen");
  };

  const handlePick = async (opt: string) => {
    if (picked) return;
    setPicked(opt);
    const isCorrect = opt === correctAnswer;
    const newStats = { correct: stats.correct + (isCorrect ? 1 : 0), total: stats.total + 1 };
    setStats(newStats);
    const newCombo = isCorrect ? combo + 1 : 0;
    setCombo(newCombo);

    const v = current.vocab;
    const newCorrect = v.correct_count + (isCorrect ? 1 : 0);
    const newWrong = v.wrong_count + (isCorrect ? 0 : 1);
    let status: "new" | "learning" | "mastered" = "learning";
    if (newCorrect >= 3 && newWrong === 0) status = "mastered";
    else if (newCorrect >= 5 && newCorrect > newWrong * 2) status = "mastered";

    await supabase.from("vocabulary").update({
      correct_count: newCorrect,
      wrong_count: newWrong,
      status,
      last_seen_at: new Date().toISOString(),
    }).eq("id", v.id);

    // XP fließend vergeben + Lob bei Combos
    if (isCorrect && user) {
      awardActivity(user.id, 5, { comboReached: newCombo }).then((r) => {
        if (r.leveledUp || r.newBadges.length) celebrate(r);
      });
      if (newCombo > 0 && newCombo % 5 === 0) {
        fireConfetti(newCombo >= 10);
        toast.success(`${randomPraise()} ${newCombo} in Folge!`);
      }
    }

    setTimeout(() => {
      let nextQueue = queue;
      if (!isCorrect) {
        const offset = 3 + Math.floor(Math.random() * 3);
        const insertAt = Math.min(idx + 1 + offset, queue.length);
        const dir = pickDirection(directionMode);
        const replay: QueueItem = { vocab: v, direction: dir, options: buildOptions(v, pool, dir) };
        nextQueue = [...queue.slice(0, insertAt), replay, ...queue.slice(insertAt)];
        setQueue(nextQueue);
      }
      const nextIdx = idx + 1;
      if (nextIdx >= nextQueue.length) {
        finish(newStats);
        return;
      }
      setIdx(nextIdx);
      setPicked(null);
    }, 900);
  };

  const remaining = queue.length - idx;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/lernen")}>
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Button>
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{level}</span> · {topic} · noch {remaining}
        </div>
      </div>

      <Card className="p-6 md:p-8 text-center bg-gradient-card shadow-card animate-pop">
        <div className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{promptLang}</div>
        <div className="font-display text-2xl md:text-3xl leading-tight">{promptText}</div>
        <div className="text-xs text-muted-foreground mt-3">Wähle die richtige Übersetzung auf {answerLang}</div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        {current.options.map((opt) => {
          const isCorrect = opt === correctAnswer;
          const isPicked = opt === picked;
          let cls = "bg-card hover:bg-muted text-foreground border-border";
          if (picked) {
            if (isCorrect) cls = "bg-success text-success-foreground border-success shadow-glow";
            else if (isPicked) cls = "bg-destructive text-destructive-foreground border-destructive";
            else cls = "bg-muted/50 text-muted-foreground border-border opacity-60";
          }
          return (
            <button
              key={opt}
              onClick={() => handlePick(opt)}
              disabled={!!picked}
              className={`rounded-2xl border-2 p-4 text-left text-base font-semibold transition-bounce ${cls}`}
            >
              <div className="flex items-center gap-3">
                {picked && isCorrect && <Check className="h-5 w-5 shrink-0" />}
                {picked && isPicked && !isCorrect && <X className="h-5 w-5 shrink-0" />}
                <span>{opt}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <span>Richtig: <span className="font-semibold text-success">{stats.correct}</span></span>
        <span>Beantwortet: <span className="font-semibold text-foreground">{stats.total}</span></span>
        {combo > 1 && <span className="text-primary font-bold">🔥 {combo}</span>}
      </div>
    </div>
  );
}
