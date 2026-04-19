import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLearning } from "@/hooks/useLearningContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Level, LEVELS, QUICK_TOPICS } from "@/lib/learning";
import { awardActivity, celebrate, fireConfetti, randomPraise } from "@/lib/gamification";
import { toast } from "sonner";
import { ArrowLeft, Check, Loader2, Sparkles, X } from "lucide-react";

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
  const [params] = useSearchParams();
  const [level, setLevel] = useState<Level>((params.get("level") as Level) ?? "A1");
  const [topic, setTopic] = useState(params.get("topic") ?? "Alltag");

  const [items, setItems] = useState<ClozeItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState<null | boolean>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [combo, setCombo] = useState(0);
  const [busy, setBusy] = useState(false);

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
      const result = await awardActivity(user.id, isCorrect ? 8 : 2, { comboReached: newCombo });
      celebrate(result);
    }
  };

  const next = () => {
    if (idx + 1 >= items.length) {
      toast.success(`Runde fertig! ${stats.correct}/${stats.total} richtig`);
      setItems([]);
      return;
    }
    setIdx(idx + 1);
    setAnswer("");
    setRevealed(null);
  };

  if (!items.length) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <header>
          <h1 className="text-2xl sm:text-3xl">Lückentext-Modus 🧩</h1>
          <p className="text-sm text-muted-foreground">
            Setze das fehlende Wort ein. Trainiert Konjugation, Vokabeln und Satzbau auf Englisch.
          </p>
        </header>

        <Card className="p-5 space-y-5 bg-gradient-card shadow-card">
          <div>
            <div className="text-sm font-semibold mb-2">Niveau</div>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`min-w-[3rem] rounded-2xl px-3 py-1.5 text-sm font-bold transition-bounce ${
                    level === l ? "bg-primary text-primary-foreground shadow-glow" : "bg-muted text-foreground hover:bg-muted/70"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold mb-2">Thema</div>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-2xl h-11" />
            <div className="flex flex-wrap gap-2 mt-2">
              {QUICK_TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-smooth ${
                    topic === t ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <Button variant="hero" size="xl" disabled={busy} onClick={generate} className="w-full">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            Lückentext-Übung starten
          </Button>
        </Card>
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

      <Card className="p-6 bg-gradient-card shadow-card animate-pop space-y-4">
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

      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <span>Richtig: <span className="font-semibold text-success">{stats.correct}</span></span>
        <span>Beantwortet: <span className="font-semibold text-foreground">{stats.total}</span></span>
      </div>
    </div>
  );
}
