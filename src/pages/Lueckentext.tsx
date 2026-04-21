import { useEffect, useState } from "react";
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
import { ArrowLeft, Check, Loader2, Sparkles, X } from "lucide-react";
import { EllieIcon } from "@/components/EllieIcon";

interface ClozeItem {
  full_sentence: string;
  missing_word: string;
  translation: string;
  hint: string;
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
  const [busy, setBusy] = useState(false);

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
      setItems(data.items ?? []);
      setIdx(0);
      setAnswer("");
      setRevealed(null);
      setStats({ correct: 0, total: 0 });
      setCombo(0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler beim Generieren");
    } finally {
      setBusy(false);
    }
  };

  const current = items[idx];

  const submit = async () => {
    if (!current || revealed !== null) return;
    const isCorrect = answer.trim().toLowerCase() === current.missing_word.toLowerCase();
    setRevealed(isCorrect);
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
      toast.success(`Runde fertig! ${stats.correct}/${stats.total} richtig`);
      // Record session at the end of a finished round
      if (user && stats.total > 0) {
        supabase
          .from("learning_sessions")
          .insert({
            user_id: user.id,
            mode: "cloze",
            level,
            topic,
            total_answers: stats.total,
            correct_answers: stats.correct,
          })
          .then(() => undefined);
      }
      setItems([]);
      return;
    }
    setIdx(idx + 1);
    setAnswer("");
    setRevealed(null);
  };

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
              Bitte zuerst auf der Lernen-Seite einen Fokus (Niveau & Thema) wählen.
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
            {revealed !== null ? current.missing_word : "___"}
          </span>
          {masked.after}
        </div>
        <div className="text-sm text-muted-foreground italic">{current.translation}</div>
        <div className="text-xs text-muted-foreground">💡 {current.hint}</div>
      </Card>

      <div className="flex gap-2">
        <Input
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
          autoFocus
        />
        {revealed === null ? (
          <Button variant="hero" size="lg" onClick={submit} disabled={!answer.trim()}>
            <Check className="h-4 w-4" /> Prüfen
          </Button>
        ) : (
          <Button variant="success" size="lg" onClick={next}>
            Weiter
          </Button>
        )}
      </div>

      {revealed === false && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <X className="h-4 w-4" /> Richtig wäre: <span className="font-bold">{current.missing_word}</span>
        </div>
      )}

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
                returnTo: `/uben/lueckentext?resume=${resumeId}`,
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
