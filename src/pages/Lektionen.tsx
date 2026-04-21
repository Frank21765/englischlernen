import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useLearning } from "@/hooks/useLearningContext";
import { LESSONS, readLessonProgress } from "@/lib/lessons";
import { CheckCircle2, Trophy } from "lucide-react";
import { FocusChip } from "@/components/FocusChip";

export default function Lektionen() {
  const { user } = useAuth();
  const { level } = useLearning();

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl">Lektionen 🎓</h1>
        <p className="text-sm text-muted-foreground">
          Geführte Lerneinheiten mit gemischten Aufgaben — passend zu deinem Niveau.
        </p>
        <FocusChip />
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {LESSONS.map((lesson) => {
          const prog = readLessonProgress(user?.id ?? null, lesson.id);
          const total = lesson.tasks.length;
          const done = Math.min(prog.completedIds.length, total);
          const pct = total ? Math.round((done / total) * 100) : 0;
          const completed = !!prog.completedAt && done >= total;
          const matchesLevel = lesson.level === level;

          return (
            <Link
              key={lesson.id}
              to={`/uben/lektionen/${lesson.id}`}
              className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
            >
              <Card
                className={`relative h-full p-4 sm:p-5 bg-gradient-card shadow-card transition-bounce hover:-translate-y-0.5 hover:shadow-glow border ${
                  completed ? "border-success/40" : matchesLevel ? "border-primary/30" : "border-border"
                }`}
              >
                {completed && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-success/15 text-success text-xs font-bold px-2 py-1 border border-success/30">
                    <Trophy className="h-3.5 w-3.5" /> Abgeschlossen
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <div className="text-3xl sm:text-4xl leading-none select-none">{lesson.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display text-lg sm:text-xl truncate">{lesson.title}</h2>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                          matchesLevel
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {lesson.level}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-0.5">
                      {lesson.subtitle}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      {done > 0 && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                      {done} / {total} Aufgaben
                    </span>
                    <span className="font-semibold text-foreground">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
