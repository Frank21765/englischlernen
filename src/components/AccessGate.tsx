import { useUserAccess } from "@/hooks/useUserAccess";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock, Clock, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  const isBlocked = status === "blocked";
  const Icon = isBlocked ? Lock : Clock;
  const title = isBlocked ? "Zugang gesperrt" : "Zugang abgelaufen";
  const desc = isBlocked
    ? "Dein Zugang wurde vom Administrator gesperrt. Bitte wende dich an Frank."
    : `Dein Zugang ist ${validUntil ? "am " + new Date(validUntil).toLocaleDateString("de-DE") : "abgelaufen"}. Bitte wende dich an Frank für eine Verlängerung.`;

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 grid place-items-center">
          <Icon className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="text-2xl font-display">{title}</h1>
        <p className="text-muted-foreground">{desc}</p>
        <Button variant="outline" onClick={async () => { await signOut(); navigate("/auth"); }}>
          <LogOut className="h-4 w-4 mr-2" /> Abmelden
        </Button>
      </Card>
    </div>
  );
}
