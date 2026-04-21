import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LEVELS, QUICK_TOPICS, DirectionMode, directionLabel } from "@/lib/learning";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { BarChart3, BookOpen, Loader2, ShieldAlert } from "lucide-react";

type DeleteKind = null | "stats" | "vocab" | "account";

const KIND_META: Record<Exclude<DeleteKind, null>, {
  title: string;
  description: string;
  bullets: string[];
  confirmWord: string;
  buttonLabel: string;
}> = {
  stats: {
    title: "Lernstatistiken zurücksetzen?",
    description: "Diese Aktion löscht alle deine Sessions, die Trefferquote-Historie und die Streak-Zählung.",
    bullets: ["Alle Lernsessions", "Trefferquote-Verlauf", "Streak-Historie"],
    confirmWord: "LÖSCHEN",
    buttonLabel: "Statistiken löschen",
  },
  vocab: {
    title: "Vokabelsammlung löschen?",
    description: "Diese Aktion löscht deine gesamte Vokabelsammlung inklusive Lernfortschritt pro Wort.",
    bullets: ["Alle gespeicherten Vokabeln", "Lernfortschritt (SRS-Status)", "Status „gemeistert"],
    confirmWord: "LÖSCHEN",
    buttonLabel: "Vokabeln löschen",
  },
  account: {
    title: "Konto endgültig löschen?",
    description:
      "Diese Aktion ist unwiderruflich. Dein gesamtes Konto sowie alle damit verbundenen Daten werden vollständig entfernt.",
    bullets: [
      "Vokabeln & Lernfortschritt",
      "Alle Sessions & Statistiken",
      "Chat-Verlauf mit Ellie",
      "Erfolge & Profil",
      "Login-Konto (E-Mail/Passwort)",
    ],
    confirmWord: "KONTO LÖSCHEN",
    buttonLabel: "Konto endgültig löschen",
  },
};

export default function Einstellungen() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [defaultLevel, setDefaultLevel] = useState("A1");
  const [defaultTopic, setDefaultTopic] = useState("Alltag");
  const [direction, setDirection] = useState<DirectionMode>("random");
  const [saving, setSaving] = useState(false);

  const [deleteKind, setDeleteKind] = useState<DeleteKind>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

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

  const openDelete = (kind: Exclude<DeleteKind, null>) => {
    setDeleteKind(kind);
    setConfirmText("");
  };

  const closeDelete = () => {
    if (deleting) return;
    setDeleteKind(null);
    setConfirmText("");
  };

  const performDelete = async () => {
    if (!user || !deleteKind) return;
    setDeleting(true);
    try {
      if (deleteKind === "stats") {
        const { error } = await supabase.from("learning_sessions").delete().eq("user_id", user.id);
        if (error) throw error;
        toast.success("Lernstatistiken zurückgesetzt.");
      } else if (deleteKind === "vocab") {
        const { error } = await supabase.from("vocabulary").delete().eq("user_id", user.id);
        if (error) throw error;
        toast.success("Vokabelsammlung gelöscht.");
      } else if (deleteKind === "account") {
        const { error } = await supabase.functions.invoke("delete-account");
        if (error) throw error;
        toast.success("Konto gelöscht. Du wirst abgemeldet.");
        await signOut();
        navigate("/auth");
        return;
      }
      setDeleteKind(null);
      setConfirmText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Löschen fehlgeschlagen");
    } finally {
      setDeleting(false);
    }
  };

  const meta = deleteKind ? KIND_META[deleteKind] : null;
  const confirmReady = !!meta && confirmText.trim() === meta.confirmWord;

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

      <Card className="p-5 space-y-4">
        <div>
          <h2 className="text-xl font-display flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Konto & Daten verwalten
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Du entscheidest, was mit deinen Daten passiert. Jede Aktion muss separat bestätigt werden.
          </p>
        </div>

        <div className="space-y-3">
          <DangerRow
            icon={<BarChart3 className="h-5 w-5 text-sky-400" />}
            title="Lernstatistiken zurücksetzen"
            description="Löscht alle Sessions, Trefferquote-Verlauf und die Streak-Historie. Vokabeln & Konto bleiben erhalten."
            buttonLabel="Statistiken löschen"
            onClick={() => openDelete("stats")}
          />
          <DangerRow
            icon={<BookOpen className="h-5 w-5 text-emerald-400" />}
            title="Vokabeln löschen"
            description="Löscht deine gesamte Vokabelsammlung inklusive Lernfortschritt. Statistiken & Konto bleiben erhalten."
            buttonLabel="Vokabeln löschen"
            onClick={() => openDelete("vocab")}
          />
          <DangerRow
            icon={<ShieldAlert className="h-5 w-5 text-destructive" />}
            title="Konto vollständig löschen"
            description="Entfernt dein Konto und alle Daten unwiderruflich: Vokabeln, Sessions, Chats, Erfolge, Profil und Login."
            buttonLabel="Konto löschen"
            destructive
            onClick={() => openDelete("account")}
          />
        </div>
      </Card>

      <AlertDialog open={!!deleteKind} onOpenChange={(o) => { if (!o) closeDelete(); }}>
        <AlertDialogContent>
          {meta && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" /> {meta.title}
                </AlertDialogTitle>
                <AlertDialogDescription>{meta.description}</AlertDialogDescription>
              </AlertDialogHeader>

              <div className="rounded-xl bg-muted/50 p-3 text-sm space-y-1">
                <div className="font-semibold text-foreground">Was gelöscht wird:</div>
                <ul className="list-disc pl-5 text-muted-foreground space-y-0.5">
                  {meta.bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-sm">
                  Tippe zur Bestätigung <span className="font-mono font-bold text-destructive">{meta.confirmWord}</span>
                </Label>
                <Input
                  id="confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={meta.confirmWord}
                  autoComplete="off"
                  className="h-11 rounded-xl"
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  disabled={!confirmReady || deleting}
                  onClick={(e) => { e.preventDefault(); performDelete(); }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {meta.buttonLabel}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DangerRow({
  icon,
  title,
  description,
  buttonLabel,
  destructive,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="rounded-xl border border-border p-3 sm:p-4 flex items-start gap-3">
      <div className="rounded-lg bg-muted/60 p-2 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
      <Button
        variant={destructive ? "destructive" : "outline"}
        size="sm"
        onClick={onClick}
        className="shrink-0"
      >
        {buttonLabel}
      </Button>
    </div>
  );
}
