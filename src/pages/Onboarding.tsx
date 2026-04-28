import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLearning } from "@/hooks/useLearningContext";
import { supabase } from "@/integrations/supabase/client";
import { ensureProfileForUser } from "@/lib/profile";
import { useUserAccess } from "@/hooks/useUserAccess";
import AccessGate from "@/components/AccessGate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { LEVELS, QUICK_TOPICS, Level } from "@/lib/learning";
import {
  saveOnboardingProfile,
  saveDiagnosticResult,
  type LearningGoal,
  type SelfAssessment,
} from "@/lib/onboarding";
import { logLearningEvent } from "@/lib/events";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  GraduationCap,
  Heart,
  Loader2,
  Sparkles,
  Target,
  Timer,
  Wand2,
} from "lucide-react";
import appIcon from "@/assets/app-icon.png";

// Phase 1 Onboarding-Reihenfolge laut Leitplanke 1:
// Ziel → Selbsteinschätzung → kurze Diagnose → Empfehlung → Interessen → Minutenziel → Thema → Start.
type Stage =
  | "welcome"
  | "goal"
  | "self"
  | "check"
  | "result"
  | "interests"
  | "minutes"
  | "topic"
  | "start";

interface Question {
  prompt: string;
  helper?: string;
  options: { label: string; level: Level }[];
}

// 6 lightweight, friendly questions. Each option maps to a CEFR level.
const QUESTIONS: Question[] = [
  {
    prompt: "How would you describe your English right now?",
    options: [
      { label: "Just starting / a few words", level: "A1" },
      { label: "I know basic phrases", level: "A2" },
      { label: "I can have simple conversations", level: "B1" },
      { label: "I'm fairly fluent", level: "B2" },
    ],
  },
  {
    prompt: 'Translate: "Ich gehe heute ins Kino."',
    options: [
      { label: "I go cinema today", level: "A1" },
      { label: "I go to the cinema today", level: "A2" },
      { label: "I'm going to the cinema today", level: "B1" },
      { label: "I'm heading to the cinema tonight", level: "B2" },
    ],
  },
  {
    prompt: 'Choose the correct sentence:',
    options: [
      { label: "She have a dog.", level: "A1" },
      { label: "She has a dog.", level: "A2" },
      { label: "She has had a dog for years.", level: "B1" },
      { label: "She's had her dog ever since she moved out.", level: "B2" },
    ],
  },
  {
    prompt: 'What does "I used to live in Berlin" mean?',
    options: [
      { label: "I don't understand", level: "A1" },
      { label: "I live in Berlin now", level: "A2" },
      { label: "I lived there before, not anymore", level: "B1" },
      { label: "Berlin shaped who I am today", level: "B2" },
    ],
  },
  {
    prompt: "Pick the correct past form: \"Yesterday I ___ to a friend.\"",
    options: [
      { label: "speak", level: "A1" },
      { label: "speaked", level: "A2" },
      { label: "spoke", level: "B1" },
      { label: "had spoken", level: "B2" },
    ],
  },
  {
    prompt: 'Which sounds most natural?',
    options: [
      { label: "I am here since two days.", level: "A1" },
      { label: "I am here from two days.", level: "A2" },
      { label: "I have been here for two days.", level: "B1" },
      { label: "I've been here a couple of days now.", level: "B2" },
    ],
  },
];

const LEVEL_WEIGHT: Record<Level, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

function computeLevel(answers: Level[]): Level {
  if (!answers.length) return "A1";
  const avg = answers.reduce((sum, l) => sum + LEVEL_WEIGHT[l], 0) / answers.length;
  // Round to nearest, clamp A1..B2 (placement focus)
  const rounded = Math.max(1, Math.min(4, Math.round(avg)));
  return (Object.entries(LEVEL_WEIGHT).find(([, v]) => v === rounded)?.[0] as Level) ?? "A1";
}

