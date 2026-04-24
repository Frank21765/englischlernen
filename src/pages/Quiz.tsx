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
import { ArrowLeft, BookOpen, Check, GraduationCap, Library, Loader2, RefreshCw, Sparkles, X } from "lucide-react";
import { EllieIcon } from "@/components/EllieIcon";
import { FocusChip } from "@/components/FocusChip";
import { computeNextReview } from "@/lib/srs";
import { buildEllieUrl, ellieExplainGrammarPrompt, ellieExplainQuizMistakePrompt } from "@/lib/ellie";
import { Link } from "react-router-dom";

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
  interval_days: number;
  ease_factor: number;
}

type QuizMode = "vocab" | "grammar";
type VocabSource = "review" | "fresh";

interface VocabQ { kind: "vocab"; vocab: Vocab; direction: CardDirection; options: string[] }
interface GrammarQ { kind: "grammar"; prompt: string; options: string[]; correct: string; explanation: string }
type QuizItem = VocabQ | GrammarQ;

function buildEllieChatTitle(item: QuizItem): string {
  if (item.kind === "grammar") {
    const shortPrompt = item.prompt.replace(/\s+/g, " ").trim();
    return shortPrompt.length > 36 ? `${shortPrompt.slice(0, 33)}…` : shortPrompt;
  }

  return item.vocab.english;
}

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
  const [vocabSource, setVocabSource] = useState<VocabSource>("review");
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [emptyReview, setEmptyReview] = useState(false);

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

  // Restore a quiz session that was paused for "Frag Ellie".
  // Runs once on mount; reads from window.location so we don't depend on
  // react-router's async state propagation.
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const resumeId = search.get("resume");
    if (!resumeId) return;
    try {
      const raw = sessionStorage.getItem(`quiz-resume-${resumeId}`);
      if (!raw) {
        console.warn("[quiz] resume snapshot not found:", resumeId);
        return;
      }
      const snap = JSON.parse(raw) as {
        mode: QuizMode; queue: QuizItem[]; pool: Vocab[]; idx: number; picked: string | null;
        stats: { correct: number; total: number }; combo: number; sessionId: string | null;
        directionMode: "de_en" | "en_de" | "random"; vocabSource: VocabSource;
      };
      setMode(snap.mode);
      setQueue(snap.queue);
      setPool(snap.pool);
      setIdx(snap.idx);
      setPicked(snap.picked);
      setStats(snap.stats);
      setCombo(snap.combo);
      setSessionId(snap.sessionId);
      setDirectionMode(snap.directionMode);
      setVocabSource(snap.vocabSource);
      setStarted(true);
      sessionStorage.removeItem(`quiz-resume-${resumeId}`);
      search.delete("resume");
      const qs = search.toString();
      // Use the canonical path so we don't bounce through LegacyRedirect,
      // which would unmount Quiz and wipe the state we just restored.
      navigate({ pathname: window.location.pathname, search: qs ? `?${qs}` : "" }, { replace: true });
    } catch (e) {
      console.error("[quiz] resume failed", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // count saved vocab for current context (refreshed when picker shown)
  useEffect(() => {
    if (!user || !ctxReady || started) return;
    (async () => {
      const { count } = await supabase
        .from("vocabulary")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id).eq("level", ctxLevel).eq("topic", ctxTopic);
      setReviewCount(count ?? 0);
    })();
  }, [user, ctxReady, ctxLevel, ctxTopic, started]);

  const startVocab = async (source: VocabSource = vocabSource) => {
    if (!user) return;
    setLoading(true);
    setEmptyReview(false);
    try {
      const { data: profile } = await supabase
        .from("profiles").select("direction_mode").eq("user_id", user.id).maybeSingle();
      const dm = (profile?.direction_mode as "de_en"|"en_de"|"random") ?? "random";
      setDirectionMode(dm);

      // If "Neu starten": generate fresh vocab and persist before quizzing
      if (source === "fresh") {
        const { data: existing } = await supabase
          .from("vocabulary").select("german")
          .eq("user_id", user.id).eq("level", ctxLevel).eq("topic", ctxTopic);
        const existingGerman = (existing ?? []).map((r) => r.german);

        const { data: gen, error: genErr } = await supabase.functions.invoke("generate-vocabulary", {
          body: { level: ctxLevel, topic: ctxTopic, existing: existingGerman },
        });
        if (genErr) throw genErr;
        if (gen?.error) throw new Error(gen.error);
        const pairs: Array<{ german: string; english: string; grammar_note?: string }> = gen?.pairs ?? [];
        if (!pairs.length) throw new Error("Keine Vokabeln erhalten");
        const rows = pairs.map((p) => ({
          user_id: user.id,
          level: ctxLevel,
          topic: ctxTopic,
          german: p.german.trim(),
          english: p.english.trim(),
          grammar_note: p.grammar_note ?? null,
        }));
        const { error: insErr } = await supabase
          .from("vocabulary")
          .upsert(rows, { onConflict: "user_id,german,english", ignoreDuplicates: true });
        if (insErr) throw insErr;
        toast.success(`${pairs.length} neue Vokabeln erzeugt`);
      }

      const { data: vocab } = await supabase
        .from("vocabulary").select("*")
        .eq("user_id", user.id).eq("level", ctxLevel).eq("topic", ctxTopic);
      const all = (vocab ?? []) as Vocab[];
      setPool(all);
      if (!all.length) {
        // Review path with empty pool → show inline fallback instead of an error toast
        setEmptyReview(true);
        setReviewCount(0);
        setLoading(false);
        return;
      }
      const items: QuizItem[] = shuffle(all).map((v) => {
        const dir = pickDirection(dm);
        return { kind: "vocab", vocab: v, direction: dir, options: buildOptions(v, all, dir) };
      });
      setQueue(items);
      setIdx(0); setPicked(null); setStats({ correct: 0, total: 0 }); setCombo(0);
      setSessionId(null);
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
      setSessionId(null);
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
        <Button variant="hero" onClick={() => navigate("/start")}>
          <ArrowLeft className="h-4 w-4" /> Zur Auswahl
        </Button>
      </Card>
    );
  }

  if (!started) {
    return (
      <div className="space-y-5 max-w-2xl mx-auto">
        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl">Quiz 🎯</h1>
          <FocusChip />
        </header>

        <Card className="p-4 sm:p-5 space-y-4 bg-gradient-card shadow-card">
          <div>
            <div className="text-sm font-semibold mb-2">Quiz-Art wählen</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("vocab")}
                className={`rounded-2xl p-3 text-left transition-bounce border-2 hover:-translate-y-0.5 hover:shadow-glow ${
                  mode === "vocab" ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted"
                }`}
              >
                <BookOpen className="h-5 w-5 text-sky-400 mb-1" />
                <div className="font-bold text-sm">Vokabel-Quiz</div>
                <div className="text-xs text-muted-foreground">Übersetzung wählen</div>
              </button>
              <button
                onClick={() => setMode("grammar")}
                className={`rounded-2xl p-3 text-left transition-bounce border-2 hover:-translate-y-0.5 hover:shadow-glow ${
                  mode === "grammar" ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted"
                }`}
              >
                <Library className="h-5 w-5 text-violet-400 mb-1" />
                <div className="font-bold text-sm">Grammatik-Quiz</div>
                <div className="text-xs text-muted-foreground">Richtige Form wählen</div>
              </button>
            </div>
          </div>

          {mode === "vocab" && (
            <div>
              <div className="text-sm font-semibold mb-2">Vokabel-Quelle wählen</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setVocabSource("review")}
                  className={`rounded-2xl p-3 text-left transition-bounce border-2 hover:-translate-y-0.5 hover:shadow-glow ${
                    vocabSource === "review" ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <RefreshCw className="h-5 w-5 text-emerald-400 mb-1" />
                  <div className="font-bold text-sm">Wiederholen</div>
                  <div className="text-xs text-muted-foreground">
                    {reviewCount === null ? "Gespeicherte Vokabeln" : `${reviewCount} gespeicherte Vokabeln`}
                  </div>
                </button>
                <button
                  onClick={() => setVocabSource("fresh")}
                  className={`rounded-2xl p-3 text-left transition-bounce border-2 hover:-translate-y-0.5 hover:shadow-glow ${
                    vocabSource === "fresh" ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <Sparkles className="h-5 w-5 text-amber-400 mb-1" />
                  <div className="font-bold text-sm">Neu starten</div>
                  <div className="text-xs text-muted-foreground">20 frische Vokabeln generieren</div>
                </button>
              </div>
            </div>
          )}

          {emptyReview && mode === "vocab" && vocabSource === "review" && (
            <Card className="p-3 sm:p-4 bg-muted/40 text-sm space-y-3">
              <p>
                Für <span className="font-semibold">{ctxLevel} · {ctxTopic}</span> hast du noch keine gespeicherten Vokabeln.
                Sollen wir frische Vokabeln generieren und direkt loslegen?
              </p>
              <Button
                variant="hero"
                size="sm"
                disabled={loading}
                onClick={() => { setVocabSource("fresh"); startVocab("fresh"); }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Neue Vokabeln generieren & starten
              </Button>
            </Card>
          )}

          <Button
            variant="hero"
            size="xl"
            disabled={loading || (mode === "vocab" && vocabSource === "review" && reviewCount === 0)}
            onClick={() => mode === "vocab" ? startVocab(vocabSource) : startGrammar()}
            className="w-full text-sm sm:text-lg whitespace-normal leading-tight px-4 sm:px-10"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GraduationCap className="h-5 w-5" />}
            {mode === "grammar"
              ? "Grammatik-Quiz starten"
              : vocabSource === "fresh"
                ? "Neue Vokabeln generieren & Quiz starten"
                : "Wiederholungs-Quiz starten"}
          </Button>
          {mode === "vocab" && (
            <p className="text-xs text-muted-foreground">
              Aktiver Kontext: <span className="font-semibold text-foreground">{ctxLevel}</span> · {ctxTopic}
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
        <Button variant="hero" onClick={() => navigate("/start")}>
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
    // Only record sessions with actual answers (no 0/0 ghosts)
    if (user && finalStats.total > 0) {
      const sessionMode = mode === "grammar" ? "grammar_quiz" : "quiz";
      await supabase.from("learning_sessions").insert({
        user_id: user.id,
        mode: sessionMode,
        level: ctxLevel,
        topic: ctxTopic,
        total_answers: finalStats.total,
        correct_answers: finalStats.correct,
      });
    }
    const perfect = finalStats.total > 0 && finalStats.correct === finalStats.total;
    if (user) {
      const result = await awardActivity(user.id, finalStats.correct * 2, {
        mode: "quiz",
        perfectRun: perfect,
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
      const upd = computeNextReview(
        {
          correct_count: v.correct_count,
          wrong_count: v.wrong_count,
          interval_days: v.interval_days,
          ease_factor: v.ease_factor,
          status: v.status as "new" | "learning" | "mastered",
        },
        isCorrect,
      );
      await supabase.from("vocabulary").update(upd).eq("id", v.id);
    }

    if (isCorrect && user) {
      awardActivity(user.id, 5, { mode: "quiz", comboReached: newCombo }).then((r) => {
        if (r.leveledUp || r.newBadges.length) celebrate(r);
      });
      if (newCombo > 0 && newCombo % 5 === 0) {
        fireConfetti(newCombo >= 10);
        toast.success(`${randomPraise()} ${newCombo} in Folge!`);
      }
    }

    // Auto-advance only on correct vocab answers (snappy flow).
    // For wrong answers and ALL grammar questions, wait for the user to press
    // "Weiter" so the explanation and "Frag Ellie" button stay usable.
    if (current.kind === "vocab" && isCorrect) {
      setTimeout(() => { advance(isCorrect); }, 900);
    }
  };

  const advance = (wasCorrect: boolean) => {
    let nextQueue = queue;
    if (!wasCorrect && current.kind === "vocab") {
      const offset = 3 + Math.floor(Math.random() * 3);
      const insertAt = Math.min(idx + 1 + offset, queue.length);
      const dir = pickDirection(directionMode);
      const replay: VocabQ = { kind: "vocab", vocab: current.vocab, direction: dir, options: buildOptions(current.vocab, pool, dir) };
      nextQueue = [...queue.slice(0, insertAt), replay, ...queue.slice(insertAt)];
      setQueue(nextQueue);
    }
    const nextIdx = idx + 1;
    if (nextIdx >= nextQueue.length) {
      finish(stats);
      return;
    }
    setIdx(nextIdx);
    setPicked(null);
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

      <Card className="hover-lift p-5 sm:p-6 md:p-8 text-center bg-gradient-card shadow-card animate-pop">
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
              className={`${picked ? "" : "hover-lift"} rounded-2xl border-2 p-3 sm:p-4 text-left text-sm sm:text-base font-semibold transition-bounce ${cls}`}
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

      {picked && (() => {
        const isWrong = picked !== correctAnswer;
        // Show Ellie helper after a wrong vocab answer, or always for grammar (explanation deepening).
        const showEllie = (current.kind === "vocab" && isWrong) || current.kind === "grammar";
        if (!showEllie) return null;
        const prompt = current.kind === "vocab"
          ? ellieExplainQuizMistakePrompt({
              prompt: promptText,
              userAnswer: picked,
              correctAnswer,
              level: ctxLevel,
              topic: ctxTopic,
            })
          : ellieExplainGrammarPrompt({
              prompt: current.prompt,
              correctAnswer: current.correct,
              explanation: current.explanation,
              level: ctxLevel,
              topic: ctxTopic,
            });
        const handleAskEllie = () => {
          // Snapshot current quiz state so we can resume after Ellie.
          const resumeId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const snap = {
            mode, queue, pool, idx, picked, stats, combo, sessionId, directionMode, vocabSource,
          };
          try { sessionStorage.setItem(`quiz-resume-${resumeId}`, JSON.stringify(snap)); } catch { /* ignore quota */ }
          const url = buildEllieUrl({
            prefill: prompt,
            auto: true,
            title: buildEllieChatTitle(current),
            returnTo: `/quiz?resume=${resumeId}`,
            returnLabel: "Zurück zum Quiz",
          });
          navigate(url);
        };
        return (
          <div className="flex justify-center">
            <Button
              size="sm"
              className="h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 font-semibold shadow-sm"
              onClick={handleAskEllie}
            >
              <EllieIcon size={18} alt="" />
              Frag Ellie
            </Button>
          </div>
        );
      })()}

      {picked && !(current.kind === "vocab" && picked === correctAnswer) && (
        <div className="flex justify-center">
          <Button
            variant="hero"
            size="lg"
            onClick={() => advance(picked === correctAnswer)}
            className="rounded-full px-8"
          >
            Weiter
          </Button>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
        <span>Richtig: <span className="font-semibold text-success">{stats.correct}</span></span>
        <span>Beantwortet: <span className="font-semibold text-foreground">{stats.total}</span></span>
        {combo > 1 && <span className="text-primary font-bold">🔥 {combo}</span>}
      </div>
    </div>
  );
}
