import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  Bar,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  BookOpen,
  GraduationCap,
  Library,
  Puzzle,
  Sparkles,
  Target,
} from "lucide-react";

interface Session {
  id: string;
  mode: string;
  level: string;
  topic: string;
  total_answers: number;
  correct_answers: number;
  created_at: string;
}

const MODE_META: Record<string, { label: string; icon: typeof Puzzle; color: string; bg: string }> = {
  quiz: { label: "Quiz", icon: GraduationCap, color: "text-sky-400", bg: "bg-sky-500/15" },
  grammar_quiz: { label: "Grammatik-Quiz", icon: Library, color: "text-violet-400", bg: "bg-violet-500/15" },
  grammar: { label: "Grammatik", icon: Library, color: "text-violet-400", bg: "bg-violet-500/15" },
  flashcards: { label: "Karteikarten", icon: BookOpen, color: "text-amber-400", bg: "bg-amber-500/15" },
  wortpuzzle: { label: "Wortpuzzle", icon: Puzzle, color: "text-emerald-400", bg: "bg-emerald-500/15" },
  cloze: { label: "Lückentext", icon: Sparkles, color: "text-rose-400", bg: "bg-rose-500/15" },
  lesson: { label: "Lektion", icon: GraduationCap, color: "text-primary", bg: "bg-primary/15" },
};

function modeMeta(mode: string) {
  return MODE_META[mode] ?? { label: mode, icon: Target, color: "text-muted-foreground", bg: "bg-muted" };
}

