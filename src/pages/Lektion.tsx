import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import {
  getLesson,
  getTaskExplanation,
  getTaskHint,
  getTaskMeaningHint,
  isTaskAnswerCorrect,
  LessonTask,
  markLessonComplete,
  markTaskComplete,
  readLessonProgress,
  recordTaskMistake,
  resetLessonRun,
} from "@/lib/lessons";
import { ArrowLeft, Check, CheckCircle2, Loader2, Lightbulb, RotateCcw, Target, Trophy, X } from "lucide-react";
import { awardActivity, celebrate, fireConfetti, randomPraise } from "@/lib/gamification";
import { toast } from "sonner";
import { EllieIcon } from "@/components/EllieIcon";
import { EllieButton } from "@/components/EllieButton";


/** Build a lesson-aware prompt so Coach Ellie has the current task in context. */
function buildEllieLessonPrompt(opts: {
  lessonTitle: string;
  level: string;
  task: LessonTask;
}): string {
  const { lessonTitle, level, task } = opts;
  const ctx = `Kontext: Lektion *${lessonTitle}* (Niveau ${level}).`;
  if (task.type === "mc") {
    return `${ctx}
Ich übe gerade diese Multiple-Choice-Aufgabe und möchte sie besser verstehen:
Frage: *${task.prompt}*
Optionen: ${task.options.map((o) => `„${o}“`).join(", ")}
Richtige Antwort: *${task.answer}*

Bitte erklär mir freundlich, warum *${task.answer}* hier richtig ist, was die anderen Optionen bedeuten würden, und gib mir 1–2 weitere kurze Beispielsätze auf meinem Niveau.`;
  }
  if (task.type === "cloze") {
    return `${ctx}
Ich arbeite gerade an dieser Lückentext-Aufgabe:
Satz: *${task.sentence.replace("___", "_____")}*
Richtiges Wort: *${task.answer}*${task.translation ? `\nÜbersetzung: ${task.translation}` : ""}${task.hint ? `\nHinweis war: ${task.hint}` : ""}

Bitte erklär mir freundlich, warum *${task.answer}* hier passt (Bedeutung, Form, typische Verwendung) und gib mir 1–2 weitere kurze Beispielsätze auf meinem Niveau.`;
  }
  // order
  return `${ctx}
Ich übe gerade diese Satzbau-Aufgabe:
Aufgabe: *${task.prompt}*
Wörter: ${task.words.map((w) => `„${w}“`).join(", ")}
Richtige Reihenfolge: *${task.answer}*

Bitte erklär mir kurz die Satzstruktur, warum diese Reihenfolge richtig ist, und gib 1–2 weitere ähnliche Beispielsätze auf meinem Niveau.`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const correctOf = (t: LessonTask): string =>
  t.type === "mc" ? t.answer : t.type === "cloze" ? t.answer : t.answer;

const taskTypeLabel = (t: LessonTask) =>
  t.type === "mc" ? "Multiple Choice" : t.type === "cloze" ? "Lückentext" : "Satzbau";

const explanationParagraphs = (text: string) =>
  text
    .split("\u2003")
    .map((sentence) => sentence.trim())
    .filter(Boolean);

/** Render very small **bold** markdown spans inside a hint string. */
const renderInlineBold = (text: string): (string | JSX.Element)[] => {
  const out: (string | JSX.Element)[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) out.push(text.slice(lastIndex, m.index));
    out.push(<strong key={`b-${key++}`} className="font-semibold text-foreground">{m[1]}</strong>);
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) out.push(text.slice(lastIndex));
  return out;
};

