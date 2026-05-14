import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, Check, Loader2, RefreshCw, Sparkles } from "lucide-react";

interface FalseFriend {
  id: string;
  german_trigger_word_or_phrase: string | null;
  german_meaning: string | null;
  wrong_english: string;
  correct_english_primary: string;
  correct_english_alternatives: string[] | null;
  example_de: string | null;
  example_wrong_en: string | null;
  example_correct_en: string | null;
  explanation_de: string;
  memory_hook_de: string | null;
  feedback_if_wrong_de: string | null;
  cefr_level: string;
  category: string | null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Hebt das Zielwort visuell im Beispielsatz hervor (case-insensitive).
function highlight(sentence: string | null, word: string | null): React.ReactNode {
  if (!sentence) return null;
  if (!word) return sentence;
  const idx = sentence.toLowerCase().indexOf(word.toLowerCase());
  if (idx < 0) return sentence;
  const before = sentence.slice(0, idx);
  const match = sentence.slice(idx, idx + word.length);
  const after = sentence.slice(idx + word.length);
  return (
    <>
      {before}
      <span className="font-bold underline decoration-2 underline-offset-2">{match}</span>
      {after}
    </>
  );
}

export default function FalseFriends() {
  const [items, setItems] = useState<FalseFriend[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [knewIt, setKnewIt] = useState(0);
  const [practiceAgain, setPracticeAgain] = useState(0);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("false_friends_master")
      .select(
        "id, german_trigger_word_or_phrase, german_meaning, wrong_english, correct_english_primary, correct_english_alternatives, example_de, example_wrong_en, example_correct_en, explanation_de, memory_hook_de, feedback_if_wrong_de, cefr_level, category"
      )
      .limit(100);
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setItems(shuffle((data ?? []) as unknown as FalseFriend[]));
    setIdx(0);
    setKnewIt(0);
    setPracticeAgain(0);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center space-y-3">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => void load()} variant="outline">Nochmal versuchen</Button>
      </Card>
    );
  }

  if (!items.length) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        Keine False Friends gefunden.
      </Card>
    );
  }

  const current = items[idx];
  const isLast = idx + 1 >= items.length;
  const trigger = current.german_trigger_word_or_phrase || current.german_meaning || "—";

  const next = () => {
    if (isLast) {
      void load(); // Neue Runde, neu mischen
      return;
    }
    setIdx(idx + 1);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          False Friends
        </h1>
        <p className="text-sm text-muted-foreground">
          Typische Stolperfallen: Wörter, die anders sind, als sie aussehen.
        </p>
        <div className="text-xs text-muted-foreground">
          {idx + 1} / {items.length} · {current.cefr_level}
          {current.category ? ` · ${current.category}` : ""}
        </div>
      </header>

      <Card className="p-5 sm:p-6 space-y-4 bg-gradient-card shadow-card">
        {/* Trigger */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Auf Deutsch sagst du
          </div>
          <div className="font-display text-2xl sm:text-3xl leading-tight">
            „{trigger}"
          </div>
          {current.german_meaning && current.german_meaning !== trigger && (
            <div className="text-sm text-muted-foreground mt-1">
              Bedeutung: {current.german_meaning}
            </div>
          )}
        </div>

        {/* Falsch / Richtig */}
        <div className="grid gap-2">
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3">
            <div className="text-xs font-bold text-destructive mb-1">❌ Nicht</div>
            <div className="text-base sm:text-lg font-semibold">
              „{current.wrong_english}"
            </div>
            {current.example_wrong_en && (
              <div className="text-sm text-muted-foreground mt-1 italic">
                {highlight(current.example_wrong_en, current.wrong_english)}
              </div>
            )}
          </div>
          <div className="rounded-xl border border-success/30 bg-success/10 p-3">
            <div className="text-xs font-bold text-success mb-1">✅ Sondern</div>
            <div className="text-base sm:text-lg font-semibold">
              „{current.correct_english_primary}"
              {current.correct_english_alternatives && current.correct_english_alternatives.length > 0 && (
                <span className="text-sm text-muted-foreground font-normal">
                  {" "}· auch: {current.correct_english_alternatives.join(", ")}
                </span>
              )}
            </div>
            {current.example_correct_en && (
              <div className="text-sm text-muted-foreground mt-1 italic">
                {highlight(current.example_correct_en, current.correct_english_primary)}
              </div>
            )}
            {current.example_de && (
              <div className="text-xs text-muted-foreground mt-1">
                🇩🇪 {current.example_de}
              </div>
            )}
          </div>
        </div>

        {/* Erklärung */}
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm leading-relaxed">
          <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
            Warum?
          </div>
          <p className="text-foreground/90">{current.explanation_de}</p>
          {current.memory_hook_de && (
            <p className="mt-2 text-foreground/90">
              <span className="font-bold">💡 Eselsbrücke: </span>
              {current.memory_hook_de}
            </p>
          )}
          {current.feedback_if_wrong_de && (
            <p className="mt-2 text-muted-foreground italic">
              {current.feedback_if_wrong_de}
            </p>
          )}
        </div>

        {/* Aktionen */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => { setPracticeAgain((n) => n + 1); next(); }}
            className="rounded-full"
          >
            <RefreshCw className="h-4 w-4" /> Nochmal üben
          </Button>
          <Button
            variant="outline"
            onClick={() => { setKnewIt((n) => n + 1); next(); }}
            className="rounded-full"
          >
            <Check className="h-4 w-4" /> Wusste ich
          </Button>
        </div>
        <Button
          variant="hero"
          size="lg"
          onClick={next}
          className="w-full rounded-full"
        >
          {isLast ? (
            <>
              <Sparkles className="h-4 w-4" /> Neue Runde mischen
            </>
          ) : (
            <>
              Nächster False Friend <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </Card>

      <div className="text-center text-xs text-muted-foreground">
        Wusste ich: <span className="font-semibold text-success">{knewIt}</span>
        {" · "}
        Nochmal üben: <span className="font-semibold text-foreground">{practiceAgain}</span>
      </div>
    </div>
  );
}