const GOALS: { key: LearningGoal; label: string; helper: string }[] = [
  { key: "alltag", label: "Alltag & Smalltalk", helper: "Locker reden, verstehen, einkaufen." },
  { key: "reisen", label: "Reisen", helper: "Hotel, Restaurant, unterwegs." },
  { key: "arbeit", label: "Beruf", helper: "Meetings, E-Mails, Fachbegriffe." },
  { key: "pruefung", label: "Prüfung", helper: "Schule, Studium, Zertifikat." },
  { key: "frei", label: "Einfach lernen", helper: "Aus Spaß und Neugier." },
];

const SELF_ASSESS: { key: SelfAssessment; label: string; helper: string }[] = [
  { key: "anfaenger", label: "Anfänger:in", helper: "Kaum bis keine Vorkenntnisse." },
  { key: "etwas_erfahrung", label: "Etwas Erfahrung", helper: "Schule lange her, Reste vorhanden." },
  { key: "unsicher", label: "Unsicher", helper: "Ich kann viel verstehen, traue mich aber selten zu sprechen." },
  { key: "fortgeschritten", label: "Fortgeschritten", helper: "Ich komme im Alltag gut klar, will den Feinschliff." },
];

const INTEREST_TAGS = [
  "Reisen",
  "Essen & Trinken",
  "Sport",
  "Technik",
  "Musik",
  "Filme & Serien",
  "Natur",
  "Familie",
  "Beruf",
  "Smalltalk",
] as const;

