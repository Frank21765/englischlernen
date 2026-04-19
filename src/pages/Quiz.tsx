import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLearning } from "@/hooks/useLearningContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardDirection, Level, pickDirection } from "@/lib/learning";
import { awardActivity, celebrate, fireConfetti, randomPraise } from "@/lib/gamification";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, Check, GraduationCap, Library, Loader2, X } from "lucide-react";

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

type QuizMode = "vocab" | "grammar";

interface VocabQ { kind: "vocab"; vocab: Vocab; direction: CardDirection; options: string[] }
interface GrammarQ { kind: "grammar"; prompt: string; options: string[]; correct: string; explanation: string }
type QuizItem = VocabQ | GrammarQ;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildOptions(target: Vocab, pool: Vocab[], direction: CardDirection): string[] {
  const correct = direction === "de_en" ? target.english : target.german;
  const distractors = shuffle(pool.filter((v) => v.id !== target.id))
    .map((v) => (direction === "de_en" ? v.english : v.german))
    .filter((s, i, arr) => arr.indexOf(s) === i && s !== correct)
    .slice(0, 3);
  while (distractors.length < 3) distractors.push("—");
  return shuffle([correct, ...distractors]);
}

export default function Quiz() {
  const { user } = useAuth();
  const { level: ctxLevel, topic: ctxTopic, ready: ctxReady, hasSelection, setSelection } = useLearning();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<QuizMode>("vocab");
  const [level, setLevel] = useState<Level | null>(null);
  const [topic, setTopic] = useState<string | null>(null);

  const [queue, setQueue] = useState<QuizItem[]>([]);
  const [pool, setPool] = useState<Vocab[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [combo, setCombo] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [directionMode, setDirectionMode] = useState<"de_en" | "en_de" | "random">("random");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  // sync URL deep links
  useEffect(() => {
    if (!ctxReady) return;
    const urlLevel = params.get("level");
    const urlTopic = params.get("topic");
    if ((urlLevel && urlLevel !== ctxLevel) || (urlTopic && urlTopic !== ctxTopic)) {
      setSelection((urlLevel ?? ctxLevel) as Level, urlTopic ?? ctxTopic);
    }
    setLevel(ctxLevel);
    setTopic(ctxTopic);
  }, [ctxReady, ctxLevel, ctxTopic, params, setSelection]);

  const startVocab = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from("profiles").select("direction_mode").eq("user_id", user.id).maybeSingle();
      const dm = (profile?.direction_mode as "de_en"|"en_de"|"random") ?? "random";
      setDirectionMode(dm);

      const { data: vocab } = await supabase
        .from("vocabulary").select("*")
        .eq("user_id", user.id).eq("level", ctxLevel).eq("topic", ctxTopic);
      const all = (vocab ?? []) as Vocab[];
      setPool(all);
      if (!all.length) {
        toast.error(`Noch keine Vokabeln für ${ctxLevel} · ${ctxTopic}. Generiere zuerst welche.`);
        setLoading(false);
        return;
      }
      const items: QuizItem[] = shuffle(all).map((v) => {
        const dir = pickDirection(dm);
        return { kind: "vocab", vocab: v, direction: dir, options: buildOptions(v, all, dir) };
      });
      setQueue(items);
      setIdx(0); setPicked(null); setStats({ correct: 0, total: 0 }); setCombo(0);

      const { data: ses } = await supabase
        .from("learning_sessions")
        .insert({ user_id: user.id, mode: "quiz", level: ctxLevel, topic: ctxTopic, total_answers: 0, correct_answers: 0 })
        .select("id").single();
      setSessionId(ses?.id ?? null);
      setStarted(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  const startGrammar = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-grammar", {
        body: { level: ctxLevel, topic: ctxTopic, mode: "quiz" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const qs: GrammarQ[] = (data?.questions ?? []).map((q: { prompt: string; options: string[]; correct: string; explanation: string }) => ({
        kind: "grammar" as const,
        prompt: q.prompt,
        options: shuffle(q.options),
        correct: q.correct,
        explanation: q.explanation,
      }));
      if (!qs.length) throw new Error("Keine Fragen erhalten");
      setQueue(qs);
      setIdx(0); setPicked(null); setStats({ correct: 0, total: 0 }); setCombo(0);
      const { data: ses } = await supabase
        .from("learning_sessions")
        .insert({ user_id: user.id, mode: "grammar_quiz", level: ctxLevel, topic: ctxTopic, total_answers: 0, correct_answers: 0 })
        .select("id").single();
      setSessionId(ses?.id ?? null);
      setStarted(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  };

  if (!hasSelection) {
    return (
      <Card className="p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto">
        <GraduationCap className="h-10 w-10 mx-auto text-primary" />
        <h2 className="text-xl sm:text-2xl">Wähle Niveau und Thema</h2>
        <p className="text-sm text-muted-foreground">
          Damit das Quiz zu dir passt, wähle bitte zuerst ein CEFR-Niveau und ein Thema.
        </p>
        <Button variant="hero" onClick={() => navigate("/lernen")}>
          <ArrowLeft className="h-4 w-4" /> Zur Auswahl
        </Button>
      </Card>
    );
  }

  if (!started) {
    return (
      <div className="space-y-5 max-w-2xl mx-auto">
        <header className="space-y-1">
          <h1 className="text-2xl sm:text-3xl">Quiz 🎯</h1>
          <p className="text-sm text-muted-foreground">
            Aktuell: <span className="font-semibold text-foreground">{level ?? ctxLevel}</span> · {topic ?? ctxTopic}
          </p>
        </header>

        <Card className="p-4 sm:p-5 space-y-4 bg-gradient-card shadow-card">
          <div>
            <div className="text-sm font-semibold mb-2">Quiz-Art wählen</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("vocab")}
                className={`rounded-2xl p-3 text-left transition-bounce border-2 ${
                  mode === "vocab" ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted"
                }`}
              >
                <BookOpen className="h-5 w-5 text-primary mb-1" />
                <div className="font-bold text-sm">Vokabel-Quiz</div>
                <div className="text-xs text-muted-foreground">Übersetzung wählen</div>
              </button>
              <button
                onClick={() => setMode("grammar")}
                className={`rounded-2xl p-3 text-left transition-bounce border-2 ${
                  mode === "grammar" ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted"
                }`}
              >
                <Library className="h-5 w-5 text-primary mb-1" />
                <div className="font-bold text-sm">Grammatik-Quiz</div>
                <div className="text-xs text-muted-foreground">Richtige Form wählen</div>
              </button>
            </div>
          </div>
          <Button
            variant="hero"
            size="xl"
            disabled={loading}
            onClick={mode === "vocab" ? startVocab : startGrammar}
            className="w-full"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GraduationCap className="h-5 w-5" />}
            {mode === "vocab" ? "Vokabel-Quiz starten" : "Grammatik-Quiz starten"}
          </Button>
          {mode === "vocab" && (
            <p className="text-xs text-muted-foreground">
              Tipp: Das Vokabel-Quiz nutzt deine vorhandenen Vokabeln für {ctxLevel} · {ctxTopic}.
            </p>
          )}
        </Card>
      </div>
    );
  }

  if (!queue.length) {
    return (
      <Card className="p-6 sm:p-8 text-center space-y-4">
        <h2 className="text-xl sm:text-2xl">Noch keine Vokabeln für {ctxLevel} · {ctxTopic}</h2>
        <p className="text-muted-foreground text-sm">Lass dir zuerst welche generieren.</p>
        <Button variant="hero" onClick={() => navigate("/lernen")}>
          <ArrowLeft className="h-4 w-4" /> Zur Themenwahl
        </Button>
      </Card>
    );
  }

  const current = queue[idx];
  const correctAnswer = current.kind === "vocab"
    ? (current.direction === "de_en" ? current.vocab.english : current.vocab.german)
    : current.correct;
  const promptText = current.kind === "vocab"
    ? (current.direction === "de_en" ? current.vocab.german : current.vocab.english)
    : current.prompt;
  const promptLang = current.kind === "vocab"
    ? (current.direction === "de_en" ? "Deutsch" : "English")
    : "Grammatik";
  const answerLang = current.kind === "vocab"
    ? (current.direction === "de_en" ? "English" : "Deutsch")
    : "die richtige Form";

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
    setStarted(false);
    setQueue([]);
  };

  const handlePick = async (opt: string) => {
    if (picked) return;
    setPicked(opt);
    const isCorrect = opt === correctAnswer;
    const newStats = { correct: stats.correct + (isCorrect ? 1 : 0), total: stats.total + 1 };
    setStats(newStats);
    const newCombo = isCorrect ? combo + 1 : 0;
    setCombo(newCombo);

    if (current.kind === "vocab") {
      const v = current.vocab;
      const newCorrect = v.correct_count + (isCorrect ? 1 : 0);
      const newWrong = v.wrong_count + (isCorrect ? 0 : 1);
      let status: "new" | "learning" | "mastered" = "learning";
      if (newCorrect >= 3 && newWrong === 0) status = "mastered";
      else if (newCorrect >= 5 && newCorrect > newWrong * 2) status = "mastered";
      await supabase.from("vocabulary").update({
        correct_count: newCorrect, wrong_count: newWrong, status,
        last_seen_at: new Date().toISOString(),
      }).eq("id", v.id);
    }

    if (isCorrect && user) {
      awardActivity(user.id, 5, { comboReached: newCombo }).then((r) => {
        if (r.leveledUp || r.newBadges.length) celebrate(r);
      });
      if (newCombo > 0 && newCombo % 5 === 0) {
        fireConfetti(newCombo >= 10);
        toast.success(`${randomPraise()} ${newCombo} in Folge!`);
      }
    }

    const delay = current.kind === "grammar" ? 1500 : 900;
    setTimeout(() => {
      let nextQueue = queue;
      if (!isCorrect && current.kind === "vocab") {
        const offset = 3 + Math.floor(Math.random() * 3);
        const insertAt = Math.min(idx + 1 + offset, queue.length);
        const dir = pickDirection(directionMode);
        const replay: VocabQ = { kind: "vocab", vocab: current.vocab, direction: dir, options: buildOptions(current.vocab, pool, dir) };
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
    }, delay);
  };

  const remaining = queue.length - idx;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => { setStarted(false); setQueue([]); }}>
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Button>
        <div className="text-xs sm:text-sm text-muted-foreground truncate">
          <span className="font-semibold text-foreground">{ctxLevel}</span> · {ctxTopic} · noch {remaining}
        </div>
      </div>

      <Card className="p-5 sm:p-6 md:p-8 text-center bg-gradient-card shadow-card animate-pop">
        <div className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{promptLang}</div>
        <div className="font-display text-xl sm:text-2xl md:text-3xl leading-tight break-words">{promptText}</div>
        <div className="text-xs text-muted-foreground mt-3">Wähle {answerLang}</div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-2 sm:gap-3">
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
              className={`rounded-2xl border-2 p-3 sm:p-4 text-left text-sm sm:text-base font-semibold transition-bounce ${cls}`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                {picked && isCorrect && <Check className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />}
                {picked && isPicked && !isCorrect && <X className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />}
                <span className="break-words">{opt}</span>
              </div>
            </button>
          );
        })}
      </div>

      {picked && current.kind === "grammar" && (
        <Card className="p-3 sm:p-4 bg-muted/40 text-sm">
          <span className="font-semibold">💡 </span>{current.explanation}
        </Card>
      )}

      <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
        <span>Richtig: <span className="font-semibold text-success">{stats.correct}</span></span>
        <span>Beantwortet: <span className="font-semibold text-foreground">{stats.total}</span></span>
        {combo > 1 && <span className="text-primary font-bold">🔥 {combo}</span>}
      </div>
    </div>
  );
}