export default function Statistik() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [masteredCount, setMasteredCount] = useState(0);
  const [totalVocab, setTotalVocab] = useState(0);
  const [profileLevel, setProfileLevel] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: ses }, { count: mastered }, { count: total }, { data: prof }] = await Promise.all([
        supabase.from("learning_sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(500),
        supabase.from("vocabulary").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "mastered"),
        supabase.from("vocabulary").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("profiles").select("default_level").eq("user_id", user.id).maybeSingle(),
      ]);
      // Filter out empty (0/0) ghost sessions globally
      const valid = ((ses ?? []) as Session[]).filter((s) => s.total_answers > 0);
      setSessions(valid);
      setMasteredCount(mastered ?? 0);
      setTotalVocab(total ?? 0);
      setProfileLevel(prof?.default_level ?? null);
    })();
  }, [user]);

  const totals = useMemo(() => {
    const total = sessions.reduce((s, x) => s + x.total_answers, 0);
    const correct = sessions.reduce((s, x) => s + x.correct_answers, 0);
    return { total, correct, pct: total ? Math.round((correct / total) * 100) : 0 };
  }, [sessions]);

  const streak = useMemo(() => {
    const days = new Set(sessions.map((s) => new Date(s.created_at).toISOString().slice(0, 10)));
    let count = 0;
    const d = new Date();
    while (days.has(d.toISOString().slice(0, 10))) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [sessions]);

  const chartData = useMemo(() => {
    const buckets: Record<string, { date: string; total: number; correct: number }> = {};
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { date: key.slice(5), total: 0, correct: 0 };
    }
    for (const s of sessions) {
      const key = new Date(s.created_at).toISOString().slice(0, 10);
      if (buckets[key]) {
        buckets[key].total += s.total_answers;
        buckets[key].correct += s.correct_answers;
      }
    }
    return Object.values(buckets).map((b) => ({
      date: b.date,
      Antworten: b.total,
      Trefferquote: b.total ? Math.round((b.correct / b.total) * 100) : 0,
    }));
  }, [sessions]);

  const avgPerDay = useMemo(() => {
    const sum = chartData.reduce((s, x) => s + x.Antworten, 0);
    return Math.round(sum / chartData.length);
  }, [chartData]);

  const bestDay = useMemo(() => {
    const best = chartData.reduce(
      (acc, x) => (x.Antworten > acc.count ? { date: x.date, count: x.Antworten } : acc),
      { date: "—", count: 0 },
    );
    return best;
  }, [chartData]);

  const modeBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of sessions) counts.set(s.mode, (counts.get(s.mode) ?? 0) + s.total_answers);
    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
    if (!total) return [] as { mode: string; count: number; pct: number }[];
    return Array.from(counts.entries())
      .map(([mode, count]) => ({ mode, count, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [sessions]);

  const levelBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; correct: number }>();
    for (const s of sessions) {
      const cur = map.get(s.level) ?? { total: 0, correct: 0 };
      cur.total += s.total_answers;
      cur.correct += s.correct_answers;
      map.set(s.level, cur);
    }
    return Array.from(map.entries())
      .map(([level, v]) => ({ level, total: v.total, pct: v.total ? Math.round((v.correct / v.total) * 100) : 0 }))
      .sort((a, b) => a.level.localeCompare(b.level));
  }, [sessions]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl">Dein Fortschritt</h1>
        <p className="text-muted-foreground">Übersicht über alle Lernsessions.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Antworten gesamt" value={totals.total} />
        <Stat label="Trefferquote" value={`${totals.pct}%`} accent />
        <Stat label="Streak" value={`${streak} 🔥`} />
        <Stat label="Gemeistert" value={`${masteredCount}/${totalVocab}`} />
        <Stat label="Ø Antworten/Tag (14 T.)" value={avgPerDay} />
        <Stat label="Bester Tag" value={`${bestDay.count}`} sub={bestDay.date} />
        <Stat label="Aktuelles Niveau" value={profileLevel ?? "—"} />
        <Stat label="Sessions" value={sessions.length} />
      </div>

      <Card className="hover-lift p-4 md:p-6">
        <h2 className="font-display text-xl mb-4">Aktivität · letzte 14 Tage</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} unit="%" />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="Antworten" fill="hsl(var(--primary) / 0.4)" radius={[6, 6, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="Trefferquote" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="hover-lift p-4 md:p-6">
          <h2 className="font-display text-xl mb-3">Verteilung nach Übungsart</h2>
          {modeBreakdown.length === 0 && <div className="text-sm text-muted-foreground">Noch keine Daten.</div>}
          <div className="space-y-2.5">
            {modeBreakdown.map((m) => {
              const meta = modeMeta(m.mode);
              const Icon = meta.icon;
              return (
                <div key={m.mode} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className={`rounded-lg p-1 ${meta.bg}`}><Icon className={`h-4 w-4 ${meta.color}`} /></span>
                      {meta.label}
                    </span>
                    <span className="text-muted-foreground">{m.count} · {m.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="hover-lift p-4 md:p-6">
          <h2 className="font-display text-xl mb-3">Trefferquote pro Niveau</h2>
          {levelBreakdown.length === 0 && <div className="text-sm text-muted-foreground">Noch keine Daten.</div>}
          <div className="space-y-2.5">
            {levelBreakdown.map((l) => (
              <div key={l.level} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono font-bold text-primary">{l.level}</span>
                  <span className="text-muted-foreground">{l.pct}% · {l.total} Antworten</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-success" style={{ width: `${l.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="hover-lift p-4 md:p-6">
        <h2 className="font-display text-xl mb-3">Letzte Sessions</h2>
        <div className="space-y-2">
          {sessions.slice(0, 20).map((s) => {
            const pct = s.total_answers ? Math.round((s.correct_answers / s.total_answers) * 100) : 0;
            const meta = modeMeta(s.mode);
            const Icon = meta.icon;
            return (
              <div key={s.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`rounded-lg p-2 shrink-0 ${meta.bg}`}>
                    <Icon className={`h-4 w-4 ${meta.color}`} />
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {meta.label} · {s.level} · {s.topic}
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString("de-DE")}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold">{s.correct_answers}/{s.total_answers}</div>
                  <div className="text-xs text-muted-foreground">{pct}%</div>
                </div>
              </div>
            );
          })}
          {sessions.length === 0 && <div className="text-center text-muted-foreground py-6">Noch keine Sessions.</div>}
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, accent, sub }: { label: string; value: string | number; accent?: boolean; sub?: string }) {
  return (
    <Card className={`hover-lift p-4 ${accent ? "bg-gradient-warm text-primary-foreground shadow-glow" : ""}`}>
      <div className={`text-xs uppercase font-bold tracking-wider ${accent ? "opacity-90" : "text-muted-foreground"}`}>{label}</div>
      <div className="font-display text-2xl md:text-3xl mt-1">{value}</div>
      {sub && <div className={`text-xs mt-0.5 ${accent ? "opacity-80" : "text-muted-foreground"}`}>{sub}</div>}
    </Card>
  );
}
