import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardDirection, Level, pickDirection } from "@/lib/learning";
import { awardActivity, celebrate, fireConfetti, randomPraise } from "@/lib/gamification";
import { toast } from "sonner";
import { ArrowLeft, Check, RotateCw, X } from "lucide-react";

interface Vocab {
  id: string;
  german: string;
  english: string;
  grammar_note: string | null;
  level: string;
  topic: string;
  status: string;
  correct_count: number;
  wrong_count: number;
}

interface QueueItem { vocab: Vocab; direction: CardDirection }

export default function Karteikarten() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const level = (params.get("level") ?? "A1") as Level;
  const topic = params.get("topic") ?? "Alltag";

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [combo, setCombo] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [directionMode, setDirectionMode] = useState<"de_en" | "en_de" | "random">("random");
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
          .eq("topic", topic)
          .order("wrong_count", { ascending: false })
          .order("last_seen_at", { ascending: true, nullsFirst: true })
          .limit(40),
      ]);
      const mode = (profile?.direction_mode as "de_en"|"en_de"|"random") ?? "random";
      setDirectionMode(mode);
      const items = (vocab ?? []).map((v) => ({ vocab: v as Vocab, direction: pickDirection(mode) }));
      setQueue(items);
      setIdx(0);
      setFlipped(false);
      setStats({ correct: 0, total: 0 });

      if (items.length) {
        const { data: ses } = await supabase
          .from("learning_sessions")
          .insert({ user_id: user.id, mode: "flashcards", level, topic, total_answers: 0, correct_answers: 0 })
          .select("id")
          .single();
        setSessionId(ses?.id ?? null);
      }
      setLoading(false);
    })();
  }, [user, level, topic]);

  const current = queue[idx];
  const remaining = queue.length - idx;

  const finish = async (finalStats: { correct: number; total: number }) => {
    if (sessionId) {
      await supabase.from("learning_sessions").update({
        total_answers: finalStats.total,
        correct_answers: finalStats.correct,
      }).eq("id", sessionId);
    }
    if (user) {
      const result = await awardActivity(user.id, finalStats.correct * 2, { comboReached: combo });
      celebrate(result);
    }
    toast.success(`Runde fertig! ${finalStats.correct}/${finalStats.total} richtig`);
    navigate("/lernen");
  };

  const handleAnswer = async (correct: boolean) => {
    if (!current || !user) return;
    const newStats = { correct: stats.correct + (correct ? 1 : 0), total: stats.total + 1 };
    setStats(newStats);
    const newCombo = correct ? combo + 1 : 0;
    setCombo(newCombo);

    const v = current.vocab;
    const newCorrect = v.correct_count + (correct ? 1 : 0);
    const newWrong = v.wrong_count + (correct ? 0 : 1);
    let status: "new" | "learning" | "mastered" = "learning";
    if (newCorrect >= 3 && newWrong === 0) status = "mastered";
    else if (newCorrect >= 5 && newCorrect > newWrong * 2) status = "mastered";

    await supabase.from("vocabulary").update({
      correct_count: newCorrect,
      wrong_count: newWrong,
      status,
      last_seen_at: new Date().toISOString(),
    }).eq("id", v.id);

    if (correct) {
      awardActivity(user.id, 4, { comboReached: newCombo }).then((r) => {
        if (r.leveledUp || r.newBadges.length) celebrate(r);
      });
      if (newCombo > 0 && newCombo % 5 === 0) {
        fireConfetti(newCombo >= 10);
        toast.success(`${randomPraise()} ${newCombo} in Folge!`);
      }
    }

    let nextQueue = queue;
    if (!correct) {
      const offset = 3 + Math.floor(Math.random() * 3);
      const insertAt = Math.min(idx + 1 + offset, queue.length);
      nextQueue = [...queue.slice(0, insertAt), { vocab: v, direction: pickDirection(directionMode) }, ...queue.slice(insertAt)];
      setQueue(nextQueue);
    }

    const nextIdx = idx + 1;
    if (nextIdx >= nextQueue.length) {
      await finish(newStats);
      return;
    }
    setIdx(nextIdx);
    setFlipped(false);
  };

  if (loading) {
    return <div className="text-muted-foreground animate-shimmer">Lade Karten…</div>;
  }

  if (!queue.length) {
    return (
      <Card className="p-8 text-center space-y-4">
        <h2 className="text-2xl">Noch keine Vokabeln für {level} · {topic}</h2>
        <p className="text-muted-foreground">Geh zurück und lass die KI welche generieren.</p>
        <Button variant="hero" onClick={() => navigate("/lernen")}>
          <ArrowLeft className="h-4 w-4" /> Zur Themenwahl
        </Button>
      </Card>
    );
  }

  const front = current.direction === "de_en" ? current.vocab.german : current.vocab.english;
  const back = current.direction === "de_en" ? current.vocab.english : current.vocab.german;
  const frontLang = current.direction === "de_en" ? "Deutsch" : "English";
  const backLang = current.direction === "de_en" ? "English" : "Deutsch";

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

      <div className="flip-card h-72 md:h-80" onClick={() => setFlipped((f) => !f)}>
        <div className={`flip-inner cursor-pointer ${flipped ? "flipped" : ""}`}>
          <Card className="flip-face p-6 grid place-items-center text-center bg-gradient-card shadow-card animate-pop">
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-primary">{frontLang}</div>
              <div className="font-display text-3xl md:text-4xl leading-tight">{front}</div>
              <div className="text-sm text-muted-foreground pt-4">Tippen zum Aufdecken</div>
            </div>
          </Card>
          <Card className="flip-face flip-back p-6 grid place-items-center text-center bg-gradient-warm text-primary-foreground shadow-glow">
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest opacity-80">{backLang}</div>
              <div className="font-display text-3xl md:text-4xl leading-tight">{back}</div>
              {current.vocab.grammar_note && (
                <div className="text-sm opacity-90 italic pt-2 max-w-md">{current.vocab.grammar_note}</div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="xl"
          onClick={() => handleAnswer(false)}
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
        >
          <X className="h-5 w-5" /> Nochmal
        </Button>
        <Button variant="success" size="xl" onClick={() => handleAnswer(true)}>
          <Check className="h-5 w-5" /> Gewusst
        </Button>
      </div>

      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <span>Richtig: <span className="font-semibold text-success">{stats.correct}</span></span>
        <span>Beantwortet: <span className="font-semibold text-foreground">{stats.total}</span></span>
        {combo > 1 && <span className="text-primary font-bold">🔥 {combo}</span>}
        <button onClick={() => setFlipped((f) => !f)} className="inline-flex items-center gap-1 hover:text-foreground">
          <RotateCw className="h-3.5 w-3.5" /> Drehen
        </button>
      </div>
    </div>
  );
}
