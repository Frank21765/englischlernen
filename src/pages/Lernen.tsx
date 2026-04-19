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
import { GraduationCap, Library, Loader2, MessageCircle, PenLine, Pencil, Sparkles } from "lucide-react";

export default function Lernen() {
  const { user } = useAuth();
  const { level, topic, hasSelection, setSelection } = useLearning();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [vocabCount, setVocabCount] = useState<number | null>(null);
  const isCustomTopic = hasSelection && !(QUICK_TOPICS as readonly string[]).includes(topic);
  const [customMode, setCustomMode] = useState<boolean>(isCustomTopic);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { count } = await supabase
        .from("vocabulary")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      setVocabCount(count ?? 0);
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
        .from("vocabulary")
        .select("german")
        .eq("user_id", user.id)
        .eq("level", level)
        .eq("topic", topic);
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
      const msg = e instanceof Error ? e.message : "Fehler beim Erzeugen";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl break-words">Let's go! Was lernen wir heute?</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {hasSelection
            ? "Wähle ein Niveau und ein Thema – die KI generiert 20 frische Vokabeln und Sätze für dich."
            : "Wähle zuerst ein CEFR-Niveau und ein Thema, um loszulegen."}
        </p>
        {vocabCount !== null && hasSelection && (
          <p className="text-sm text-muted-foreground">
            Du hast bereits <span className="font-semibold text-foreground">{vocabCount}</span> Vokabeln in deiner Sammlung.
          </p>
        )}
      </header>

      <Card className="p-4 sm:p-5 md:p-6 space-y-6 bg-gradient-card shadow-card">
        <div>
          <Label className="mb-3 block text-base font-semibold">Niveau</Label>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setSelection(l as Level, topic)}
                className={`min-w-[3.25rem] rounded-2xl px-4 py-2 text-sm font-bold transition-bounce ${
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

        <div className="space-y-3">
          <Label htmlFor="topic" className="text-base font-semibold">Thema</Label>
          <div className="flex flex-wrap gap-2">
            {QUICK_TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setCustomMode(false); setSelection(level, t); }}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-smooth ${
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
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-smooth inline-flex items-center gap-1.5 ${
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
              placeholder="z. B. Weltraum, Autos, Büro-Englisch, Musik…"
              className="h-12 rounded-2xl text-base"
              autoFocus
            />
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 pt-2">
          <Button variant="hero" size="xl" disabled={busy} onClick={generateAndStartQuiz} className="w-full whitespace-normal text-center leading-tight px-3">
            {busy ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" /> : <Sparkles className="h-5 w-5 shrink-0" />}
            <span className="min-w-0">Neue Vokabeln lernen</span>
          </Button>
          <Button variant="hero" size="xl" onClick={() => navigate("/grammatik")} className="w-full whitespace-normal text-center leading-tight px-3">
            <Library className="h-5 w-5 shrink-0" />
            <span className="min-w-0">Grammatik-Lektion</span>
          </Button>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <Button variant="soft" size="lg" onClick={() => navigate("/quiz")} className="w-full whitespace-normal text-center leading-tight px-3">
            <GraduationCap className="h-4 w-4 shrink-0" /> <span className="min-w-0">Quiz starten</span>
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
