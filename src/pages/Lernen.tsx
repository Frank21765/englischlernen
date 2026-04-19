import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLearning } from "@/hooks/useLearningContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LEVELS, QUICK_TOPICS, Level } from "@/lib/learning";
import { toast } from "sonner";
import { CalendarClock, ChevronDown, GraduationCap, Library, Loader2, MessageCircle, PenLine, Pencil, RefreshCw, Sparkles, Target } from "lucide-react";

export default function Lernen() {
  const { user } = useAuth();
  const { level, topic, hasSelection, setSelection } = useLearning();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [vocabCount, setVocabCount] = useState<number | null>(null);
  const [dueCount, setDueCount] = useState<number | null>(null);
  const [username, setUsername] = useState<string>("");
  const isCustomTopic = hasSelection && !(QUICK_TOPICS as readonly string[]).includes(topic);
  const [customMode, setCustomMode] = useState<boolean>(isCustomTopic);
  const [editFocus, setEditFocus] = useState<boolean>(!hasSelection);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [{ count: total }, { count: dueOld }, { count: dueNew }] = await Promise.all([
        supabase.from("vocabulary").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("vocabulary").select("id", { count: "exact", head: true })
          .eq("user_id", user.id).neq("status", "mastered").lt("last_seen_at", since),
        supabase.from("vocabulary").select("id", { count: "exact", head: true })
          .eq("user_id", user.id).neq("status", "mastered").is("last_seen_at", null),
      ]);
      setVocabCount(total ?? 0);
      setDueCount((dueOld ?? 0) + (dueNew ?? 0));
    })();
  }, [user]);

  const generateAndStartQuiz = async () => {
    if (!user) return;
    if (!topic.trim()) {
      toast.error("Bitte ein Thema angeben");
      return;
    }
    setBusy(true);
    try {
      const { data: existing } = await supabase
        .from("vocabulary").select("german")
        .eq("user_id", user.id).eq("level", level).eq("topic", topic);
      const existingGerman = (existing ?? []).map((r) => r.german);

      const { data, error } = await supabase.functions.invoke("generate-vocabulary", {
        body: { level, topic, existing: existingGerman },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const pairs: Array<{ german: string; english: string; grammar_note?: string }> = data.pairs ?? [];
      if (!pairs.length) throw new Error("Keine Vokabeln erhalten");

      const rows = pairs.map((p) => ({
        user_id: user.id,
        level,
        topic,
        german: p.german.trim(),
        english: p.english.trim(),
        grammar_note: p.grammar_note ?? null,
      }));
      const { error: insErr } = await supabase
        .from("vocabulary")
        .upsert(rows, { onConflict: "user_id,german,english", ignoreDuplicates: true });
      if (insErr) throw insErr;

      setSelection(level, topic, { persist: true });
      toast.success(`${pairs.length} neue Vokabeln erzeugt`);
      navigate("/quiz");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler beim Erzeugen");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl md:text-4xl break-words">Let's go! Was lernen wir heute?</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Dein Lern-Hub – aktueller Fokus, fällige Wiederholungen und der nächste Schritt.
        </p>
      </header>

      {/* 1. Aktueller Fokus */}
      <Card className="p-4 sm:p-5 bg-gradient-card shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="rounded-2xl bg-accent/15 p-2.5 sm:p-3 shrink-0">
              <Target className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Aktueller Fokus</div>
              {hasSelection ? (
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mt-0.5">
                  <span className="font-mono text-lg sm:text-xl font-bold text-primary">{level}</span>
                  <span className="text-muted-foreground/60">·</span>
                  <span className="text-base sm:text-lg font-semibold break-words">{topic || "—"}</span>
                </div>
              ) : (
                <p className="text-sm mt-1">Noch nichts gewählt – leg unten dein Niveau und Thema fest.</p>
              )}
              {hasSelection && vocabCount !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  {vocabCount} Vokabel{vocabCount === 1 ? "" : "n"} insgesamt gespeichert
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditFocus((v) => !v)}
            className="shrink-0"
            aria-expanded={editFocus}
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">{editFocus ? "Schließen" : "Ändern"}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${editFocus ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {editFocus && (
          <div className="mt-4 pt-4 border-t border-border space-y-4">
            <div>
              <Label className="mb-2 block text-sm font-semibold">Niveau</Label>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setSelection(l as Level, topic, { persist: true })}
                    className={`min-w-[3rem] rounded-2xl px-3.5 py-1.5 text-sm font-bold transition-bounce ${
                      level === l
                        ? "bg-primary text-primary-foreground shadow-glow scale-105"
                        : "bg-muted text-foreground hover:bg-muted/70"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-sm font-semibold">Thema</Label>
              <div className="flex flex-wrap gap-2">
                {QUICK_TOPICS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setCustomMode(false); setSelection(level, t, { persist: true }); }}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-smooth ${
                      !customMode && topic === t
                        ? "bg-accent text-accent-foreground shadow-soft"
                        : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setCustomMode(true); if (!isCustomTopic) setSelection(level, ""); }}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-smooth inline-flex items-center gap-1.5 ${
                    customMode
                      ? "bg-accent text-accent-foreground shadow-soft"
                      : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <Pencil className="h-3.5 w-3.5" /> Eigenes Thema
                </button>
              </div>
              {customMode && (
                <Input
                  id="topic"
                  value={topic}
                  maxLength={60}
                  onChange={(e) => setSelection(level, e.target.value)}
                  onBlur={() => topic.trim() && setSelection(level, topic.trim(), { persist: true })}
                  placeholder="z. B. Weltraum, Autos, Büro-Englisch, Musik…"
                  className="h-11 rounded-2xl text-base"
                  autoFocus
                />
              )}
            </div>
          </div>
        )}
      </Card>

      {/* 2. Heute fällig */}
      <Card className="p-4 sm:p-5 bg-gradient-card shadow-card">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="rounded-2xl bg-primary/10 p-2.5 sm:p-3 shrink-0">
            <CalendarClock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h2 className="text-base sm:text-lg font-bold">Heute fällig</h2>
              {dueCount !== null && dueCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  {dueCount} {dueCount === 1 ? "Vokabel" : "Vokabeln"} bereit
                </span>
              )}
            </div>
            {dueCount === null ? (
              <p className="text-sm text-muted-foreground">Lade Wiederholungen…</p>
            ) : dueCount > 0 ? (
              <p className="text-sm text-muted-foreground">
                Kurze Wiederholung jetzt – so bleibt dein Wortschatz lebendig. 💪
              </p>
            ) : vocabCount && vocabCount > 0 ? (
              <p className="text-sm text-muted-foreground">
                Alles wiederholt für heute! 🎉 Lust auf neue Vokabeln?
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Noch keine Vokabeln gespeichert. Starte unten dein erstes Set!
              </p>
            )}
            {dueCount !== null && dueCount > 0 && (
              <div className="pt-2">
                <Button variant="hero" size="sm" onClick={() => navigate("/quiz")} className="whitespace-normal text-center leading-tight">
                  <RefreshCw className="h-4 w-4 shrink-0" />
                  <span>Jetzt wiederholen</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 3. Weiterlernen */}
      <Card className="p-4 sm:p-5 md:p-6 space-y-4 bg-gradient-card shadow-card">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h2 className="text-base sm:text-lg font-bold">Weiterlernen</h2>
          <span className="text-xs text-muted-foreground">Wähle deinen nächsten Schritt</span>
        </div>

        <Button
          variant="hero"
          size="xl"
          disabled={busy || !hasSelection}
          onClick={generateAndStartQuiz}
          className="w-full whitespace-normal text-center leading-tight px-3"
        >
          {busy ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> : <Sparkles className="h-5 w-5 shrink-0" />}
          <span className="min-w-0">Neue Vokabeln lernen</span>
        </Button>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <Button variant="soft" size="lg" onClick={() => navigate("/grammatik")} className="w-full whitespace-normal text-center leading-tight px-3">
            <Library className="h-4 w-4 shrink-0" /> <span className="min-w-0">Grammatik</span>
          </Button>
          <Button variant="soft" size="lg" onClick={() => navigate("/quiz")} className="w-full whitespace-normal text-center leading-tight px-3">
            <GraduationCap className="h-4 w-4 shrink-0" /> <span className="min-w-0">Quiz</span>
          </Button>
          <Button variant="soft" size="lg" onClick={() => navigate("/lueckentext")} className="w-full whitespace-normal text-center leading-tight px-3">
            <PenLine className="h-4 w-4 shrink-0" /> <span className="min-w-0">Lückentext</span>
          </Button>
          <Button variant="soft" size="lg" onClick={() => navigate("/chat")} className="w-full whitespace-normal text-center leading-tight px-3">
            <MessageCircle className="h-4 w-4 shrink-0" /> <span className="min-w-0">Coach Ellie</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
