import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Session {
  id: string;
  mode: string;
  level: string;
  topic: string;
  total_answers: number;
  correct_answers: number;
  created_at: string;
}

export default function Statistik() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [masteredCount, setMasteredCount] = useState(0);
  const [totalVocab, setTotalVocab] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: ses }, { count: mastered }, { count: total }] = await Promise.all([
        supabase.from("learning_sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
        supabase.from("vocabulary").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "mastered"),
        supabase.from("vocabulary").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setSessions((ses ?? []) as Session[]);
      setMasteredCount(mastered ?? 0);
      setTotalVocab(total ?? 0);
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
      Trefferquote: b.total ? Math.round((b.correct / b.total) * 100) : 0,
    }));
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
      </div>

      <Card className="p-4 md:p-6">
        <h2 className="font-display text-xl mb-4">Trefferquote · letzte 14 Tage</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} unit="%" />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Line type="monotone" dataKey="Trefferquote" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 md:p-6">
        <h2 className="font-display text-xl mb-3">Letzte Sessions</h2>
        <div className="space-y-2">
          {sessions.slice(0, 20).map((s) => {
            const pct = s.total_answers ? Math.round((s.correct_answers / s.total_answers) * 100) : 0;
            return (
              <div key={s.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                <div>
                  <div className="font-semibold text-sm">
                    {s.mode === "grammar_quiz" ? "Grammatik-Quiz" : s.mode === "flashcards" ? "Karteikarten" : "Quiz"} · {s.level} · {s.topic}
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString("de-DE")}</div>
                </div>
                <div className="text-right">
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

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <Card className={`p-4 ${accent ? "bg-gradient-warm text-primary-foreground shadow-glow" : ""}`}>
      <div className={`text-xs uppercase font-bold tracking-wider ${accent ? "opacity-90" : "text-muted-foreground"}`}>{label}</div>
      <div className="font-display text-2xl md:text-3xl mt-1">{value}</div>
    </Card>
  );
}
