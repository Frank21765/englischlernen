import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLearning } from "@/hooks/useLearningContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FocusChip } from "@/components/FocusChip";
import { awardActivity, celebrate, fireConfetti, randomPraise } from "@/lib/gamification";
import { buildEllieUrl, ellieExplainClozePrompt } from "@/lib/ellie";
import { toast } from "sonner";
import { ArrowLeft, Check, Loader2, Sparkles, SkipForward, X, RefreshCw } from "lucide-react";
import { EllieIcon } from "@/components/EllieIcon";
import { capitalizeFirst, toSentenceCase } from "@/lib/text";
import { coerceToTyped, EXPLANATION_TYPE_LABELS, type TypedExplanation } from "@/lib/explanations";

interface ClozeItem {
  full_sentence: string;
  missing_word: string;
  translation: string;
  hint: string;
  explanation: TypedExplanation;
}

function maskSentence(sentence: string, word: string): { before: string; after: string } {
  const idx = sentence.toLowerCase().indexOf(word.toLowerCase());
  if (idx < 0) return { before: sentence, after: "" };
  return {
    before: sentence.slice(0, idx),
    after: sentence.slice(idx + word.length),
  };
}

export default function Lueckentext() {
  const { user } = useAuth();
  const { level, topic, hasSelection } = useLearning();
  const navigate = useNavigate();

  const [items, setItems] = useState<ClozeItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState<null | boolean>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [combo, setCombo] = useState(0);
  const [wrongItems, setWrongItems] = useState<ClozeItem[]>([]);
  const [done, setDone] = useState<{ correct: number; total: number; wrong: ClozeItem[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input when a new question appears, but with a small delay
  // so the user can read the sentence before the mobile keyboard pops up and
  // covers half the screen. 600ms is the sweet spot from Frank's testing.
  useEffect(() => {
    if (!items.length || revealed !== null) return;
    const t = setTimeout(() => {
      inputRef.current?.focus();
    }, 600);
    return () => clearTimeout(t);
  }, [idx, items.length, revealed]);

  // Restore a paused Lückentext session after a "Frag Ellie" side-trip.
  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const resumeId = search.get("resume");
    if (!resumeId) return;
    try {
      const raw = sessionStorage.getItem(`cloze-resume-${resumeId}`);
      if (!raw) return;
      const snap = JSON.parse(raw) as {
        items: ClozeItem[]; idx: number; answer: string; revealed: null | boolean;
        stats: { correct: number; total: number }; combo: number;
      };
      setItems(snap.items);
      setIdx(snap.idx);
      setAnswer(snap.answer);
      setRevealed(snap.revealed);
      setStats(snap.stats);
      setCombo(snap.combo);
      sessionStorage.removeItem(`cloze-resume-${resumeId}`);
      search.delete("resume");
      const qs = search.toString();
      navigate({ pathname: window.location.pathname, search: qs ? `?${qs}` : "" }, { replace: true });
    } catch (e) {
      console.error("[cloze] resume failed", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const { data: vocab } = await supabase
        .from("vocabulary")
        .select("german,english")
        .eq("user_id", user.id)
        .eq("level", level)
        .eq("topic", topic)
        .limit(20);

      const { data, error } = await supabase.functions.invoke("generate-cloze", {
        body: { level, topic, vocab: vocab ?? [] },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const rawItems = (data.items ?? []) as Array<Omit<ClozeItem, "explanation"> & { explanation?: unknown }>;
      const safeItems: ClozeItem[] = rawItems.map((item) => ({
        ...item,
        explanation: coerceToTyped(item.explanation),
      }));
      setItems(safeItems);
      setIdx(0);
      setAnswer("");
      setRevealed(null);
      setStats({ correct: 0, total: 0 });
      setCombo(0);
      setWrongItems([]);
      setDone(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler beim Generieren");
    } finally {
      setBusy(false);
    }
  };

  const finishRound = (finalStats: { correct: number; total: number }, finalWrong: ClozeItem[]) => {
    if (user && finalStats.total > 0) {
      supabase
        .from("learning_sessions")
        .insert({
          user_id: user.id,
          mode: "cloze",
          level,
          topic,
          total_answers: finalStats.total,
          correct_answers: finalStats.correct,
        })
        .then(() => undefined);
    }
    if (finalStats.correct === finalStats.total) fireConfetti(true);
    else if (finalStats.correct >= Math.ceil(finalStats.total * 0.7)) fireConfetti(false);
    setDone({ correct: finalStats.correct, total: finalStats.total, wrong: finalWrong });
  };

  const current = items[idx];

  const submit = async () => {
    if (!current || revealed !== null) return;
    const isCorrect = answer.trim().toLowerCase() === current.missing_word.toLowerCase();
    setRevealed(isCorrect);
    if (!isCorrect) setWrongItems((prev) => [...prev, current]);
    const newStats = { correct: stats.correct + (isCorrect ? 1 : 0), total: stats.total + 1 };
    setStats(newStats);
    const newCombo = isCorrect ? combo + 1 : 0;
    setCombo(newCombo);

    if (isCorrect) {
      toast.success(randomPraise());
      if (newCombo > 0 && newCombo % 5 === 0) fireConfetti(newCombo >= 10);
    }

    if (user) {
      const result = await awardActivity(user.id, isCorrect ? 8 : 2, { mode: "cloze", comboReached: newCombo });
      celebrate(result);
    }
  };

  const next = () => {
    if (idx + 1 >= items.length) {
      finishRound(stats, wrongItems);
      return;
    }
    setIdx(idx + 1);
    setAnswer("");
    setRevealed(null);
  };

  // Skip = jump to next question without judging the answer. We DO count it
  // in the total (so stats stay honest about what was attempted) but not as
  // correct, and we don't break the combo punishingly — combo just resets.
  const skip = () => {
    if (revealed !== null) {
      next();
      return;
    }
    const newTotal = stats.total + 1;
    const newStats = { correct: stats.correct, total: newTotal };
    const newWrong = [...wrongItems, current];
    setStats(newStats);
    setCombo(0);
    if (idx + 1 >= items.length) {
      finishRound(newStats, newWrong);
      return;
    }
    setWrongItems(newWrong);
    setIdx(idx + 1);
    setAnswer("");
    setRevealed(null);
  };

  if (done) {
    const { correct, total, wrong } = done;
    const pct = total > 0 ? correct / total : 0;
    const message =
      pct === 1
        ? "Perfekt! Kein einziger Fehler — das ist echter Lernfortschritt."
        : pct >= 0.8
        ? "Sehr gut! Fast fehlerlos — das Gehirn arbeitet."
        : pct >= 0.6
        ? "Solide! Die meisten Lücken richtig — noch etwas Luft nach oben."
        : pct >= 0.4
        ? "Weiter so. Jeder Fehler ist ein Lernmoment."
        : "Dieser Stoff war neu — beim nächsten Mal wird es besser.";
    return (
      <div className="space-y-5 max-w-2xl mx-auto">
        <Card className="p-6 sm:p-8 space-y-5 bg-gradient-card shadow-card">
          <div className="text-center space-y-2">
            <div className="text-3xl sm:text-4xl font-display font-bold">
              {correct} <span className="text-muted-foreground text-xl font-normal">/ {total}</span>
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Lückentext abgeschlossen</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
          </div>
          {wrong.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {wrong.length === 1 ? "1 Fehler" : `${wrong.length} Fehler`}
              </div>
              <div className="space-y-1.5">
                {wrong.map((item, i) => (
                  <div key={i} className="rounded-xl bg-destructive/5 border border-destructive/20 px-3 py-2 text-sm flex items-start gap-2">
                    <X className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    <span>
                      <span className="font-semibold">{capitalizeFirst(item.missing_word)}</span>
                      <span className="text-muted-foreground"> — {item.translation}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {wrong.length > 0 && (
              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={() => {
                  setItems(wrong);
                  setIdx(0);
                  setAnswer("");
                  setRevealed(null);
                  setStats({ correct: 0, total: 0 });
                  setCombo(0);
                  setWrongItems([]);
                  setDone(null);
                }}
              >
                <RefreshCw className="h-4 w-4" /> Fehler wiederholen ({wrong.length})
              </Button>
            )}
            <Button variant="soft" size="lg" className="w-full" onClick={() => { setDone(null); generate(); }}>
              <Sparkles className="h-4 w-4" /> Neue Runde starten
            </Button>
            {wrong.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="w-full rounded-full"
                onClick={() => {
                  const mistakeList = wrong
                    .map((item) => `- "${capitalizeFirst(item.missing_word)}" (${item.translation}): ${item.full_sentence}`)
                    .join("\n");
                  const prompt = `Ich habe gerade eine Lückentext-Übung auf Englisch (Niveau ${level}, Thema: ${topic}) gemacht und diese Wörter falsch:\n${mistakeList}\n\nKannst du mir kurz erklären, warum diese Wörter schwierig sind und wie ich sie mir besser merken kann?`;
                  const url = buildEllieUrl({
                    prefill: prompt,
                    auto: true,
                    title: "Lückentext-Fehler",
                    returnTo: "/training/lueckentext",
                    returnLabel: "Zurück zum Lückentext",
                  });
                  navigate(url);
                }}
              >
                <EllieIcon size={16} alt="" /> Frag Ellie über die Fehler
              </Button>
            )}
            <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate("/start")}>
              <ArrowLeft className="h-4 w-4" /> Zurück zum Training
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="space-y-5 max-w-2xl mx-auto">
        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl">Lückentext-Modus 🧩</h1>
          <FocusChip />
          <p className="text-sm text-muted-foreground">
            Setze das fehlende Wort ein. Trainiert Konjugation, Vokabeln und Satzbau auf Englisch.
          </p>
        </header>

        {!hasSelection ? (
          <Card className="p-6 sm:p-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Bitte zuerst auf der Startseite einen Fokus (Niveau & Thema) wählen.
            </p>
          </Card>
        ) : (
          <Card className="hover-lift p-5 space-y-4 bg-gradient-card shadow-card">
            <p className="text-sm text-muted-foreground">
              Wir generieren Lückensätze passend zu <span className="font-semibold text-foreground">{level}</span> · {topic}.
            </p>
            <Button variant="hero" size="xl" disabled={busy} onClick={generate} className="w-full">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              Lückentext-Übung starten
            </Button>
          </Card>
        )}
      </div>
    );
  }

  const masked = maskSentence(current.full_sentence, current.missing_word);

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setItems([])}>
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Button>
        <div className="text-sm text-muted-foreground">
          {idx + 1} / {items.length} {combo > 1 && <span className="ml-2 text-primary font-bold">🔥 {combo}</span>}
        </div>
      </div>

      <Card className="hover-lift p-6 bg-gradient-card shadow-card animate-pop space-y-4">
        <div className="text-xs font-bold uppercase tracking-widest text-primary">Lückentext</div>
        <div className="font-display text-xl md:text-2xl leading-relaxed">
          {masked.before}
          <span
            className={`inline-block min-w-24 mx-1 px-3 py-1 rounded-lg border-2 border-dashed align-middle ${
              revealed === null
                ? "border-primary text-primary"
                : revealed
                ? "border-success bg-success/20 text-success"
                : "border-destructive bg-destructive/20 text-destructive"
            }`}
          >
            {revealed !== null ? capitalizeFirst(current.missing_word) : "___"}
          </span>
          {masked.after}
        </div>
        <div className="text-sm text-muted-foreground italic">{current.translation}</div>
        {revealed === null && (
          <div className="text-xs text-muted-foreground">💡 {current.hint}</div>
        )}
      </Card>

      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (revealed === null) submit();
              else next();
            }
          }}
          placeholder="Dein Wort…"
          disabled={revealed !== null}
          className="rounded-2xl h-12 text-base"
        />
        {revealed === null ? (
          <Button variant="default" size="lg" onClick={submit} disabled={!answer.trim()}>
            <Check className="h-4 w-4" /> Prüfen
          </Button>
        ) : (
          <Button variant="default" size="lg" onClick={next}>
            Weiter
          </Button>
        )}
      </div>

      {/* Skip-Button: nur bevor man geantwortet hat — danach übernimmt "Weiter". */}
      {revealed === null && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={skip}
            className="h-9 rounded-full text-muted-foreground hover:text-foreground"
          >
            <SkipForward className="h-4 w-4" /> Überspringen
          </Button>
        </div>
      )}

      {revealed === false && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <X className="h-4 w-4" /> Richtig wäre: <span className="font-bold">{capitalizeFirst(current.missing_word)}</span>
        </div>
      )}

      {/* Mini-Erklärung von Ellie — auch bei richtiger Antwort, parallel zu Lektionen.
          Zeigt Übersetzung + Hint kompakt formatiert, damit Frank versteht WARUM. */}
      {revealed !== null && (() => {
        const exp = current.explanation;
        const label = EXPLANATION_TYPE_LABELS[exp.type] ?? "Erklärung";
        return (
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 space-y-1.5 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{label}</span>
              <span className="text-xs text-muted-foreground font-semibold">
                {capitalizeFirst(current.missing_word)}
                {current.hint ? <span className="font-normal"> — {current.hint}</span> : null}
              </span>
            </div>
            <p className="leading-snug text-foreground/90">{exp.short}</p>
            {exp.contrastDE && (
              <p className="text-xs text-muted-foreground leading-snug">🇩🇪 {exp.contrastDE}</p>
            )}
            {exp.trapNote && (
              <p className="text-xs text-amber-600 dark:text-amber-400 leading-snug">⚠️ {exp.trapNote}</p>
            )}
            {exp.generalization && (
              <p className="text-xs text-muted-foreground italic leading-snug">💡 {exp.generalization}</p>
            )}
            <p className="text-xs text-muted-foreground italic mt-1">„{toSentenceCase(current.full_sentence)}"</p>
          </div>
        );
      })()}

      {revealed !== null && (
        <div className="flex justify-center">
          <Button
            size="sm"
            className="h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 font-semibold shadow-sm"
            onClick={() => {
              const resumeId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
              const snap = { items, idx, answer, revealed, stats, combo };
              try { sessionStorage.setItem(`cloze-resume-${resumeId}`, JSON.stringify(snap)); } catch { /* ignore */ }
              const shortWord = current.missing_word.length > 24 ? `${current.missing_word.slice(0, 21)}…` : current.missing_word;
              const url = buildEllieUrl({
                prefill: ellieExplainClozePrompt({
                  sentence: current.full_sentence,
                  missingWord: current.missing_word,
                  translation: current.translation,
                  userAnswer: answer,
                  wasCorrect: revealed === true,
                  level,
                  topic,
                }),
                auto: true,
                title: shortWord,
                returnTo: `/training/lueckentext?resume=${resumeId}`,
                returnLabel: "Zurück zur Übung",
              });
              navigate(url);
            }}
          >
            <EllieIcon size={18} alt="" />
            Frag Ellie
          </Button>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <span>Richtig: <span className="font-semibold text-success">{stats.correct}</span></span>
        <span>Beantwortet: <span className="font-semibold text-foreground">{stats.total}</span></span>
      </div>
    </div>
  );
}
