import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLearning } from "@/hooks/useLearningContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LEVELS, QUICK_TOPICS, Level } from "@/lib/learning";
import { awardActivity, celebrate, fireConfetti, randomPraise } from "@/lib/gamification";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, Check, Lightbulb, Loader2, RefreshCw, Sparkles, X } from "lucide-react";

interface Example { en: string; de: string }
interface Mistake { wrong: string; correct: string; why: string }
interface Practice { sentence: string; answer: string; hint: string }
interface Lesson {
  title: string;
  explanation: string;
  examples: Example[];
  common_mistake: Mistake;
  practice: Practice[];
}

export default function Grammar() {
  const { user } = useAuth();
  const { level, topic, hasSelection, setSelection } = useLearning();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const generate = async () => {
    if (!user) return;
    setBusy(true);
    setLesson(null);
    setAnswers({});
    setRevealed({});
    try {
      const { data, error } = await supabase.functions.invoke("generate-grammar", {
        body: { level, topic: hasSelection ? topic : undefined, mode: "lesson" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.lesson) throw new Error("Keine Lektion erhalten");
      setLesson(data.lesson as Lesson);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler beim Laden");
    } finally {
      setBusy(false);
    }
  };

  const check = async (i: number) => {
    if (!lesson || revealed[i]) return;
    const given = (answers[i] ?? "").trim().toLowerCase();
    const expected = lesson.practice[i].answer.trim().toLowerCase();
    const ok = given === expected;
    setRevealed((r) => ({ ...r, [i]: true }));
    if (ok) {
      toast.success(randomPraise());
      fireConfetti(false);
      if (user) {
        const result = await awardActivity(user.id, 6);
        celebrate(result);
      }
    } else {
      toast.error(`Richtig wäre: ${lesson.practice[i].answer}`);
    }
  };

  if (!hasSelection) {
    return (
      <Card className="p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto">
        <BookOpen className="h-10 w-10 mx-auto text-primary" />
        <h2 className="text-xl sm:text-2xl">Wähle Niveau und Thema</h2>
        <p className="text-sm text-muted-foreground">
          Damit die Grammatik zu deinem Lernstand passt, wähle bitte zuerst ein CEFR-Niveau und ein Thema.
        </p>
        <Button variant="hero" onClick={() => navigate("/lernen")}>
          <ArrowLeft className="h-4 w-4" /> Zur Auswahl
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl">Grammatik 📚</h1>
        <p className="text-sm text-muted-foreground">
          Aktuell: <span className="font-semibold text-foreground">{level}</span> · {topic}
        </p>
      </header>

      <Card className="p-4 sm:p-5 space-y-4 bg-gradient-card shadow-card">
        <div>
          <Label className="mb-2 block text-sm font-semibold">Niveau</Label>
          <div className="flex flex-wrap gap-1.5">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setSelection(l as Level, topic)}
                className={`min-w-[2.75rem] rounded-2xl px-3 py-1.5 text-sm font-bold transition-bounce ${
                  level === l ? "bg-primary text-primary-foreground shadow-glow" : "bg-muted text-foreground hover:bg-muted/70"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="grammar-topic" className="mb-2 block text-sm font-semibold">Thema (optional)</Label>
          <Input
            id="grammar-topic"
            value={topic}
            onChange={(e) => setSelection(level, e.target.value)}
            className="rounded-2xl h-11"
            placeholder="z. B. Reise"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {QUICK_TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => setSelection(level, t)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-smooth ${
                  topic === t ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <Button variant="hero" size="lg" onClick={generate} disabled={busy} className="w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {lesson ? "Neue Lektion" : "Lektion starten"}
        </Button>
      </Card>

      {busy && !lesson && (
        <Card className="p-6 text-center text-muted-foreground animate-shimmer">Lade passende Grammatik…</Card>
      )}

      {lesson && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="font-display text-xl sm:text-2xl">{lesson.title}</h2>
              <Button size="sm" variant="ghost" onClick={generate} disabled={busy}>
                <RefreshCw className="h-3.5 w-3.5" /> Neu
              </Button>
            </div>
            <p className="text-sm leading-relaxed">{lesson.explanation}</p>
          </Card>

          <Card className="p-4 sm:p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Beispiele</div>
            <div className="space-y-2">
              {lesson.examples.map((ex, i) => (
                <div key={i} className="rounded-xl bg-muted/60 p-3 space-y-1">
                  <div className="font-medium">{ex.en}</div>
                  <div className="text-xs text-muted-foreground italic">{ex.de}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 sm:p-5 space-y-3 border-destructive/30">
            <div className="text-xs font-bold uppercase tracking-widest text-destructive flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" /> Typischer Fehler
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <span className="line-through text-muted-foreground">{lesson.common_mistake.wrong}</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <span className="font-medium">{lesson.common_mistake.correct}</span>
              </div>
              <p className="text-xs text-muted-foreground italic pt-1">{lesson.common_mistake.why}</p>
            </div>
          </Card>

          <Card className="p-4 sm:p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">Übung – setz das passende Wort ein</div>
            <div className="space-y-3">
              {lesson.practice.map((p, i) => {
                const parts = p.sentence.split("__");
                const isRevealed = !!revealed[i];
                const ok = isRevealed && (answers[i] ?? "").trim().toLowerCase() === p.answer.trim().toLowerCase();
                return (
                  <div key={i} className="rounded-xl border border-border p-3 space-y-2">
                    <div className="text-sm leading-relaxed flex flex-wrap items-center gap-1">
                      <span>{parts[0]}</span>
                      <Input
                        value={answers[i] ?? ""}
                        onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") check(i); }}
                        disabled={isRevealed}
                        placeholder="…"
                        className={`inline-flex h-9 w-32 sm:w-40 rounded-lg ${
                          isRevealed ? (ok ? "border-success" : "border-destructive") : ""
                        }`}
                      />
                      <span>{parts[1] ?? ""}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">💡 {p.hint}</span>
                      {!isRevealed ? (
                        <Button size="sm" variant="soft" onClick={() => check(i)} disabled={!(answers[i] ?? "").trim()}>
                          <Check className="h-3.5 w-3.5" /> Prüfen
                        </Button>
                      ) : (
                        <span className={`text-xs font-semibold ${ok ? "text-success" : "text-destructive"}`}>
                          {ok ? "Richtig!" : `Lösung: ${p.answer}`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
