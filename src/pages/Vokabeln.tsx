import { useEffect, useMemo, useState, KeyboardEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LEVELS, QUICK_TOPICS } from "@/lib/learning";
import {
  ArrowRightLeft,
  Check,
  ChevronDown,
  Info,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useLearning } from "@/hooks/useLearningContext";
import { FocusChip } from "@/components/FocusChip";
import { buildEllieUrl, ellieAskWordPrompt } from "@/lib/ellie";
import { Link } from "react-router-dom";

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
  example_de?: string;
  example_en?: string;
  note?: string;
}

interface Suggestion {
  german: string;
  english: string;
  grammar_note?: string;
}

const statusLabels: Record<string, string> = { new: "Neu", learning: "Lernend", mastered: "Gemeistert" };
const statusClasses: Record<string, string> = {
  new: "bg-muted text-muted-foreground",
  learning: "bg-accent text-accent-foreground",
  mastered: "bg-success text-success-foreground",
};

// Heuristic: count words to decide if input is "long" → hint toward Ellie.
const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const LONG_INPUT_WORDS = 12;

export default function Vokabeln() {
  const { user } = useAuth();
  const { level: activeLevel, topic: activeTopic, hasSelection, setSelection } = useLearning();
  const [items, setItems] = useState<Vocab[]>([]);

  // ---- Block 1: Frag mich! ----
  const [askInput, setAskInput] = useState("");
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupQuery, setLookupQuery] = useState<string>("");
  const [savingLookup, setSavingLookup] = useState(false);

  // ---- Block 2: Neue Vokabeln für dich ----
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [suggestKey, setSuggestKey] = useState<string>("");
  const [showTopicPicker, setShowTopicPicker] = useState(false);

  // ---- Block 3: Deine Sammlung ----
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [collectionTopic, setCollectionTopic] = useState<string>("alle");
  const [collectionStatus, setCollectionStatus] = useState<string>("alle");
  const [collectionSearch, setCollectionSearch] = useState("");

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

  const knownKeys = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => s.add(`${i.german.toLowerCase()}|${i.english.toLowerCase()}`));
    return s;
  }, [items]);

  // ---------- Suggestions ----------
  const loadSuggestions = async (force = false) => {
    if (!user || !hasSelection) return;
    const key = `${activeLevel}__${activeTopic}`;
    if (!force && key === suggestKey && suggestions.length > 0) return;
    setLoadingSuggestions(true);
    setSuggestKey(key);
    try {
      const existing = items
        .filter((i) => i.level === activeLevel && i.topic === activeTopic)
        .map((i) => i.german)
        .slice(0, 80);
      const { data, error } = await supabase.functions.invoke("generate-vocabulary", {
        body: { level: activeLevel, topic: activeTopic, existing },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const pairs: Suggestion[] = Array.isArray(data?.pairs) ? data.pairs : [];
      const filtered = pairs.filter(
        (p) => !knownKeys.has(`${p.german.toLowerCase()}|${p.english.toLowerCase()}`),
      );
      // Cap at 10 — focused, not overwhelming.
      setSuggestions(filtered.slice(0, 10));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Vorschläge konnten nicht geladen werden");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (!hasSelection || !user) return;
    const key = `${activeLevel}__${activeTopic}`;
    if (key !== suggestKey) loadSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLevel, activeTopic, hasSelection, user, items.length === 0]);

  // ---------- Lookup ("Frag mich!") ----------
  const runLookup = async () => {
    const text = askInput.trim();
    if (!text) return;
    setLookingUp(true);
    setLookup(null);
    setLookupQuery(text);
    try {
      const { data, error } = await supabase.functions.invoke("translate-word", {
        body: { word: text, level: activeLevel },
      });
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

  const onAskKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runLookup();
    }
  };

  const askIsLong = wordCount(askInput) >= LONG_INPUT_WORDS;

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

  const saveSuggestion = async (s: Suggestion) => {
    if (!user) return;
    const key = `${s.german}|${s.english}`;
    setSavingKey(key);
    try {
      const row = {
        user_id: user.id,
        level: activeLevel,
        topic: activeTopic,
        german: s.german.trim(),
        english: s.english.trim(),
        grammar_note: s.grammar_note?.trim() || null,
      };
      const { error } = await supabase
        .from("vocabulary")
        .upsert(row, { onConflict: "user_id,german,english", ignoreDuplicates: false });
      if (error) throw error;
      setSavedKeys((prev) => new Set(prev).add(key));
      toast.success("Zur Sammlung hinzugefügt");
      loadItems();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    } finally {
      setSavingKey(null);
    }
  };

  const pickTopic = (t: string) => {
    setSelection(activeLevel, t);
    setShowTopicPicker(false);
    setSavedKeys(new Set());
  };

  // ---------- Collection filtering ----------
  const filtered = items.filter((v) => {
    if (collectionTopic !== "alle" && v.topic !== collectionTopic) return false;
    if (collectionStatus !== "alle" && v.status !== collectionStatus) return false;
    if (collectionSearch.trim()) {
      const q = collectionSearch.toLowerCase();
      if (!v.german.toLowerCase().includes(q) && !v.english.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl">Vokabeln</h1>
        <FocusChip />
      </header>

      {/* ============ 1) Frag mich! ============ */}
      <section className="space-y-3">
        <div className="space-y-0.5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Frag mich!
          </h2>
          <p className="text-sm text-muted-foreground">Wort eingeben und direkt übersetzen</p>
        </div>

        <Card className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder='z.B. „aufgeben" oder „I would like to…"'
                value={askInput}
                onChange={(e) => setAskInput(e.target.value)}
                onKeyDown={onAskKeyDown}
                className="pl-9 h-11 rounded-xl"
              />
            </div>
            <Button
              type="button"
              onClick={runLookup}
              disabled={lookingUp || !askInput.trim()}
              className="h-11 rounded-xl shrink-0 px-5"
              variant="hero"
            >
              {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
              <span>Los!</span>
            </Button>
          </div>

          {askIsLong && !lookup && (
            <div className="flex items-start gap-2 rounded-lg bg-accent/40 px-3 py-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
              <div>
                Das ist schon ein längerer Text. Für komplexere Übersetzungen erklärt dir{" "}
                <Link to="/chat" className="font-semibold text-primary hover:underline">
                  Coach Ellie
                </Link>{" "}
                Bedeutung und Nuancen oft besser.
              </div>
            </div>
          )}

          {lookup && (
            <div className="rounded-xl border border-border p-4 space-y-3 bg-gradient-card animate-pop">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" /> Übersetzung für „{lookupQuery}"
                  </div>
                  <div className="flex items-baseline flex-wrap gap-3">
                    <div className="font-display text-xl">{lookup.german}</div>
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                    <div className="font-display text-xl text-primary">{lookup.english}</div>
                  </div>
                  {lookup.part_of_speech && (
                    <Badge variant="outline" className="text-[10px] uppercase">{lookup.part_of_speech}</Badge>
                  )}
                  {lookup.note && <div className="text-xs text-muted-foreground italic">{lookup.note}</div>}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button size="sm" variant="soft" onClick={saveLookupToCollection} disabled={savingLookup}>
                    {savingLookup ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    <span className="hidden sm:inline">Speichern</span>
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="text-xs">
                    <Link
                      to={buildEllieUrl({
                        prefill: ellieAskWordPrompt(lookup.german, lookup.english, activeLevel),
                        auto: true,
                        title: lookup.english,
                        returnTo: "/vokabeln",
                        returnLabel: "Zurück zu Vokabeln",
                      })}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Frag Ellie</span>
                    </Link>
                  </Button>
                </div>
              </div>
              {(() => {
                const examplesDe = lookup.examples_de?.length
                  ? lookup.examples_de
                  : lookup.example_de ? [lookup.example_de] : [];
                const examplesEn = lookup.examples_en?.length
                  ? lookup.examples_en
                  : lookup.example_en ? [lookup.example_en] : [];
                if (!examplesDe.length && !examplesEn.length) return null;
                return (
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-muted/60 p-3 space-y-1">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Beispiele (DE)</div>
                      {examplesDe.slice(0, 4).map((ex, i) => (
                        <div key={i} className="leading-snug">• {ex}</div>
                      ))}
                    </div>
                    <div className="rounded-lg bg-muted/60 p-3 space-y-1">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Beispiele (EN)</div>
                      {examplesEn.slice(0, 4).map((ex, i) => (
                        <div key={i} className="leading-snug">• {ex}</div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </Card>
      </section>

      {/* ============ 2) Neue Vokabeln für dich ============ */}
      <section className="space-y-3">
        <div className="space-y-0.5">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Neue Vokabeln für dich
          </h2>
          <p className="text-sm text-muted-foreground">
            Vorschläge passend zu deinem Fokus: <span className="font-semibold">{activeLevel}</span>
            {" · "}
            <span className="font-semibold">{activeTopic || "—"}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="soft"
            size="sm"
            onClick={() => setShowTopicPicker((v) => !v)}
            disabled={!hasSelection}
            className="h-9"
          >
            Thema ändern
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showTopicPicker ? "rotate-180" : ""}`} />
          </Button>
          <Button
            type="button"
            variant="hero"
            size="sm"
            onClick={() => loadSuggestions(true)}
            disabled={loadingSuggestions || !hasSelection}
            className="h-9"
          >
            {loadingSuggestions ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            10 neue Vokabeln laden
          </Button>
        </div>

        {showTopicPicker && (
          <Card className="p-3">
            <Label className="text-xs mb-2 block">Wähle ein Thema</Label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => pickTopic(t)}
                  className={chip(activeTopic === t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </Card>
        )}

        {!hasSelection && (
          <Card className="p-4 text-sm text-muted-foreground">
            Wähle zuerst ein Niveau und Thema, damit wir passende Vokabeln vorschlagen können.
          </Card>
        )}

        {hasSelection && loadingSuggestions && suggestions.length === 0 && (
          <Card className="p-6 flex items-center justify-center text-sm text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Vorschläge werden geladen…
          </Card>
        )}

        {hasSelection && !loadingSuggestions && suggestions.length === 0 && (
          <Card className="p-4 text-sm text-muted-foreground">
            Keine neuen Vorschläge – probiere ein anderes Thema oder lade neu.
          </Card>
        )}

        {suggestions.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {suggestions.map((s) => {
              const key = `${s.german}|${s.english}`;
              const saved = savedKeys.has(key);
              const saving = savingKey === key;
              return (
                <Card key={key} className="p-3 flex items-center justify-between gap-3 bg-gradient-card">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <div className="font-semibold truncate">{s.german}</div>
                      <ArrowRightLeft className="h-3 w-3 text-muted-foreground shrink-0" />
                      <div className="text-primary font-semibold truncate">{s.english}</div>
                    </div>
                    {s.grammar_note && (
                      <div className="text-[11px] text-muted-foreground italic mt-0.5 line-clamp-1">
                        {s.grammar_note}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Mit Ellie erklären"
                    >
                      <Link
                        to={buildEllieUrl({
                          prefill: ellieAskWordPrompt(s.german, s.english, activeLevel),
                          auto: true,
                          title: s.english,
                          returnTo: "/vokabeln",
                          returnLabel: "Zurück zu Vokabeln",
                        })}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant={saved ? "soft" : "hero"}
                      size="sm"
                      className="h-8"
                      onClick={() => !saved && saveSuggestion(s)}
                      disabled={saved || saving}
                      title="Zur Sammlung hinzufügen"
                    >
                      {saving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : saved ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ============ 3) Deine Sammlung ============ */}
      <section className="space-y-3">
        <Collapsible open={collectionOpen} onOpenChange={setCollectionOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/40 transition-smooth"
            >
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold">Deine Sammlung</span>
                <span className="text-xs text-muted-foreground">· {items.length}</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${collectionOpen ? "rotate-180" : ""}`}
              />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-3 pt-3">
            {/* Secondary filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Suchen…"
                  value={collectionSearch}
                  onChange={(e) => setCollectionSearch(e.target.value)}
                  className="pl-8 h-9 text-sm rounded-lg"
                />
              </div>
              <select
                value={collectionTopic}
                onChange={(e) => setCollectionTopic(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-2 text-xs"
              >
                <option value="alle">Alle Themen</option>
                {topics.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={collectionStatus}
                onChange={(e) => setCollectionStatus(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-2 text-xs"
              >
                <option value="alle">Alle Typen</option>
                <option value="new">Neu</option>
                <option value="learning">Lernend</option>
                <option value="mastered">Gemeistert</option>
              </select>
            </div>

            <div className="text-xs text-muted-foreground">
              {filtered.length} von {items.length} angezeigt
            </div>

            <div className="space-y-2">
              {filtered.map((v) => (
                <Card key={v.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <div className="font-semibold truncate">{v.german}</div>
                      <span className="text-muted-foreground text-xs">↔</span>
                      <div className="text-primary font-semibold truncate">{v.english}</div>
                    </div>
                    {v.grammar_note && (
                      <div className="text-[11px] text-muted-foreground italic mt-0.5 line-clamp-1">
                        {v.grammar_note}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="outline" className="font-mono text-[10px]">{v.level}</Badge>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusClasses[v.status] ?? statusClasses.new}`}
                    >
                      {statusLabels[v.status] ?? "Neu"}
                    </span>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Frag Ellie zu diesem Wort"
                    >
                      <Link
                        to={buildEllieUrl({
                          prefill: ellieAskWordPrompt(v.german, v.english, v.level),
                          auto: true,
                          title: v.english,
                          returnTo: "/vokabeln",
                          returnLabel: "Zurück zu Vokabeln",
                        })}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
              {filtered.length === 0 && (
                <Card className="p-6 text-center text-muted-foreground space-y-1 text-sm">
                  <p>Noch keine Vokabeln in deiner Sammlung für diesen Filter.</p>
                  <p className="text-xs">
                    Speichere oben einen Vorschlag oder schlage ein Wort mit „Frag mich!" nach.
                  </p>
                </Card>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>
    </div>
  );
}

function chip(active: boolean) {
  return `rounded-full px-3 py-1 text-xs font-semibold transition-smooth ${
    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
  }`;
}
