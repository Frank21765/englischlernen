// Onboarding v3 / Phase 1a — fünf Screens:
//   welcome → goal → self → check → result.
//
// Bewusste Reduktion gegenüber v2 (9 Stages mit Interessen, Minutenziel, Topic-Picker).
// Interessen-Tags und Wochenziel werden nicht mehr abgefragt; die Spalten in
// `profiles` bleiben dafür einfach NULL (kein Code liest sie aktuell).
//
// Im Hintergrund (Phase-1-Nacharbeit) erzeugen wir beim Klick auf
// „Mit dieser Lektion starten" zusätzlich einen Onboarding-Vokabelpool.
// Das ist Bonus, blockiert aber nicht den Sprung in die Lektion.
//
// Admin-Preview-Modus (`?preview=1`) ist vorbereitet: alle Schreibzugriffe
// werden geguarded. Die Admin-Preview-UI selbst kommt in Phase 1b.

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLearning } from "@/hooks/useLearningContext";
import { supabase } from "@/integrations/supabase/client";
import { ensureProfileForUser } from "@/lib/profile";
import { useUserAccess } from "@/hooks/useUserAccess";
import AccessGate from "@/components/AccessGate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  saveOnboardingProfile,
  saveDiagnosticResult,
  type LearningGoal,
  type SelfAssessment,
} from "@/lib/onboarding";
import { logLearningEvent } from "@/lib/events";
import { onboardingCopy, type GoalId, type SelfId } from "@/lib/onboardingCopy";
import {
  computeRecommendation,
  scoreMiniCheck,
  type MiniCheckAnswer,
  type Recommendation,
} from "@/lib/onboardingRecommendation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  GraduationCap,
  Heart,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import appIcon from "@/assets/app-icon.png";

type Stage = "welcome" | "goal" | "self" | "check" | "result";

// Mapping vom v3-GoalId auf die bereits existierenden DB-Werte (LearningGoal).
// So bleibt das DB-Schema unverändert — Phase 1a führt keine Migration aus.
const GOAL_TO_DB: Record<GoalId, LearningGoal> = {
  auffrischen: "frei",
  grammatik: "frei",
  beruf_alltag: "arbeit",
  reisen_alltag: "reisen",
  wortschatz: "frei",
};

