import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LEVELS } from "@/lib/learning";
import { Search } from "lucide-react";

interface Vocab {
  id: string;
  german: string;
  spanish: string;
  grammar_note: string | null;
  level: string;
  topic: string;
  status: string;
}

const statusLabels: Record<string, string> = { new: "Neu", learning: "Lernend", mastered: "Gemeistert" };
const statusClasses: Record<string, string> = {
  new: "bg-muted text-muted-foreground",
  learning: "bg-accent text-accent-foreground",
  mastered: "bg-success text-success-foreground",
};

export default function Vokabeln() {
  const { user } = useAuth();
  const [items, setItems] = useState<Vocab[]>([]);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("alle");
  const [topicFilter, setTopicFilter] = useState<string>("alle");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("vocabulary")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setItems((data ?? []) as Vocab[]);
    })();
  }, [user]);

  const topics = useMemo(() => Array.from(new Set(items.map((i) => i.topic))).sort(), [items]);

  const filtered = items.filter((v) => {
    if (levelFilter !== "alle" && v.level !== levelFilter) return false;
    if (topicFilter !== "alle" && v.topic !== topicFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!v.german.toLowerCase().includes(q) && !v.spanish.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl">Deine Vokabeln</h1>
        <p className="text-muted-foreground">Alles, was du je gelernt hast – durchsuchbar und filterbar.</p>
      </header>

      <Card className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen auf Deutsch oder Spanisch…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl"
          />
        </div>
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

      <div className="text-sm text-muted-foreground">{filtered.length} Vokabeln</div>

      <div className="space-y-2">
        {filtered.map((v) => (
          <Card key={v.id} className="p-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3 flex-wrap">
                <div className="font-semibold">{v.german}</div>
                <div className="text-muted-foreground">↔</div>
                <div className="text-primary font-semibold">{v.spanish}</div>
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
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">Noch keine Vokabeln gefunden.</Card>
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
