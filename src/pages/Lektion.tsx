import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import {
  getLesson,
  LessonTask,
  markLessonComplete,
  markTaskComplete,
  readLessonProgress,
} from "@/lib/lessons";
import { ArrowLeft, Check, CheckCircle2, Loader2, Trophy, X } from "lucide-react";
import { awardActivity, celebrate, fireConfetti, randomPraise } from "@/lib/gamification";
import { toast } from "sonner";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Lektion() {
  const { lessonId = "" } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const lesson = useMemo(() => getLesson(lessonId), [lessonId]);

  // completed task ids hydrated from localStorage
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [activeIdx, setActiveIdx] = useState(0);
  const [done, setDone] = useState(false);

  // per-task UI state
  const [textInput, setTextInput] = useState("");
  const [orderTokens, setOrderTokens] = useState<string[]>([]);
  const [orderPicked, setOrderPicked] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<null | boolean>(null);
  const [awarding, setAwarding] = useState(false);

  // Hydrate progress + jump to first incomplete task on mount / lesson change.
  useEffect(() => {
    if (!lesson) return;
    const p = readLessonProgress(user?.id ?? null, lesson.id);
    const set = new Set(p.completedIds);
    setCompleted(set);
    if (p.completedAt && set.size >= lesson.tasks.length) {
      setDone(true);
      setActiveIdx(lesson.tasks.length - 1);
      return;
    }
    const firstIncomplete = lesson.tasks.findIndex((t) => !set.has(t.id));
    setActiveIdx(firstIncomplete === -1 ? 0 : firstIncomplete);
  }, [lesson, user?.id]);

  // Reset per-task UI whenever active task changes.
  useEffect(() => {
    if (!lesson) return;
    const t = lesson.tasks[activeIdx];
    if (!t) return;
    setRevealed(null);
    setTextInput("");
    if (t.type === "order") {
      setOrderTokens(shuffle(t.words));
      setOrderPicked([]);
    }
  }, [activeIdx, lesson]);

  if (!lesson) {
    return (
      <Card className="p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto">
        <h2 className="text-xl sm:text-2xl">Lektion nicht gefunden</h2>
        <Button variant="hero" onClick={() => navigate("/uben/lektionen")}>
          <ArrowLeft className="h-4 w-4" /> Zurück zur Übersicht
        </Button>
      </Card>
    );
  }

  const total = lesson.tasks.length;
  const doneCount = Math.min(completed.size, total);
  const pct = Math.round((doneCount / total) * 100);
  const task = lesson.tasks[activeIdx];

  // ---- Lesson finished celebration ----
  if (done) {
    return (
      <div className="max-w-xl mx-auto space-y-5">
        <Card className="p-8 sm:p-10 text-center space-y-5 bg-gradient-card shadow-glow border border-success/40 animate-pop">
          <div className="mx-auto h-20 w-20 rounded-full bg-success/15 border border-success/40 flex items-center justify-center">
            <Trophy className="h-10 w-10 text-success" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-widest text-success">Lektion abgeschlossen</div>
            <h1 className="text-2xl sm:text-3xl font-display">{lesson.title} {lesson.emoji}</h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Stark! Du hast alle {total} Aufgaben dieser Lektion gemeistert.
            Mach weiter so — jeder Tag bringt dich näher an dein Ziel.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button variant="hero" size="lg" asChild>
              <Link to="/uben/lektionen">
                <Trophy className="h-4 w-4" /> Zur Lektionsübersicht
              </Link>
            </Button>
            <Button variant="soft" size="lg" onClick={() => {
              // Allow replay without losing the "completed" badge.
              setCompleted(new Set());
              setDone(false);
              setActiveIdx(0);
            }}>
              Nochmal üben
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ---- Submit / advance handlers ----
  const correctOf = (t: LessonTask): string =>
    t.type === "mc" ? t.answer : t.type === "cloze" ? t.answer : t.answer;

  const isCorrect = (): boolean => {
    if (!task) return false;
    if (task.type === "mc") return textInput === task.answer; // textInput stores picked option
    if (task.type === "cloze") return textInput.trim().toLowerCase() === task.answer.trim().toLowerCase();
    if (task.type === "order") return orderPicked.join(" ").trim().toLowerCase() === task.answer.trim().toLowerCase();
    return false;
  };

  const handleSubmit = async () => {
    if (!task || revealed !== null) return;
    const ok = isCorrect();
    setRevealed(ok);
    if (ok) {
      toast.success(randomPraise());
      const nextSet = new Set(completed).add(task.id);
      setCompleted(nextSet);
      markTaskComplete(user?.id ?? null, lesson.id, task.id);
      if (user) {
        setAwarding(true);
        try {
          const result = await awardActivity(user.id, 5);
          celebrate(result);
        } finally {
          setAwarding(false);
        }
      }
    } else {
      toast.error("Nicht ganz — schau dir die richtige Lösung an.");
    }
  };

  const handleNext = async () => {
    if (!task) return;
    // If wrong, allow user to try again instead of being forced forward; here we move on.
    const nextIdx = activeIdx + 1;
    if (nextIdx >= total) {
      // Lesson complete!
      markLessonComplete(user?.id ?? null, lesson.id);
      setDone(true);
      fireConfetti(true);
      if (user) {
        const result = await awardActivity(user.id, 25, { perfectQuiz: completed.size + 1 >= total });
        celebrate(result);
      }
      return;
    }
    setActiveIdx(nextIdx);
  };

  const pickOrderToken = (tok: string, i: number) => {
    if (revealed !== null) return;
    setOrderPicked((p) => [...p, tok]);
    setOrderTokens((toks) => toks.filter((_, idx) => idx !== i));
  };
  const unpickOrderToken = (i: number) => {
    if (revealed !== null) return;
    const tok = orderPicked[i];
    setOrderPicked((p) => p.filter((_, idx) => idx !== i));
    setOrderTokens((toks) => [...toks, tok]);
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/uben/lektionen">
            <ArrowLeft className="h-4 w-4" /> Übersicht
          </Link>
        </Button>
        <div className="text-sm text-muted-foreground">
          Aufgabe {activeIdx + 1} / {total}
        </div>
      </div>

      <header className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-2xl">{lesson.emoji}</span>
          <h1 className="text-xl sm:text-2xl font-display truncate">{lesson.title}</h1>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border bg-primary/15 text-primary border-primary/30">
            {lesson.level}
          </span>
        </div>
        <Progress value={pct} className="h-2" />
        <div className="text-xs text-muted-foreground">{doneCount} / {total} abgeschlossen</div>
      </header>

      {/* Task list overview pill row — lets users see/jump to completed tasks */}
      <div className="flex flex-wrap gap-1.5">
        {lesson.tasks.map((t, i) => {
          const isDone = completed.has(t.id);
          const isActive = i === activeIdx;
          return (
            <button
              key={t.id}
              onClick={() => setActiveIdx(i)}
              className={`h-7 min-w-7 px-2 rounded-full text-xs font-bold inline-flex items-center justify-center gap-1 border transition-smooth ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : isDone
                    ? "bg-success/15 text-success border-success/30"
                    : "bg-muted text-muted-foreground border-border hover:bg-muted/70"
              }`}
              title={isDone ? "Erledigt" : "Aufgabe"}
            >
              {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </button>
          );
        })}
      </div>

      <Card className="p-5 sm:p-6 space-y-4 bg-gradient-card shadow-card animate-pop">
        <div className="text-xs font-bold uppercase tracking-widest text-primary">
          {task.type === "mc" ? "Multiple Choice" : task.type === "cloze" ? "Lückentext" : "Satzbau"}
        </div>
        <div className="text-base sm:text-lg font-medium leading-snug">{task.prompt}</div>

        {task.type === "mc" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {task.options.map((opt) => {
              const picked = textInput === opt;
              const isAnsw = opt === task.answer;
              const showRight = revealed !== null && isAnsw;
              const showWrong = revealed === false && picked && !isAnsw;
              return (
                <button
                  key={opt}
                  onClick={() => revealed === null && setTextInput(opt)}
                  disabled={revealed !== null}
                  className={`text-left rounded-xl border-2 p-3 transition-bounce text-sm ${
                    showRight
                      ? "border-success bg-success/10"
                      : showWrong
                        ? "border-destructive bg-destructive/10"
                        : picked
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {task.type === "cloze" && (
          <div className="space-y-2">
            <div className="font-display text-lg sm:text-xl leading-relaxed">
              {task.sentence.split("___").map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="inline-block min-w-20 mx-1 px-2 py-0.5 rounded-md border-2 border-dashed border-primary text-primary align-middle">
                      {revealed !== null ? task.answer : "___"}
                    </span>
                  )}
                </span>
              ))}
            </div>
            {task.translation && (
              <div className="text-xs text-muted-foreground italic">{task.translation}</div>
            )}
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (revealed === null) handleSubmit();
                  else handleNext();
                }
              }}
              placeholder="Dein Wort…"
              disabled={revealed !== null}
              className="rounded-xl h-11"
              autoFocus
            />
          </div>
        )}

        {task.type === "order" && (
          <div className="space-y-3">
            <div className="min-h-12 rounded-xl border-2 border-dashed border-border p-2 flex flex-wrap gap-1.5">
              {orderPicked.length === 0 && (
                <span className="text-xs text-muted-foreground self-center px-1">Tippe die Wörter unten in der richtigen Reihenfolge an.</span>
              )}
              {orderPicked.map((tok, i) => (
                <button
                  key={`${tok}-${i}`}
                  onClick={() => unpickOrderToken(i)}
                  disabled={revealed !== null}
                  className="rounded-lg bg-primary/15 text-primary border border-primary/30 px-2.5 py-1 text-sm font-semibold"
                >
                  {tok}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {orderTokens.map((tok, i) => (
                <button
                  key={`${tok}-${i}`}
                  onClick={() => pickOrderToken(tok, i)}
                  disabled={revealed !== null}
                  className="rounded-lg bg-muted text-foreground border border-border px-2.5 py-1 text-sm font-semibold hover:bg-muted/70"
                >
                  {tok}
                </button>
              ))}
            </div>
            {revealed !== null && (
              <div className="text-xs text-muted-foreground">
                Richtig: <span className="font-semibold text-foreground">{task.answer}</span>
              </div>
            )}
          </div>
        )}

        {task.hint && revealed === null && (
          <div className="text-xs text-muted-foreground">💡 {task.hint}</div>
        )}

        {revealed !== null && (
          <div
            className={`flex items-center gap-2 text-sm font-semibold ${
              revealed ? "text-success" : "text-destructive"
            }`}
          >
            {revealed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {revealed ? "Richtig!" : `Lösung: ${correctOf(task)}`}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {revealed === null ? (
            <Button
              variant="hero"
              size="lg"
              className="flex-1"
              onClick={handleSubmit}
              disabled={
                awarding ||
                (task.type === "mc" && !textInput) ||
                (task.type === "cloze" && !textInput.trim()) ||
                (task.type === "order" && orderTokens.length > 0)
              }
            >
              {awarding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Prüfen
            </Button>
          ) : (
            <Button variant="success" size="lg" className="flex-1" onClick={handleNext}>
              {activeIdx + 1 >= total ? "Lektion abschließen" : "Weiter"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
