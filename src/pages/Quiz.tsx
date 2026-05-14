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
import { ArrowLeft, BookOpen, Check, GraduationCap, Library, Loader2, RefreshCw, SkipForward, Sparkles, X } from "lucide-react";
import { EllieIcon } from "@/components/EllieIcon";
import { FocusChip } from "@/components/FocusChip";
import { computeNextReview } from "@/lib/srs";
import { buildEllieUrl, ellieExplainGrammarPrompt, ellieExplainQuizMistakePrompt } from "@/lib/ellie";
import { toSentenceCase } from "@/lib/text";
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

// Distraktoren didaktisch sauber wählen:
// Die falschen Optionen müssen im Format zur richtigen Antwort passen, sonst
// kann man die Lösung allein an der Länge erkennen ("the housework" zwischen
// drei ganzen Sätzen wäre verraten). Wir gruppieren nach Wortzahl-Bucket und
// füllen erst aus dem gleichen Bucket auf, danach mit nächstliegenden.
function wordBucket(s: string): "single" | "short" | "long" {
  const n = s.trim().split(/\s+/).filter(Boolean).length;
  if (n <= 1) return "single";
  if (n <= 3) return "short";
  return "long";
}

function buildOptions(target: Vocab, pool: Vocab[], direction: CardDirection): string[] {
  const correct = direction === "de_en" ? target.english : target.german;
  const targetBucket = wordBucket(correct);

  const candidates = pool
    .filter((v) => v.id !== target.id)
    .map((v) => (direction === "de_en" ? v.english : v.german))
    .filter((s, i, arr) => s && s !== correct && arr.indexOf(s) === i);

  const sameBucket = shuffle(candidates.filter((s) => wordBucket(s) === targetBucket));
  const distractors: string[] = sameBucket.slice(0, 3);

  if (distractors.length < 3) {
    // Auffüllen mit den nächstliegenden Längen, damit es trotzdem passt.
    const correctLen = correct.trim().split(/\s+/).filter(Boolean).length;
    const rest = shuffle(candidates.filter((s) => !distractors.includes(s)))
      .sort((a, b) => {
        const da = Math.abs(a.trim().split(/\s+/).length - correctLen);
        const db = Math.abs(b.trim().split(/\s+/).length - correctLen);
        return da - db;
      });
    for (const s of rest) {
      if (distractors.length >= 3) break;
      distractors.push(s);
    }
  }
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
  // Aufschlüsselung der gespeicherten Vokabeln nach Herkunft
  // (Onboarding-Pool, KI-generiert, NGSL-Pool, manuell). Wird im Picker angezeigt.
  const [sourceBreakdown, setSourceBreakdown] = useState<Record<string, number>>({});
  const [emptyReview, setEmptyReview] = useState(false);
  const [autoStartTried, setAutoStartTried] = useState(false);

  // URL deep links (?level=…&topic=…) sind ephemere Session-Overrides für
  // genau diesen Quiz-Lauf. Sie dürfen NICHT die globale Auswahl im Profil
  // überschreiben (das war der A2-Spring-Bug: alter Onboarding-Link
  // `?level=A2&topic=Alltag` hat das gewählte B1 jedes Mal zurückgesetzt).
  useEffect(() => {
    if (!ctxReady) return;
    const urlLevel = params.get("level") as Level | null;
    const urlTopic = params.get("topic");
    setLevel((urlLevel ?? ctxLevel) as Level);
    setTopic(urlTopic ?? ctxTopic);
  }, [ctxReady, ctxLevel, ctxTopic, params]);

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

  // count saved vocab for current context + breakdown by source
  useEffect(() => {
    if (!user || !ctxReady || started) return;
    (async () => {
      const { data, count } = await supabase
        .from("vocabulary")
        .select("source", { count: "exact" })
        .eq("user_id", user.id).eq("level", ctxLevel).eq("topic", ctxTopic);
      setReviewCount(count ?? 0);
      const breakdown: Record<string, number> = {};
      for (const row of data ?? []) {
        const key = (row.source as string) || "ai";
        breakdown[key] = (breakdown[key] ?? 0) + 1;
      }
      setSourceBreakdown(breakdown);
    })();
  }, [user, ctxReady, ctxLevel, ctxTopic, started]);

  // Auto-Start aus dem Onboarding heraus (?autostart=1) –
  // direkt mit dem frischen Pool starten, ohne dass der Picker dazwischenkommt.
  useEffect(() => {
    if (autoStartTried) return;
    if (!user || !ctxReady || started || loading) return;
    const wantsAuto = params.get("autostart") === "1";
    if (!wantsAuto) return;
    if (reviewCount === null) return; // noch nicht geladen
    setAutoStartTried(true);
    if (reviewCount > 0) {
      setMode("vocab");
      setVocabSource("review");
      void startVocab("review");
    }
    // autostart-Param aus URL entfernen, damit ein Reload nicht erneut auto-startet.
    const search = new URLSearchParams(window.location.search);
    search.delete("autostart");
    const qs = search.toString();
    navigate({ pathname: window.location.pathname, search: qs ? `?${qs}` : "" }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, ctxReady, started, loading, reviewCount, autoStartTried, params]);

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
                  {reviewCount !== null && reviewCount > 0 && Object.keys(sourceBreakdown).length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {Object.entries(sourceBreakdown)
                        .sort((a, b) => b[1] - a[1])
                        .map(([src, n]) => {
                          const label =
                            src === "onboarding" ? "Onboarding"
                            : src === "ngsl" ? "NGSL"
                            : src === "manual" ? "Eigene"
                            : "KI";
                          return (
                            <span
                              key={src}
                              className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60"
                            >
                              {label} · {n}
                            </span>
                          );
                        })}
                    </div>
                  )}
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

    // Kein Auto-Advance mehr — auch bei richtigen Antworten soll der Lerner
    // die Erklärung sehen und bewusst auf "Weiter" tippen. Lernen vor Tempo.
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

  // Skip = aktuelle Frage überspringen (zählt als beantwortet, nicht als
  // korrekt; bricht den Combo). Vokabel-Karten werden nicht in die Queue
  // re-injected, weil "weiß ich nicht" hier weniger schmerzhaft sein soll
  // als eine Falschantwort — sie bleiben aber für SRS unverändert.
  const skipQuestion = () => {
    if (picked) return;
    const newStats = { correct: stats.correct, total: stats.total + 1 };
    setStats(newStats);
    setCombo(0);
    const nextIdx = idx + 1;
    if (nextIdx >= queue.length) {
      finish(newStats);
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

      {/* Status-Zeile mit klarem Richtig/Falsch + Lösung. */}
      {picked && (() => {
        const isWrong = picked !== correctAnswer;
        return (
          <div
            className={`rounded-xl border p-3 text-sm ${
              isWrong
                ? "bg-destructive/10 border-destructive/30 text-foreground"
                : "bg-success/10 border-success/30 text-foreground"
            }`}
          >
            <div className="font-bold mb-0.5">
              {isWrong ? "❌ Leider falsch" : "✅ Richtig!"}
            </div>
            {isWrong ? (
              <div className="text-xs sm:text-sm">
                Richtige Antwort: <span className="font-semibold">{correctAnswer}</span>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-muted-foreground">
                Gut gemacht — diese Antwort passt zur Bedeutung und zum Beispielsatz.
              </div>
            )}
          </div>
        );
      })()}

      {/* Mini-Ellie-Erklärung für Vokabel-Quiz — parallel zu Lektion / Lückentext.
          Greift sowohl bei richtig als auch bei falsch und zeigt das Wortpaar
          + ggf. Grammatik-Note kompakt an, damit der Lerner versteht WAS er
          gerade gesehen hat (nicht nur "richtig/falsch"). */}
      {picked && current.kind === "vocab" && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-start gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shrink-0">
            <EllieIcon size={18} />
          </span>
          <div className="min-w-0 flex-1 space-y-1 text-xs sm:text-sm leading-relaxed">
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Coach Ellie</div>
            <p className="text-foreground/90">
              <span className="text-muted-foreground">Deutsch: </span>
              <span className="font-semibold text-foreground">{current.vocab.german}</span>
              <span className="text-muted-foreground"> · Englisch: </span>
              <span className="font-semibold text-foreground">{current.vocab.english}</span>
            </p>
            {current.vocab.grammar_note && (
              <p className="text-muted-foreground italic">{current.vocab.grammar_note}</p>
            )}
            {picked !== correctAnswer && (
              <p className="text-destructive">
                Deine Antwort: <span className="font-semibold">{picked}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {picked && current.kind === "grammar" && (
        <Card className="p-3 sm:p-4 bg-muted/40 text-sm">
          <span className="font-semibold">💡 </span>
          {current.explanation || "Diese Form passt zur Regel im Beispielsatz."}
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

      {picked && (
        <div className="flex justify-center">
          <Button
            variant="hero"
            size="lg"
            onClick={() => advance(picked === correctAnswer)}
            className="rounded-full px-8"
          >
            {idx + 1 >= queue.length && picked === correctAnswer
              ? "Ergebnis anzeigen"
              : "Weiter"}
          </Button>
        </div>
      )}

      {/* Skip-Button: nur sichtbar bevor man eine Antwort gewählt hat. */}
      {!picked && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={skipQuestion}
            className="h-9 rounded-full text-muted-foreground hover:text-foreground"
          >
            <SkipForward className="h-4 w-4" /> Überspringen
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
