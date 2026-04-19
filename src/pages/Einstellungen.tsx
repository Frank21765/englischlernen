import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LEVELS, QUICK_TOPICS, DirectionMode, directionLabel } from "@/lib/learning";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Einstellungen() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [defaultLevel, setDefaultLevel] = useState("A1");
  const [defaultTopic, setDefaultTopic] = useState("Alltag");
  const [direction, setDirection] = useState<DirectionMode>("random");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("default_level, default_topic, direction_mode")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setDefaultLevel(data.default_level ?? "A1");
        setDefaultTopic(data.default_topic ?? "Alltag");
        setDirection((data.direction_mode as DirectionMode) ?? "random");
      }
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        default_level: defaultLevel,
        default_topic: defaultTopic.trim() || "Alltag",
        direction_mode: direction,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Gespeichert");
  };

  const deleteAccount = async () => {
    if (!user) return;
    if (!window.confirm("Wirklich Konto und alle Daten unwiderruflich löschen?")) return;
    await supabase.from("vocabulary").delete().eq("user_id", user.id);
    await supabase.from("learning_sessions").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("user_id", user.id);
    toast.success("Daten gelöscht. Du wirst abgemeldet.");
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-3xl">Einstellungen</h1>
        <p className="text-muted-foreground">Passe dein Lernerlebnis an.</p>
      </header>

      <Card className="p-5 space-y-5">
        <div>
          <Label className="text-base font-semibold mb-2 block">Abfragerichtung</Label>
          <div className="grid sm:grid-cols-3 gap-2">
            {(["de_en", "en_de", "random"] as DirectionMode[]).map((d) => (
              <button
                key={d}
                onClick={() => setDirection(d)}
                className={`rounded-2xl border-2 p-3 text-sm font-semibold text-left transition-bounce ${
                  direction === d ? "border-primary bg-primary/10 text-foreground" : "border-border hover:bg-muted"
                }`}
              >
                {directionLabel[d]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-base font-semibold mb-2 block">Standard-Niveau</Label>
          <div className="flex flex-wrap gap-1.5">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setDefaultLevel(l)}
                className={`min-w-[3rem] rounded-xl px-3 py-1.5 text-sm font-bold transition-smooth ${
                  defaultLevel === l ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"
                }`}
              >{l}</button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="dtopic" className="text-base font-semibold mb-2 block">Standard-Thema</Label>
          <Input id="dtopic" value={defaultTopic} maxLength={60} onChange={(e) => setDefaultTopic(e.target.value)} className="h-11 rounded-xl" />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {QUICK_TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => setDefaultTopic(t)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-smooth ${
                  defaultTopic === t ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >{t}</button>
            ))}
          </div>
        </div>

        <Button variant="hero" size="lg" onClick={save} disabled={saving}>
          {saving ? "Speichere…" : "Speichern"}
        </Button>
      </Card>

      <Card className="p-5 border-destructive/30 space-y-3">
        <div>
          <Label className="text-base font-semibold text-destructive">Gefahrenzone</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Löscht alle deine Vokabeln, Sessions und dein Profil. Du wirst abgemeldet.
          </p>
        </div>
        <Button variant="destructive" onClick={deleteAccount}>Alle Daten löschen</Button>
      </Card>
    </div>
  );
}
