import { useUserAccess } from "@/hooks/useUserAccess";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock, Clock, LogOut, Hourglass, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DonationCards from "@/components/DonationCards";

export default function AccessGate({ children }: { children: React.ReactNode }) {
  const { status, loading, validUntil } = useUserAccess();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-muted-foreground animate-shimmer">Lade…</div>
      </div>
    );
  }

  if (status === "active") return <>{children}</>;

  const isPending = status === "pending";
  const isBlocked = status === "blocked";
  const Icon = isPending ? Hourglass : isBlocked ? Lock : Clock;
  const title = isPending
    ? "Fast geschafft!"
    : isBlocked
    ? "Zugang gesperrt"
    : "Zugang abgelaufen";
  const desc = isPending
    ? "Danke fürs Anmelden! Hello! ist ein privates Hobby-Projekt. Sobald Frank dich freischaltet, geht's los — du bekommst eine Mail."
    : isBlocked
    ? "Dein Zugang wurde vom Administrator gesperrt. Bitte wende dich an Frank."
    : `Dein Zugang ist ${validUntil ? "am " + new Date(validUntil).toLocaleDateString("de-DE") : "abgelaufen"}. Bitte wende dich an Frank für eine Verlängerung.`;

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-6">
        <Card className="p-8 text-center space-y-4 bg-gradient-card shadow-card">
          <div className={`mx-auto h-14 w-14 rounded-full grid place-items-center ${isPending ? "bg-primary/10" : "bg-destructive/10"}`}>
            <Icon className={`h-7 w-7 ${isPending ? "text-primary" : "text-destructive"}`} />
          </div>
          <h1 className="text-2xl font-display">{title}</h1>
          <p className="text-muted-foreground">{desc}</p>
          <Button variant="outline" onClick={async () => { await signOut(); navigate("/auth"); }}>
            <LogOut className="h-4 w-4 mr-2" /> Abmelden
          </Button>
        </Card>

        {isPending && (
          <Card className="p-6 space-y-4 bg-gradient-card shadow-card">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 text-primary font-semibold">
                <Heart className="h-4 w-4" /> Hello! unterstützen
              </div>
              <p className="text-sm text-muted-foreground">
                Während du wartest: Hello! lebt von Spenden. Jeder Beitrag hilft.
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 p-3 sm:p-4 text-sm leading-relaxed text-muted-foreground">
              Hello! ist mein privates Hobby-Projekt — kein Startup, keine Werbung, keine Datenverkäufe.
              Mit Spenden geht es <strong className="text-foreground">nicht um Gewinn</strong>, sondern darum,
              die laufenden Kosten zu decken (Server, KI-Modelle, Domain). Jeder Euro hilft, dass Hello!
              online bleibt und weiterwächst. Danke! 💛
            </div>
            <DonationCards />
          </Card>
        )}
      </div>
    </div>
  );
}
