import { useEffect, useMemo, useState, KeyboardEvent } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLearning } from "@/hooks/useLearningContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LEVELS, QUICK_TOPICS, Level } from "@/lib/learning";
import { getProfileUsername } from "@/lib/profile";
import { ellieAskWordPrompt } from "@/lib/ellie";
import { EllieButton } from "@/components/EllieButton";
import { toast } from "sonner";
import {
  ArrowRightLeft,
  CalendarClock,
  ChevronDown,
  GraduationCap,
  Info,
  Library,
  Loader2,
  MessageCircle,
  PenLine,
  Pencil,
  Search,
  Sparkles,
  Target,
} from "lucide-react";

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

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const LONG_INPUT_WORDS = 12;

// Persist UI state across navigation (e.g. side-trip to Coach Ellie).
// Only restored when the user is explicitly returning from an Ellie side-trip
// (flag set by EllieButton just before navigating). Fresh page entries / fresh
// logins always start with a clean default state.
const STATE_KEY = "lernen.uiState.v1";
const RETURN_FLAG_KEY = "lernen.returningFromEllie";
interface PersistedState {
  askInput: string;
  lookup: LookupResult | null;
  lookupQuery: string;
  editFocus: boolean;
  customMode: boolean;
}
function consumePersisted(): Partial<PersistedState> {
  try {
    const isReturning = sessionStorage.getItem(RETURN_FLAG_KEY) === "1";
    if (!isReturning) {
      // Fresh entry — wipe any leftover state so we truly start clean.
      sessionStorage.removeItem(STATE_KEY);
      return {};
    }
    sessionStorage.removeItem(RETURN_FLAG_KEY);
    const raw = sessionStorage.getItem(STATE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<PersistedState>;
  } catch {
    return {};
  }
}

// Persisted collapsed state for "Frag mich!"
const ASK_OPEN_KEY = "lernen.askOpen.v1";

export default function Lernen() {
  const { user } = useAuth();
  const { level, topic, hasSelection, setSelection } = useLearning();
  const navigate = useNavigate();
  const location = useLocation();

  const persisted = useMemo(consumePersisted, []);

  const [vocabCount, setVocabCount] = useState<number | null>(null);
  const [dueCount, setDueCount] = useState<number | null>(null);
  const [username, setUsername] = useState<string>("");

  const isCustomTopic = hasSelection && !(QUICK_TOPICS as readonly string[]).includes(topic);
  const [customMode, setCustomMode] = useState<boolean>(persisted.customMode ?? isCustomTopic);
  const [editFocus, setEditFocus] = useState<boolean>(persisted.editFocus ?? !hasSelection);
  const [askOpen, setAskOpen] = useState<boolean>(() => {
    try { return sessionStorage.getItem(ASK_OPEN_KEY) !== "0"; } catch { return true; }
  });
  useEffect(() => {
    try { sessionStorage.setItem(ASK_OPEN_KEY, askOpen ? "1" : "0"); } catch { /* ignore */ }
  }, [askOpen]);

  // ---- Box 1: Frag mich! ----
  const [askInput, setAskInput] = useState(persisted.askInput ?? "");
  const [lookup, setLookup] = useState<LookupResult | null>(persisted.lookup ?? null);
  const [lookupQuery, setLookupQuery] = useState<string>(persisted.lookupQuery ?? "");
  const [lookingUp, setLookingUp] = useState(false);

  // Persist relevant UI state.
  useEffect(() => {
    const snapshot: PersistedState = { askInput, lookup, lookupQuery, editFocus, customMode };
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify(snapshot));
    } catch { /* ignore quota */ }
  }, [askInput, lookup, lookupQuery, editFocus, customMode]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      const nowIso = new Date().toISOString();
      const [{ count: total }, { count: dueScheduled }, { count: dueUnseen }, profileRes] = await Promise.all([
        supabase.from("vocabulary").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("vocabulary").select("id", { count: "exact", head: true })
          .eq("user_id", user.id).lte("next_review_at", nowIso),
        supabase.from("vocabulary").select("id", { count: "exact", head: true })
          .eq("user_id", user.id).is("next_review_at", null).is("last_seen_at", null),
        getProfileUsername(user),
      ]);
      if (cancelled) return;
      setVocabCount(total ?? 0);
      setDueCount((dueScheduled ?? 0) + (dueUnseen ?? 0));
      setUsername(profileRes.greetingUsername);
    };
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [user, location.pathname]);

  // ---------- Lookup ("Frag mich!") ----------
  const runLookup = async () => {
    const text = askInput.trim();
    if (!text) return;
    setLookingUp(true);
    setLookup(null);
    setLookupQuery(text);
    try {
      const { data, error } = await supabase.functions.invoke("translate-word", {
        body: { word: text, level },
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

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        {username && (
          <p className="text-sm sm:text-base text-accent font-semibold">
            Hello {username}, schön, dass du da bist.
          </p>
        )}
        <h1 className="text-2xl sm:text-3xl md:text-4xl break-words">Let's go!</h1>
      </header>

      {/* ============ 1) Frag mich! ============ */}
      <Collapsible open={askOpen} onOpenChange={setAskOpen} asChild>
        <section className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-accent/5 shadow-card overflow-hidden">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 text-left hover:bg-primary/5 transition-smooth"
              aria-expanded={askOpen}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="rounded-xl bg-primary/15 p-1.5 shrink-0">
                  <EllieIcon size={28} alt="" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">Frag mich!</h2>
                  <p className="text-sm text-muted-foreground">Wort eingeben und direkt übersetzen</p>
                </div>
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${askOpen ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3">
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
                <div className="rounded-xl border border-border p-4 space-y-3 bg-card animate-pop">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="text-xs uppercase tracking-widest text-primary font-bold flex items-center gap-1.5">
                        <EllieIcon size={14} alt="" /> Übersetzung für „{lookupQuery}"
                      </div>
                      <div className="flex items-baseline flex-wrap gap-3">
                        <div className="font-display text-xl">{lookup.german}</div>
                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                        <div className="font-display text-xl text-primary">{lookup.english}</div>
                      </div>
                      {(lookup.part_of_speech || lookup.note) && (
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          {lookup.part_of_speech && (
                            <Badge variant="outline" className="text-sm uppercase">{lookup.part_of_speech}</Badge>
                          )}
                          {lookup.note && <span className="text-sm text-muted-foreground italic">{lookup.note}</span>}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      <EllieButton
                        prefill={ellieAskWordPrompt(lookup.german, lookup.english, level)}
                        title={lookup.english}
                        returnTo="/lernen"
                        returnLabel="Zurück zum Lernen"
                        returnFlagKey={RETURN_FLAG_KEY}
                        variant="sm"
                      />
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
                          <div className="text-xs uppercase tracking-widest text-muted-foreground">Beispiele (DE)</div>
                          {examplesDe.slice(0, 4).map((ex, i) => (
                            <div key={i} className="leading-snug">• {ex}</div>
                          ))}
                        </div>
                        <div className="rounded-lg bg-muted/60 p-3 space-y-1">
                          <div className="text-xs uppercase tracking-widest text-muted-foreground">Beispiele (EN)</div>
                          {examplesEn.slice(0, 4).map((ex, i) => (
                            <div key={i} className="leading-snug">• {ex}</div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </section>
      </Collapsible>

      {/* ============ 2) Aktueller Fokus ============ */}
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
                <p className="text-sm text-muted-foreground mt-1">
                  {vocabCount} Vokabel{vocabCount === 1 ? "" : "n"} insgesamt gespeichert
                </p>
              )}
              {dueCount !== null && dueCount > 0 && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 text-primary" />
                  {dueCount} {dueCount === 1 ? "Vokabel wartet" : "Vokabeln warten"} auf eine kurze Wiederholung
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
            <span className="hidden sm:inline">{editFocus ? "Schließen" : "Anpassen"}</span>
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

      {/* ============ 3) Bereit für die nächste Runde? ============ */}
      <Card className="p-4 sm:p-5 md:p-6 space-y-4 bg-gradient-card shadow-card">
        <div className="space-y-0.5">
          <h2 className="text-base sm:text-lg font-bold">Bereit für die nächste Runde?</h2>
          <p className="text-sm text-muted-foreground">
            Wähle, womit du jetzt weitermachen möchtest.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <Button variant="soft" size="lg" onClick={() => navigate(`/vokabeln?fresh=${Date.now()}`)} className="w-full whitespace-normal text-center leading-tight px-3">
            <Sparkles className="h-4 w-4 shrink-0" /> <span className="min-w-0">Vokabeln</span>
          </Button>
          <Button variant="soft" size="lg" onClick={() => navigate(`/uben/grammatik?fresh=${Date.now()}`)} className="w-full whitespace-normal text-center leading-tight px-3">
            <Library className="h-4 w-4 shrink-0" /> <span className="min-w-0">Grammatik</span>
          </Button>
          <Button variant="soft" size="lg" onClick={() => navigate(`/uben/quiz?fresh=${Date.now()}`)} className="w-full whitespace-normal text-center leading-tight px-3">
            <GraduationCap className="h-4 w-4 shrink-0" /> <span className="min-w-0">Quiz</span>
          </Button>
          <Button variant="soft" size="lg" onClick={() => navigate(`/uben/lueckentext?fresh=${Date.now()}`)} className="w-full whitespace-normal text-center leading-tight px-3">
            <PenLine className="h-4 w-4 shrink-0" /> <span className="min-w-0">Lückentext</span>
          </Button>
          <Button
            variant="soft"
            size="lg"
            onClick={() => navigate(`/chat?new=1&t=${Date.now()}`)}
            className="col-span-2 w-full whitespace-normal text-center leading-tight px-3"
          >
            <EllieIcon size={20} alt="" /> <span className="min-w-0">Coach Ellie</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