// Mapping der v3-Selbsteinschätzungen auf bestehende DB-Werte.
const SELF_TO_DB: Record<SelfId, SelfAssessment> = {
  leichter_neustart: "anfaenger",
  schulenglisch_rest: "etwas_erfahrung",
  satzbau_unsicher: "unsicher",
  alltag_zurecht: "fortgeschritten",
};

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { setSelection } = useLearning();
  const access = useUserAccess();
  const [searchParams] = useSearchParams();
  const previewMode = searchParams.get("preview") === "1";

  const [stage, setStage] = useState<Stage>("welcome");
  const [goal, setGoal] = useState<GoalId | null>(null);
  const [self, setSelf] = useState<SelfId | null>(null);
  const [taskIndex, setTaskIndex] = useState(0);
  const [answers, setAnswers] = useState<MiniCheckAnswer[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [startedLogged, setStartedLogged] = useState(false);

  const tasks = onboardingCopy.miniCheck.tasks;

  // Guard: nicht eingeloggt → Auth. Schon onboardet → Start.
  // Im previewMode überspringen wir die Onboarding-Completed-Weiterleitung.
  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth", { replace: true }); return; }
    (async () => {
      try {
        await ensureProfileForUser(user);
      } catch (error) {
        console.error("Onboarding profile sync failed", error);
      }
      if (!previewMode) {
        const { data } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data?.onboarding_completed) {
          navigate("/start", { replace: true });
          return;
        }
      }
      setChecking(false);
    })();
  }, [user, loading, navigate, previewMode]);

  // onboarding_started genau einmal pro Sitzung loggen.
  useEffect(() => {
    if (checking || startedLogged || previewMode) return;
    setStartedLogged(true);
    void logLearningEvent({ eventType: "onboarding_started" });
  }, [checking, startedLogged, previewMode]);

  const progress = useMemo(() => {
    if (stage === "welcome") return 6;
    if (stage === "goal") return 20;
    if (stage === "self") return 38;
    if (stage === "check") return 50 + (taskIndex / tasks.length) * 35;
    return 96;
  }, [stage, taskIndex, tasks.length]);

  const finishMiniCheck = (allAnswers: MiniCheckAnswer[]) => {
    const rec = computeRecommendation({
      goalId: goal,
      selfAssessmentId: self,
      miniCheckAnswers: allAnswers,
    });
    setRecommendation(rec);
    setStage("result");
    if (!previewMode) {
      void logLearningEvent({
        eventType: "recommendation_shown",
        level: rec.recommendedDefaultLevel,
        topic: rec.recommendedDefaultTopic,
        metadata: {
          band: rec.recommendedBand,
          entryCode: rec.recommendedEntryCode,
          lessonId: rec.recommendedLessonId,
          confidence: rec.confidenceBand,
        },
      });
    }
  };

  const onPickMiniCheck = (selectedIndex: number | null) => {
    const t = tasks[taskIndex];
    const next: MiniCheckAnswer[] = [...answers, { taskId: t.id, selectedIndex }];
    setAnswers(next);
    if (taskIndex + 1 < tasks.length) {
      setTaskIndex(taskIndex + 1);
    } else {
      finishMiniCheck(next);
    }
  };

  const skipMiniCheck = () => {
    // Übersprungen: alle restlichen Aufgaben als „nicht beantwortet" markieren.
    const remaining: MiniCheckAnswer[] = [];
    for (let i = taskIndex; i < tasks.length; i++) {
      remaining.push({ taskId: tasks[i].id, selectedIndex: null });
    }
    finishMiniCheck([...answers, ...remaining]);
  };

  const startWithRecommendation = async () => {
    if (!user || !recommendation) return;
    setBusy(true);
    try {
      // Im previewMode wird NICHTS gespeichert — die Empfehlung wird nur angezeigt.
      if (previewMode) {
        toast.message("Testmodus — Empfehlung wurde nicht gespeichert.");
        setBusy(false);
        return;
      }

      const score = scoreMiniCheck(answers, tasks);

      // 1) Onboarding-Profil ablegen (Phase-1-Felder, ohne Interessen/Minutenziel).
      const profileRes = await saveOnboardingProfile(user.id, {
        learning_goal: goal ? GOAL_TO_DB[goal] : "frei",
        self_assessment: self ? SELF_TO_DB[self] : "anfaenger",
        recommended_level: recommendation.recommendedDefaultLevel,
      });
      if (!profileRes.ok) {
        toast.error(`Profil konnte nicht gespeichert werden: ${profileRes.error ?? "Unbekannter Fehler"}`);
        throw new Error(profileRes.error ?? "Profil-Update fehlgeschlagen");
      }

      // 2) Default-Level + Thema fürs Lernen setzen (existierende Spalten).
      const { error: upErr } = await supabase
        .from("profiles")
        .update({
          default_level: recommendation.recommendedDefaultLevel,
          default_topic: recommendation.recommendedDefaultTopic,
        })
        .eq("user_id", user.id);
      if (upErr) {
        toast.error(`Lernkontext konnte nicht gespeichert werden: ${upErr.message}`);
        throw upErr;
      }

      // 3) Diagnose-Ergebnis ablegen, wenn überhaupt etwas beantwortet wurde.
      if (score.answered > 0) {
        const diag = await saveDiagnosticResult(user.id, {
          area: "vocab",
          score: score.correct,
          cefrEstimate: recommendation.recommendedDefaultLevel,
          details: {
            answered: score.answered,
            total: score.total,
            band: recommendation.recommendedBand,
            entryCode: recommendation.recommendedEntryCode,
            confidence: recommendation.confidenceBand,
            answers,
          },
        });
        if (!diag.ok) {
          console.error("[onboarding] diagnostic save failed", diag.error);
        }
      }

      setSelection(recommendation.recommendedDefaultLevel, recommendation.recommendedDefaultTopic, { persist: false });

      void logLearningEvent({
        eventType: "onboarding_completed",
        level: recommendation.recommendedDefaultLevel,
        topic: recommendation.recommendedDefaultTopic,
        metadata: { band: recommendation.recommendedBand, entryCode: recommendation.recommendedEntryCode },
      });
      void logLearningEvent({
        eventType: "first_lesson_started",
        level: recommendation.recommendedDefaultLevel,
        topic: recommendation.recommendedDefaultTopic,
        objectType: "lesson",
        objectId: recommendation.recommendedLessonId,
      });

      // 4) Bonus im Hintergrund: Onboarding-Vokabelpool erzeugen.
      // Bewusst „fire & forget" — wenn die Edge-Function tot ist, soll der
      // Sprung in die Lektion trotzdem klappen.
      void (async () => {
        try {
          const level = recommendation.recommendedDefaultLevel;
          const topic = recommendation.recommendedDefaultTopic;
          const { data: existing } = await supabase
            .from("vocabulary").select("german")
            .eq("user_id", user.id).eq("level", level).eq("topic", topic);
          const existingGerman = (existing ?? []).map((r) => r.german);
          const { data, error } = await supabase.functions.invoke("generate-vocabulary", {
            body: { level, topic, existing: existingGerman },
          });
          if (error || data?.error) {
            console.warn("[onboarding] vocab pool skipped", error ?? data?.error);
            return;
          }
          const pairs: Array<{ german: string; english: string; grammar_note?: string }> = data?.pairs ?? [];
          if (!pairs.length) return;
          const rows = pairs.map((p) => ({
            user_id: user.id,
            level,
            topic,
            german: p.german.trim(),
            english: p.english.trim(),
            grammar_note: p.grammar_note ?? null,
            source: "onboarding",
          }));
          await supabase
            .from("vocabulary")
            .upsert(rows, { onConflict: "user_id,german,english", ignoreDuplicates: true });
        } catch (err) {
          console.warn("[onboarding] vocab pool failed", err);
        }
      })();

      navigate(`/training/lektionen/${recommendation.recommendedLessonId}`, { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Etwas ist schiefgelaufen");
    } finally {
      setBusy(false);
    }
  };

  const changeStartingPoint = () => {
    setStage("goal");
    setTaskIndex(0);
    setAnswers([]);
    setRecommendation(null);
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!access.loading && access.status !== "active") {
    return <AccessGate>{null}</AccessGate>;
  }

  const cur = tasks[taskIndex];

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-gradient-to-br from-background via-muted/40 to-background px-4 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pt-10 sm:pb-10">
      <div className="mx-auto w-full max-w-xl space-y-4 sm:space-y-5">
        {previewMode && (
          <div className="rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
            Testmodus — keine Speicherung. (Admin-Preview)
          </div>
        )}
        <div className="flex items-center gap-3">
          <img src={appIcon} alt="" className="h-9 w-9 shrink-0" />
          <div className="flex-1 min-w-0">
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {stage === "welcome" && (
          <Card className="p-5 sm:p-7 space-y-4 sm:space-y-5 bg-gradient-card shadow-card">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary/15 p-3"><Sparkles className="h-6 w-6 text-primary" /></div>
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl">{onboardingCopy.welcome.title}</h1>
                <p className="text-muted-foreground text-sm sm:text-base">{onboardingCopy.welcome.line1}</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
              <li className="flex gap-2"><Compass className="h-5 w-5 text-accent shrink-0" /> {onboardingCopy.welcome.line2}</li>
              <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-accent shrink-0" /> Wir empfehlen dir am Ende einen ersten Schritt — kein Test, keine Note.</li>
            </ul>
            <Button size="lg" className="w-full" onClick={() => setStage("goal")}>
              {onboardingCopy.welcome.cta} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/auth", { replace: true });
              }}
            >
              Mit anderem Konto anmelden
            </Button>
          </Card>
        )}

        {stage === "goal" && (
          <Card className="p-5 sm:p-7 space-y-4 sm:space-y-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary/15 p-3"><Target className="h-6 w-6 text-primary" /></div>
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl">{onboardingCopy.goal.title}</h2>
                <p className="text-sm text-muted-foreground">{onboardingCopy.goal.helper}</p>
              </div>
            </div>
            <div className="grid gap-2">
              {onboardingCopy.goal.options.map((g) => {
                const isPicked = goal === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id)}
                    className={`w-full text-left rounded-xl border-2 px-4 py-3 text-sm sm:text-base font-semibold leading-snug transition-bounce break-words ${
                      isPicked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
            <Button
              size="lg"
              className="w-full"
              disabled={!goal}
              onClick={() => setStage("self")}
            >
              {onboardingCopy.goal.cta} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Card>
        )}

        {stage === "self" && (
          <Card className="p-5 sm:p-7 space-y-4 sm:space-y-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-accent/15 p-3"><Heart className="h-6 w-6 text-accent" /></div>
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl">{onboardingCopy.self.title}</h2>
                <p className="text-sm text-muted-foreground">{onboardingCopy.self.helper}</p>
              </div>
            </div>
            <div className="grid gap-2">
              {onboardingCopy.self.options.map((s) => {
                const isPicked = self === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelf(s.id)}
                    className={`w-full text-left rounded-xl border-2 px-4 py-3 text-sm sm:text-base font-semibold leading-snug transition-bounce break-words ${
                      isPicked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStage("goal")} className="self-start">
                <ArrowLeft className="h-4 w-4 mr-1" /> Zurück
              </Button>
              <Button
                size="lg"
                className="w-full sm:w-auto sm:min-w-[14rem]"
                disabled={!self}
                onClick={() => setStage("check")}
              >
                {onboardingCopy.self.cta} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </Card>
        )}

        {stage === "check" && cur && (
          <Card className="p-5 sm:p-7 space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wide">
                {onboardingCopy.miniCheck.progressLabel(taskIndex + 1, tasks.length)}
              </span>
              <button
                type="button"
                className="hover:text-foreground transition-smooth underline-offset-2 hover:underline"
                onClick={skipMiniCheck}
              >
                {onboardingCopy.miniCheck.skipLabel}
              </button>
            </div>
            <p className="text-xs uppercase tracking-wide text-accent">{cur.kind}</p>
            <h2 className="text-lg sm:text-xl font-semibold">{cur.prompt}</h2>
            <div className="grid gap-2">
              {cur.options.map((opt, idx) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => onPickMiniCheck(idx)}
                  className="w-full text-left rounded-xl border-2 border-border bg-card hover:bg-muted px-4 py-3 text-sm sm:text-base font-medium leading-snug break-words transition-bounce"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{onboardingCopy.miniCheck.helper}</p>
          </Card>
        )}

        {stage === "result" && recommendation && (
          <Card className="p-5 sm:p-7 space-y-4 sm:space-y-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-accent/15 p-3"><GraduationCap className="h-6 w-6 text-accent" /></div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {onboardingCopy.result.headlinePrefix}
                </p>
                <h2 className="text-xl sm:text-2xl">{recommendation.headline}</h2>
                <p className="text-sm text-muted-foreground">{recommendation.shortReason}</p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {onboardingCopy.result.firstStepLabel}
              </p>
              <p className="font-semibold leading-snug break-words">{recommendation.firstStepTitle}</p>
              <p className="text-xs text-muted-foreground">
                Niveau {recommendation.recommendedDefaultLevel} · {recommendation.recommendedDefaultTopic}
              </p>
            </div>
            <div className="grid gap-2">
              <Button
                size="lg"
                className="w-full"
                disabled={busy}
                onClick={startWithRecommendation}
              >
                {busy ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{onboardingCopy.result.busyLabel}</>
                ) : (
                  <>{onboardingCopy.result.primaryCta} <ArrowRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                disabled={busy}
                onClick={changeStartingPoint}
              >
                {onboardingCopy.result.secondaryCta}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {onboardingCopy.result.closingHint}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
