import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserAccess } from "@/hooks/useUserAccess";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Counts {
  core_vocab_master: number | null;
  cefr_vocab_master: number | null;
  idioms_master: number | null;
  false_friends_master: number | null;
  irregular_verbs_master: number | null;
}

export default function MasterPreview() {
  const { isAdmin, loading } = useUserAccess();
  const [counts, setCounts] = useState<Counts>({
    core_vocab_master: null,
    cefr_vocab_master: null,
    idioms_master: null,
    false_friends_master: null,
    irregular_verbs_master: null,
  });
  const [falseFriends, setFalseFriends] = useState<any[]>([]);
  const [idioms, setIdioms] = useState<any[]>([]);
  const [verbs, setVerbs] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const errs: string[] = [];

      const tables: (keyof Counts)[] = [
        "core_vocab_master",
        "cefr_vocab_master",
        "idioms_master",
        "false_friends_master",
        "irregular_verbs_master",
      ];
      const newCounts = { ...counts };
      await Promise.all(
        tables.map(async (t) => {
          const { count, error } = await supabase
            .from(t as any)
            .select("*", { count: "exact", head: true });
          if (error) errs.push(`count ${t}: ${error.message}`);
          newCounts[t] = count ?? 0;
        })
      );
      setCounts(newCounts);

      const ff = await supabase
        .from("false_friends_master")
        .select(
          "id, german_trigger_word_or_phrase, wrong_english, correct_english_primary, explanation_de, memory_hook_de, cefr_level"
        )
        .order("id")
        .limit(5);
      if (ff.error) errs.push(`false_friends: ${ff.error.message}`);
      setFalseFriends(ff.data ?? []);

      const id = await supabase
        .from("idioms_master")
        .select("id, display_phrase, type, cefr_level, meaning_note_de, distractors_json")
        .order("id")
        .limit(5);
      if (id.error) errs.push(`idioms: ${id.error.message}`);
      setIdioms(id.data ?? []);

      const v = await supabase
        .from("irregular_verbs_master")
        .select(
          "id, lemma, simple_past_primary, past_participle_primary, german_translation_primary, common_mistakes_de, cefr_level"
        )
        .order("id")
        .limit(5);
      if (v.error) errs.push(`verbs: ${v.error.message}`);
      setVerbs(v.data ?? []);

      setErrors(errs);
    })();
  }, [isAdmin]);

  if (loading) return <div className="p-6 text-muted-foreground">Lade…</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-5xl mx-auto">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Master-Tabellen — Vorschau</h1>
        <p className="text-sm text-muted-foreground">
          Interner Sanity-Check. Nur lesend. Keine Schreibvorgänge.
        </p>
      </header>

      {/* Counts */}
      <section>
        <h2 className="text-lg font-medium mb-3">Row Counts</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(Object.entries(counts) as [keyof Counts, number | null][]).map(([k, v]) => (
            <Card key={k} className="p-4">
              <div className="text-xs text-muted-foreground truncate">{k}</div>
              <div className="text-2xl font-semibold mt-1">
                {v === null ? "…" : v.toLocaleString("de-DE")}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* False Friends */}
      <section>
        <h2 className="text-lg font-medium mb-3">false_friends_master — 5 Einträge</h2>
        <div className="space-y-3">
          {falseFriends.map((row) => (
            <Card key={row.id} className="p-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{row.cefr_level}</Badge>
                <span className="font-medium">{row.german_trigger_word_or_phrase}</span>
                <span className="text-xs text-muted-foreground">{row.id}</span>
              </div>
              <div className="text-sm">
                <span className="text-destructive line-through">{row.wrong_english}</span>
                {" → "}
                <span className="text-primary font-medium">{row.correct_english_primary}</span>
              </div>
              <div className="text-sm text-muted-foreground">{row.explanation_de}</div>
              {row.memory_hook_de && (
                <div className="text-sm italic">💡 {row.memory_hook_de}</div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* Idioms */}
      <section>
        <h2 className="text-lg font-medium mb-3">idioms_master — 5 Einträge</h2>
        <div className="space-y-3">
          {idioms.map((row) => (
            <Card key={row.id} className="p-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{row.cefr_level}</Badge>
                <Badge variant="outline">{row.type}</Badge>
                <span className="font-medium">{row.display_phrase}</span>
              </div>
              <div className="text-sm text-muted-foreground">{row.meaning_note_de}</div>
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  distractors_json ({Array.isArray(row.distractors_json) ? row.distractors_json.length : 0})
                </summary>
                <pre className="mt-2 bg-muted p-2 rounded overflow-x-auto text-[11px]">
{JSON.stringify(row.distractors_json, null, 2)}
                </pre>
              </details>
            </Card>
          ))}
        </div>
      </section>

      {/* Verbs */}
      <section>
        <h2 className="text-lg font-medium mb-3">irregular_verbs_master — 5 Einträge</h2>
        <div className="space-y-3">
          {verbs.map((row) => (
            <Card key={row.id} className="p-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{row.cefr_level}</Badge>
                <span className="font-medium">{row.lemma}</span>
                <span className="text-sm text-muted-foreground">
                  {row.lemma} · {row.simple_past_primary} · {row.past_participle_primary}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">DE: </span>
                {row.german_translation_primary}
              </div>
              {row.common_mistakes_de && (
                <div className="text-sm text-muted-foreground">⚠️ {row.common_mistakes_de}</div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* Errors */}
      {errors.length > 0 && (
        <section>
          <h2 className="text-lg font-medium mb-3 text-destructive">Fehler</h2>
          <Card className="p-4">
            <ul className="text-sm space-y-1">
              {errors.map((e, i) => (
                <li key={i} className="text-destructive">{e}</li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}