export default function Lektion() {
  
  const { lessonId = "" } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const lesson = useMemo(() => getLesson(lessonId), [lessonId]);

  // The active task list. Normally = lesson.tasks, but in "review difficult
  // tasks only" mode we replace it with a curated subset and keep the original
  // around for the global progress indicator.
  const [taskList, setTaskList] = useState<LessonTask[]>(lesson?.tasks ?? []);
  const [reviewMode, setReviewMode] = useState(false);

  // completed task ids (against full lesson) hydrated from localStorage
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [mistakeIds, setMistakeIds] = useState<Set<string>>(new Set());
  const [activeIdx, setActiveIdx] = useState(0);
  const [done, setDone] = useState(false);

  // per-task UI state
  const [textInput, setTextInput] = useState("");
  const [orderTokens, setOrderTokens] = useState<string[]>([]);
  const [orderPicked, setOrderPicked] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<null | boolean>(null);
  const [awarding, setAwarding] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Hydrate progress + jump to first incomplete task on mount / lesson change.
  useEffect(() => {
    if (!lesson) return;
    setTaskList(lesson.tasks);
    setReviewMode(false);
    const p = readLessonProgress(user?.id ?? null, lesson.id);
    const set = new Set(p.completedIds);
    setCompleted(set);
    setMistakeIds(new Set(p.mistakeIds ?? []));
    if (p.completedAt && set.size >= lesson.tasks.length) {
      setDone(true);
      setActiveIdx(lesson.tasks.length - 1);
      return;
    }
    const firstIncomplete = lesson.tasks.findIndex((t) => !set.has(t.id));
    setActiveIdx(firstIncomplete === -1 ? 0 : firstIncomplete);
  }, [lesson, user?.id]);

  // Reset per-task UI whenever active task changes; auto-focus cloze input.
  useEffect(() => {
    const t = taskList[activeIdx];
    if (!t) return;
    setRevealed(null);
    setTextInput("");
    if (t.type === "order") {
      setOrderTokens(shuffle(t.words));
      setOrderPicked([]);
    }
    // Auto-focus the cloze input so users can start typing immediately.
    // Use a slightly delayed retry so the focus survives layout shifts on
    // task transitions (e.g. when a previous task type was different).
    if (t.type === "cloze") {
      const tryFocus = () => inputRef.current?.focus();
      requestAnimationFrame(tryFocus);
      const t1 = window.setTimeout(tryFocus, 60);
      const t2 = window.setTimeout(tryFocus, 200);
      return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
    }
  }, [activeIdx, taskList]);

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
  const task = taskList[activeIdx];
  const runTotal = taskList.length;

  // ---- Lesson finished celebration + review ----
  if (done) {
    const mistakeTasks = lesson.tasks.filter((t) => mistakeIds.has(t.id));
    const startFullReplay = () => {
      resetLessonRun(user?.id ?? null, lesson.id);
      setCompleted(new Set());
      setMistakeIds(new Set());
      setTaskList(lesson.tasks);
      setReviewMode(false);
      setDone(false);
      setActiveIdx(0);
    };
    const startMistakeReplay = () => {
      if (mistakeTasks.length === 0) return;
      setTaskList(mistakeTasks);
      setReviewMode(true);
      setDone(false);
      setActiveIdx(0);
    };

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="p-6 sm:p-7 text-center space-y-3 bg-gradient-card shadow-glow border border-success/40 animate-pop">
          <div className="mx-auto h-14 w-14 rounded-full bg-success/15 border border-success/40 flex items-center justify-center">
            <Trophy className="h-7 w-7 text-success" />
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-success">Lektion abgeschlossen</div>
            <h1 className="text-xl sm:text-2xl font-display">{lesson.title} {lesson.emoji}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Stark! Du hast alle {total} Aufgaben gemeistert.
            {mistakeTasks.length === 0
              ? " Und das fehlerfrei — beeindruckend!"
              : " Schau dir unten kurz an, was beim ersten Versuch schwer war."}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
            <Button variant="hero" size="default" asChild>
              <Link to="/uben/lektionen">
                <Trophy className="h-4 w-4" /> Zur Übersicht
              </Link>
            </Button>
            {mistakeTasks.length > 0 && (
              <Button variant="soft" size="default" onClick={startMistakeReplay}>
                <Target className="h-4 w-4" /> Schwierige nochmal ({mistakeTasks.length})
              </Button>
            )}
            <Button variant="ghost" size="default" onClick={startFullReplay}>
              <RotateCcw className="h-4 w-4" /> Komplett wiederholen
            </Button>
          </div>
        </Card>

        {mistakeTasks.length > 0 && (
          <Card className="p-5 sm:p-6 space-y-4 bg-gradient-card shadow-card">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shrink-0">
                <EllieIcon size={22} />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-widest text-primary">Coach Ellie</div>
                <h2 className="text-base sm:text-lg font-display">Kurzer Rückblick</h2>
              </div>
            </div>
            <ul className="space-y-3">
              {mistakeTasks.map((t) => (
                <li key={t.id} className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {taskTypeLabel(t)}
                  </div>
                  <div className="text-sm font-medium">{t.prompt}</div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Lösung: </span>
                    <span className="font-semibold text-success">{correctOf(t)}</span>
                  </div>
                  {t.explain && (
                    <div className="text-xs text-muted-foreground italic flex items-start gap-1.5 pt-1">
                      <EllieIcon size={14} className="mt-0.5" />
                      <span>{t.explain}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    );
  }

  // ---- Submit / advance handlers ----
  const isCorrect = (): boolean => {
    if (!task) return false;
    if (task.type === "mc") return textInput === task.answer; // textInput stores picked option
    if (task.type === "cloze") return isTaskAnswerCorrect(task, textInput);
    if (task.type === "order") return isTaskAnswerCorrect(task, orderPicked.join(" "));
    return false;
  };

  const handleSubmit = async () => {
    if (!task || revealed !== null) return;
    const ok = isCorrect();
    setRevealed(ok);
    if (ok) {
      toast.success(randomPraise());
      // In review mode we don't re-mark already-completed tasks but we do
      // remove them from the mistake set on a successful retry.
      if (!reviewMode) {
        const nextSet = new Set(completed).add(task.id);
        setCompleted(nextSet);
        markTaskComplete(user?.id ?? null, lesson.id, task.id);
      } else if (mistakeIds.has(task.id)) {
        const next = new Set(mistakeIds);
        next.delete(task.id);
        setMistakeIds(next);
      }
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
      if (!reviewMode) {
        recordTaskMistake(user?.id ?? null, lesson.id, task.id);
        setMistakeIds((prev) => new Set(prev).add(task.id));
      }
    }
  };

  const handleNext = async () => {
    if (!task) return;
    const nextIdx = activeIdx + 1;
    if (nextIdx >= runTotal) {
      if (reviewMode) {
        // Finished the targeted review run — bounce back to the celebration.
        setDone(true);
        return;
      }
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

  // The user's current attempt — used to show "you wrote ___" in feedback.
  const userAttempt =
    task?.type === "order"
      ? orderPicked.join(" ").trim()
      : textInput.trim();

  const taskHint = task ? getTaskHint(task) : undefined;
  const feedbackExplanation = task && revealed !== null
    ? getTaskExplanation(task, { isCorrect: revealed, userAnswer: userAttempt })
    : "";

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        {reviewMode ? (
          <Button variant="ghost" size="sm" onClick={() => setDone(true)}>
            <ArrowLeft className="h-4 w-4" /> Zurück zum Abschluss
          </Button>
        ) : (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/uben/lektionen">
              <ArrowLeft className="h-4 w-4" /> Übersicht
            </Link>
          </Button>
        )}
        <div className="text-sm text-muted-foreground">
          {reviewMode ? "Wiederholung" : "Aufgabe"} {activeIdx + 1} / {runTotal}
        </div>
      </div>

      <header className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-2xl">{lesson.emoji}</span>
          <h1 className="text-xl sm:text-2xl font-display truncate">{lesson.title}</h1>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border bg-primary/15 text-primary border-primary/30">
            {lesson.level}
          </span>
          {reviewMode && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border bg-accent/15 text-accent border-accent/30 inline-flex items-center gap-1">
              <Target className="h-3 w-3" /> Schwierige Aufgaben
            </span>
          )}
        </div>
        <Progress value={pct} className="h-2" />
        <div className="text-xs text-muted-foreground">{doneCount} / {total} der ganzen Lektion abgeschlossen</div>
      </header>

      {/* Task list overview pill row — lets users see/jump to completed tasks */}
      {!reviewMode && (
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
      )}

      <Card className="p-5 sm:p-6 space-y-4 bg-gradient-card shadow-card animate-pop">
        <div className="text-xs font-bold uppercase tracking-widest text-primary">
          {taskTypeLabel(task)}
        </div>
        <div className="text-base sm:text-lg font-medium leading-snug">{task.prompt}</div>
        {taskHint && revealed === null && (
          <div className="flex items-start gap-2 rounded-xl bg-accent/10 border border-accent/30 p-2.5">
            <Lightbulb className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-accent">Hinweis</div>
              <div className="text-sm text-foreground/90 leading-snug">{taskHint}</div>
            </div>
          </div>
        )}

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
              ref={inputRef}
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
          <div className="space-y-2">
            <div className="min-h-12 rounded-xl border-2 border-dashed border-border p-2 flex flex-wrap gap-1.5">
              {orderPicked.length === 0 && (
                <span className="text-xs text-muted-foreground self-center px-1">Tippe die Wörter unten in der richtigen Reihenfolge an.</span>
              )}
              {orderPicked.map((tok, i) => (
                <button
                  key={`${tok}-${i}`}
                  onClick={() => unpickOrderToken(i)}
                  disabled={revealed !== null}
                  title="Tippen, um dieses Wort wieder zu entfernen"
                  className="rounded-lg bg-primary/15 text-primary border border-primary/30 px-2.5 py-1 text-sm font-semibold hover:bg-primary/25"
                >
                  {tok}
                </button>
              ))}
            </div>
            {revealed === null && orderPicked.length > 0 && (
              <div className="flex items-center justify-between gap-2 px-1">
                <span className="text-[11px] text-muted-foreground">
                  Tippe ein platziertes Wort an, um es zu entfernen.
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => unpickOrderToken(orderPicked.length - 1)}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    ↶ Letztes zurück
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (task.type !== "order") return;
                      setOrderTokens(shuffle(task.words));
                      setOrderPicked([]);
                    }}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Zurücksetzen
                  </button>
                </div>
              </div>
            )}
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

        {/* Coach Ellie's coaching moment — appears after every answer (correct
            or wrong). The built-in explanation must already teach something
            useful on its own; Ellie remains available for deeper follow-up. */}
        {revealed !== null && (
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 space-y-2.5">
            <div className="flex items-start gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shrink-0">
                <EllieIcon size={18} />
              </span>
              <div className="min-w-0 flex-1 space-y-2 text-xs sm:text-sm leading-relaxed">
                <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Coach Ellie</div>
                <div className="text-foreground/90 space-y-1.5">
                  {explanationParagraphs(feedbackExplanation).map((paragraph, index) => (
                    <p key={`${task.id}-exp-${index}`}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <EllieButton
                variant="sm"
                prefill={buildEllieLessonPrompt({ lessonTitle: lesson.title, level: lesson.level, task })}
                title={`Lektion: ${lesson.title}`}
                returnTo={`/uben/lektionen/${lesson.id}`}
                returnLabel="Zurück zur Lektion"
                returnFlagKey={`hello.lesson.return.${lesson.id}`}
              />
            </div>
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
              {activeIdx + 1 >= runTotal
                ? (reviewMode ? "Wiederholung beenden" : "Lektion abschließen")
                : "Weiter"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