const MINUTE_GOALS = [10, 20, 30, 45] as const;

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { setSelection } = useLearning();
  const access = useUserAccess();

  const [stage, setStage] = useState<Stage>("welcome");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Level[]>([]);
  const [estimated, setEstimated] = useState<Level>("A1");
  const [chosenLevel, setChosenLevel] = useState<Level>("A1");
  const [chosenTopic, setChosenTopic] = useState<string>("Alltag");
  const [customTopic, setCustomTopic] = useState("");
  const [goal, setGoal] = useState<LearningGoal | null>(null);
  const [selfAssessment, setSelfAssessment] = useState<SelfAssessment | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [weeklyMinutes, setWeeklyMinutes] = useState<number>(20);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  // Guard: if not logged in or already onboarded, redirect away.
  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth", { replace: true }); return; }
    (async () => {
      try {
        await ensureProfileForUser(user);
      } catch (error) {
        console.error("Onboarding profile sync failed", error);
      }
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.onboarding_completed) {
        navigate("/start", { replace: true });
        return;
      }
      setChecking(false);
    })();
  }, [user, loading, navigate]);

  const progress = useMemo(() => {
    const total = QUESTIONS.length;
    if (stage === "welcome") return 4;
    if (stage === "goal") return 12;
    if (stage === "self") return 22;
    if (stage === "check") return 30 + (qIndex / total) * 35;
    if (stage === "result") return 70;
    if (stage === "interests") return 78;
    if (stage === "minutes") return 86;
    if (stage === "topic") return 92;
    return 96;
  }, [stage, qIndex]);

  const finalTopic = chosenTopic === "__custom" ? customTopic.trim() : chosenTopic;

  const toggleInterest = (tag: string) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const completeAndStart = async (action: "quiz" | "lernen") => {
    if (!user) return;
    if (!finalTopic) { toast.error("Bitte ein Thema wählen"); return; }
    setBusy(true);
    try {
      // 1) Onboarding-Profil sauber ablegen (alle Phase-1-Felder).
      const profileRes = await saveOnboardingProfile(user.id, {
        learning_goal: goal ?? "frei",
        self_assessment: selfAssessment ?? "anfaenger",
        interests,
        recommended_level: estimated,
        weekly_minutes_goal: weeklyMinutes,
      });
      if (!profileRes.ok) {
        // Sichtbar machen, statt still weiterzulaufen.
        toast.error(`Profil konnte nicht gespeichert werden: ${profileRes.error ?? "Unbekannter Fehler"}`);
        throw new Error(profileRes.error ?? "Profil-Update fehlgeschlagen");
      }

      // 2) Default-Level + Thema fürs Lernen setzen.
      const { error: upErr } = await supabase
        .from("profiles")
        .update({
          default_level: chosenLevel,
          default_topic: finalTopic,
        })
        .eq("user_id", user.id);
      if (upErr) {
        toast.error(`Lernkontext konnte nicht gespeichert werden: ${upErr.message}`);
        throw upErr;
      }

      // 3) Diagnose-Ergebnis ablegen, wenn echte Antworten vorhanden sind.
      if (answers.length > 0) {
        const score = answers.reduce((sum, l) => sum + LEVEL_WEIGHT[l], 0);
        const diag = await saveDiagnosticResult(user.id, {
          area: "vocab",
          score,
          cefrEstimate: estimated,
          details: {
            answered: answers.length,
            total: QUESTIONS.length,
            answers,
          },
        });
        if (!diag.ok) {
          // Diagnose darf den Flow nicht blockieren, aber wir loggen sichtbar.
          console.error("[onboarding] diagnostic save failed", diag.error);
          toast.message("Diagnose konnte nicht gespeichert werden, wir machen trotzdem weiter.");
        }
        await logLearningEvent({
          eventType: "diagnostic_taken",
          level: estimated,
          metadata: { score, answered: answers.length, total: QUESTIONS.length },
        });
      }

      setSelection(chosenLevel, finalTopic, { persist: false });

      if (action === "quiz") {
        // Erstes Vokabelset generieren und als Onboarding-Pool markieren.
        const { data: existing } = await supabase
          .from("vocabulary").select("german")
          .eq("user_id", user.id).eq("level", chosenLevel).eq("topic", finalTopic);
        const existingGerman = (existing ?? []).map((r) => r.german);
        const { data, error } = await supabase.functions.invoke("generate-vocabulary", {
          body: { level: chosenLevel, topic: finalTopic, existing: existingGerman },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        const pairs: Array<{ german: string; english: string; grammar_note?: string }> = data.pairs ?? [];
        if (pairs.length) {
          const rows = pairs.map((p) => ({
            user_id: user.id,
            level: chosenLevel,
            topic: finalTopic,
            german: p.german.trim(),
            english: p.english.trim(),
            grammar_note: p.grammar_note ?? null,
            source: "onboarding",
          }));
          const { error: vErr } = await supabase
            .from("vocabulary")
            .upsert(rows, { onConflict: "user_id,german,english", ignoreDuplicates: true });
          if (vErr) {
            console.error("[onboarding] vocabulary upsert failed", vErr);
            toast.error(`Vokabeln konnten nicht gespeichert werden: ${vErr.message}`);
            throw vErr;
          }
          toast.success(`Dein erster Vokabelpool: ${pairs.length} Wörter, ${chosenLevel} · ${finalTopic}`);
        }
        // Auto-Start: Quiz direkt mit Pool öffnen, Picker überspringen.
        navigate(
          `/training/quiz?level=${encodeURIComponent(chosenLevel)}&topic=${encodeURIComponent(finalTopic)}&autostart=1`,
          { replace: true },
        );
      } else {
        toast.success("Alles bereit – willkommen!");
        navigate("/start", { replace: true });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Etwas ist schiefgelaufen");
    } finally {
      setBusy(false);
    }
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Wenn der Account noch nicht freigeschaltet (oder gesperrt/abgelaufen) ist,
  // zeigen wir vor dem Onboarding den Wartebereich – sonst läuft die Person
  // ins Leere, sobald sie das Onboarding abschließt.
  if (!access.loading && access.status !== "active") {
    return <AccessGate>{null}</AccessGate>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/40 to-background px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-xl space-y-5">
        <div className="flex items-center gap-3">
          <img src={appIcon} alt="Hello!" className="h-9 w-9" />
          <div className="flex-1">
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {stage === "welcome" && (
          <Card className="p-6 sm:p-8 space-y-5 bg-gradient-card shadow-card">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary/15 p-3"><Sparkles className="h-6 w-6 text-primary" /></div>
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl">Welcome zu Hello! 👋</h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Hello! hilft dir, Englisch entspannt im Alltag zu lernen –
                  mit eigenen Vokabelsets, kleinen Übungen und Coach Ellie an deiner Seite.
                </p>
              </div>
            </div>
            <ul className="space-y-2 text-sm sm:text-base">
              <li className="flex gap-2"><Compass className="h-5 w-5 text-accent shrink-0" /> Wir schauen kurz, was du willst und wo du stehst</li>
              <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-accent shrink-0" /> Du wählst Interessen, Thema und dein Wochenziel</li>
              <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-accent shrink-0" /> Du startest direkt mit deinem ersten Vokabelset</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Das ist nur ein Startpunkt – alles davon kannst du später ändern.
            </p>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/auth", { replace: true });
              }}
            >
              Mit anderem Konto anmelden
            </Button>
            <Button size="lg" className="w-full" onClick={() => setStage("goal")}>
              Los geht's <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Card>
        )}

        {stage === "goal" && (
          <Card className="p-6 sm:p-8 space-y-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary/15 p-3"><Target className="h-6 w-6 text-primary" /></div>
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl">Wofür willst du Englisch lernen?</h2>
                <p className="text-sm text-muted-foreground">
                  Damit wir dir die richtigen Inhalte zeigen.
                </p>
              </div>
            </div>
            <div className="grid gap-2">
              {GOALS.map((g) => (
                <Button
                  key={g.key}
                  variant={goal === g.key ? "default" : "outline"}
                  className="justify-start h-auto py-3 px-4 text-left whitespace-normal"
                  onClick={() => setGoal(g.key)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{g.label}</span>
                    <span className="text-xs opacity-80">{g.helper}</span>
                  </div>
                </Button>
              ))}
            </div>
            <Button
              size="lg"
              className="w-full"
              disabled={!goal}
              onClick={() => setStage("self")}
            >
              Weiter <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Card>
        )}

        {stage === "self" && (
          <Card className="p-6 sm:p-8 space-y-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-accent/15 p-3"><Heart className="h-6 w-6 text-accent" /></div>
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl">Wie schätzt du dich selbst ein?</h2>
                <p className="text-sm text-muted-foreground">
                  Kein Test. Wir nehmen das nur als Ausgangspunkt.
                </p>
              </div>
            </div>
            <div className="grid gap-2">
              {SELF_ASSESS.map((s) => (
                <Button
                  key={s.key}
                  variant={selfAssessment === s.key ? "default" : "outline"}
                  className="justify-start h-auto py-3 px-4 text-left whitespace-normal"
                  onClick={() => setSelfAssessment(s.key)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{s.label}</span>
                    <span className="text-xs opacity-80">{s.helper}</span>
                  </div>
                </Button>
              ))}
            </div>
            <Button
              size="lg"
              className="w-full"
              disabled={!selfAssessment}
              onClick={() => setStage("check")}
            >
              Weiter zur kurzen Einschätzung <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Card>
        )}

        {stage === "check" && (
          <Card className="p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wide">Frage {qIndex + 1} / {QUESTIONS.length}</span>
              <button
                type="button"
                className="hover:text-foreground transition-smooth underline-offset-2 hover:underline"
                onClick={() => { setEstimated("A1"); setChosenLevel("A1"); setStage("result"); }}
              >
                Überspringen
              </button>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold">{QUESTIONS[qIndex].prompt}</h2>
            <div className="grid gap-2">
              {QUESTIONS[qIndex].options.map((opt) => (
                <Button
                  key={opt.label}
                  variant="outline"
                  className="justify-start h-auto py-3 px-4 text-left whitespace-normal"
                  onClick={() => {
                    const next = [...answers, opt.level];
                    setAnswers(next);
                    if (qIndex + 1 < QUESTIONS.length) {
                      setQIndex(qIndex + 1);
                    } else {
                      const lvl = computeLevel(next);
                      setEstimated(lvl);
                      setChosenLevel(lvl);
                      setStage("result");
                    }
                  }}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Kein Stress – das ist nur eine kurze Orientierung, kein Test.
            </p>
          </Card>
        )}

        {stage === "result" && (
          <Card className="p-6 sm:p-8 space-y-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-accent/15 p-3"><GraduationCap className="h-6 w-6 text-accent" /></div>
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl">Dein Startniveau: <span className="font-mono text-primary">{estimated}</span></h2>
                <p className="text-sm text-muted-foreground">
                  Das ist nur ein Startpunkt. Du kannst dein Niveau jederzeit ändern.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Niveau anpassen (A1–B2)</Label>
              <div className="flex flex-wrap gap-2">
                {LEVELS.filter((l) => ["A1","A2","B1","B2"].includes(l)).map((l) => (
                  <Button
                    key={l}
                    type="button"
                    size="sm"
                    variant={chosenLevel === l ? "default" : "outline"}
                    onClick={() => setChosenLevel(l)}
                    className="font-mono"
                  >
                    {l}
                  </Button>
                ))}
              </div>
            </div>
            <Button size="lg" className="w-full" onClick={() => setStage("interests")}>
              Weiter zu Interessen <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Card>
        )}

        {stage === "interests" && (
          <Card className="p-6 sm:p-8 space-y-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary/15 p-3"><Heart className="h-6 w-6 text-primary" /></div>
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl">Was interessiert dich?</h2>
                <p className="text-sm text-muted-foreground">
                  Mehrfachauswahl. Wir nutzen das später für passende Inhalte.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {INTEREST_TAGS.map((t) => (
                <Button
                  key={t}
                  type="button"
                  size="sm"
                  variant={interests.includes(t) ? "default" : "outline"}
                  onClick={() => toggleInterest(t)}
                >
                  {t}
                </Button>
              ))}
            </div>
            <Button size="lg" className="w-full" onClick={() => setStage("minutes")}>
              Weiter <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Card>
        )}

        {stage === "minutes" && (
          <Card className="p-6 sm:p-8 space-y-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-accent/15 p-3"><Timer className="h-6 w-6 text-accent" /></div>
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl">Wie viel Zeit hast du pro Woche?</h2>
                <p className="text-sm text-muted-foreground">
                  Dein Wochenziel — nichts in Stein gemeißelt.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {MINUTE_GOALS.map((m) => (
                <Button
                  key={m}
                  type="button"
                  size="sm"
                  variant={weeklyMinutes === m ? "default" : "outline"}
                  onClick={() => setWeeklyMinutes(m)}
                >
                  {m} Min
                </Button>
              ))}
            </div>
            <Button size="lg" className="w-full" onClick={() => setStage("topic")}>
              Weiter zum Thema <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Card>
        )}

        {stage === "topic" && (
          <Card className="p-6 sm:p-8 space-y-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-primary/15 p-3"><Target className="h-6 w-6 text-primary" /></div>
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl">Womit möchtest du starten?</h2>
                <p className="text-sm text-muted-foreground">Wähle ein Thema oder gib ein eigenes ein.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_TOPICS.map((t) => (
                <Button
                  key={t}
                  type="button"
                  size="sm"
                  variant={chosenTopic === t ? "default" : "outline"}
                  onClick={() => { setChosenTopic(t); setCustomTopic(""); }}
                >
                  {t}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant={chosenTopic === "__custom" ? "default" : "outline"}
                onClick={() => setChosenTopic("__custom")}
              >
                Eigenes Thema
              </Button>
            </div>
            {chosenTopic === "__custom" && (
              <div className="space-y-1.5">
                <Label htmlFor="custom-topic">Dein Thema</Label>
                <Input
                  id="custom-topic"
                  placeholder="z. B. Bewerbung, Smalltalk, Reise nach London"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  maxLength={60}
                />
              </div>
            )}
            <Button
              size="lg"
              className="w-full"
              disabled={!finalTopic}
              onClick={() => setStage("start")}
            >
              Weiter <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Card>
        )}

        {stage === "start" && (
          <Card className="p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl">Bereit? 🎉</h2>
              <p className="text-sm text-muted-foreground">
                Wir starten mit deinem ersten Vokabelset für{" "}
                <span className="font-mono text-primary">{chosenLevel}</span> · <span className="font-semibold">{finalTopic}</span>.
              </p>
            </div>
            <div className="grid gap-2">
              <Button
                size="lg"
                className="w-full"
                disabled={busy}
                onClick={() => completeAndStart("quiz")}
              >
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                Erstes Vokabelset erzeugen & starten
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                disabled={busy}
                onClick={() => completeAndStart("lernen")}
              >
                Später – zum Lern-Hub
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Niveau, Thema und Wochenziel kannst du jederzeit in den Einstellungen ändern.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
