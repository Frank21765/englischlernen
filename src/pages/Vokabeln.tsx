import { useEffect, useMemo, useState, KeyboardEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LEVELS } from "@/lib/learning";
import { ArrowRightLeft, Loader2, Plus, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useLearning } from "@/hooks/useLearningContext";

interface Vocab {
  id: string;
  german: string;
  english: string;
  grammar_note: string | null;
  level: string;
  topic: string;
  status: string;
}

interface LookupResult {
  source_lang: "de" | "en";
  german: string;
  english: string;
  part_of_speech: string;
  examples_de: string[];
  examples_en: string[];
  // legacy fields (older edge function)
  example_de?: string;
  example_en?: string;
  note?: string;
}

const statusLabels: Record<string, string> = { new: "Neu", learning: "Lernend", mastered: "Gemeistert" };
const statusClasses: Record<string, string> = {
  new: "bg-muted text-muted-foreground",
  learning: "bg-accent text-accent-foreground",
  mastered: "bg-success text-success-foreground",
};

export default function Vokabeln() {
  const { user } = useAuth();
  const { level: activeLevel, topic: activeTopic } = useLearning();
  const [items, setItems] = useState<Vocab[]>([]);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("alle");
  const [topicFilter, setTopicFilter] = useState<string>("alle");

  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupQuery, setLookupQuery] = useState<string>("");
  const [savingLookup, setSavingLookup] = useState(false);

  const loadItems = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("vocabulary")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data ?? []) as Vocab[]);
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const topics = useMemo(() => Array.from(new Set(items.map((i) => i.topic))).sort(), [items]);

  const filtered = items.filter((v) => {
    if (levelFilter !== "alle" && v.level !== levelFilter) return false;
    if (topicFilter !== "alle" && v.topic !== topicFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!v.german.toLowerCase().includes(q) && !v.english.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const runLookup = async () => {
    const word = search.trim();
    if (!word) return;
    setLookingUp(true);
    setLookup(null);
    setLookupQuery(word);
    try {
      const { data, error } = await supabase.functions.invoke("translate-word", { body: { word, level: activeLevel } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.result) throw new Error("Keine Übersetzung erhalten");
      setLookup(data.result as LookupResult);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Übersetzung fehlgeschlagen");
    } finally {
      setLookingUp(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runLookup();
    }
  };

  const saveLookupToCollection = async () => {
    if (!user || !lookup) return;
    setSavingLookup(true);
    try {
      const row = {
        user_id: user.id,
        level: activeLevel,
        topic: activeTopic || "Wörterbuch",
        german: lookup.german.trim(),
        english: lookup.english.trim(),
        grammar_note: [lookup.part_of_speech, lookup.note].filter(Boolean).join(" · ") || null,
      };
      const { error } = await supabase
        .from("vocabulary")
        .upsert(row, { onConflict: "user_id,german,english", ignoreDuplicates: false });
      if (error) throw error;
      toast.success(`Gespeichert unter ${activeLevel} · ${row.topic}`);
      await loadItems();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    } finally {
      setSavingLookup(false);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl">Deine Vokabeln</h1>
        <p className="text-muted-foreground">
          Suche in deiner Sammlung – oder lass jedes andere Wort übersetzen.
        </p>
      </header>

      <Card className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Wort suchen oder übersetzen (DE ↔ EN)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onKeyDown}
              className="pl-9 h-11 rounded-xl"
            />
          </div>
          <Button
            type="button"
            onClick={runLookup}
            disabled={lookingUp || !search.trim()}
            className="h-11 rounded-xl shrink-0"
            variant="hero"
          >
            {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
            <span className="hidden sm:inline">Übersetzen</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Tipp: Enter drückt „Übersetzen". Die Liste filtert sich automatisch.
        </p>

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[160px]">
            <Label className="text-xs mb-1 block">Niveau</Label>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setLevelFilter("alle")} className={chip(levelFilter === "alle")}>Alle</button>
              {LEVELS.map((l) => (
                <button key={l} onClick={() => setLevelFilter(l)} className={chip(levelFilter === l)}>{l}</button>
              ))}
            </div>
          </div>
        </div>
        {topics.length > 0 && (
          <div>
            <Label className="text-xs mb-1 block">Thema</Label>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setTopicFilter("alle")} className={chip(topicFilter === "alle")}>Alle</button>
              {topics.map((t) => (
                <button key={t} onClick={() => setTopicFilter(t)} className={chip(topicFilter === t)}>{t}</button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {lookup && (
        <Card className="p-5 space-y-3 bg-gradient-card shadow-card animate-pop">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="text-xs uppercase tracking-widest text-primary font-bold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Übersetzung für „{lookupQuery}"
              </div>
              <div className="flex items-baseline flex-wrap gap-3">
                <div className="font-display text-2xl">{lookup.german}</div>
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                <div className="font-display text-2xl text-primary">{lookup.english}</div>
              </div>
              {lookup.part_of_speech && (
                <Badge variant="outline" className="text-[10px] uppercase">{lookup.part_of_speech}</Badge>
              )}
              {lookup.note && <div className="text-xs text-muted-foreground italic">{lookup.note}</div>}
            </div>
            <Button
              size="sm"
              variant="soft"
              onClick={saveLookupToCollection}
              disabled={savingLookup}
              className="shrink-0"
            >
              {savingLookup ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="hidden sm:inline">In Sammlung</span>
            </Button>
          </div>
          {(() => {
            const examplesDe = lookup.examples_de?.length ? lookup.examples_de : (lookup.example_de ? [lookup.example_de] : []);
            const examplesEn = lookup.examples_en?.length ? lookup.examples_en : (lookup.example_en ? [lookup.example_en] : []);
            return (
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-muted/60 p-3 space-y-1.5">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Beispiele (DE)</div>
                  {examplesDe.slice(0, 3).map((ex, i) => (
                    <div key={i} className="leading-snug">• {ex}</div>
                  ))}
                </div>
                <div className="rounded-xl bg-muted/60 p-3 space-y-1.5">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Beispiele (EN)</div>
                  {examplesEn.slice(0, 3).map((ex, i) => (
                    <div key={i} className="leading-snug">• {ex}</div>
                  ))}
                </div>
              </div>
            );
          })()}
        </Card>
      )}

      <div className="text-sm text-muted-foreground">{filtered.length} Vokabeln in deiner Sammlung</div>

      <div className="space-y-2">
        {filtered.map((v) => (
          <Card key={v.id} className="p-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3 flex-wrap">
                <div className="font-semibold">{v.german}</div>
                <div className="text-muted-foreground">↔</div>
                <div className="text-primary font-semibold">{v.english}</div>
              </div>
              {v.grammar_note && <div className="text-xs text-muted-foreground italic mt-1">{v.grammar_note}</div>}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge variant="outline" className="font-mono text-[10px]">{v.level}</Badge>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusClasses[v.status] ?? statusClasses.new}`}>
                {statusLabels[v.status] ?? "Neu"}
              </span>
              <span className="text-[10px] text-muted-foreground">{v.topic}</span>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && !lookup && (
          <Card className="p-8 text-center text-muted-foreground space-y-2">
            <p>Noch keine Vokabeln in der Sammlung gefunden.</p>
            <p className="text-xs">
              Tipp: Tippe ein Wort ein und drücke <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground">Enter</kbd> oder „Übersetzen", um eine Übersetzung zu erhalten.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function chip(active: boolean) {
  return `rounded-full px-3 py-1 text-xs font-semibold transition-smooth ${
    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
  }`;
}
