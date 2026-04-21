import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import appIcon from "@/assets/app-icon.png";
import { ensureProfileForUser } from "@/lib/profile";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Ungültige E-Mail-Adresse" }).max(255),
  password: z.string().min(6, { message: "Mindestens 6 Zeichen" }).max(100),
});
const signupSchema = loginSchema.extend({
  username: z.string().trim().min(2, { message: "Benutzername min. 2 Zeichen" }).max(40),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      navigate(data?.onboarding_completed ? "/lernen" : "/onboarding", { replace: true });
    })();
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = mode === "signup"
      ? signupSchema.safeParse({ email, password, username })
      : loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const data = parsed.data as { email: string; password: string; username: string };
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
            data: { display_name: data.username },
          },
        });
        if (error) throw error;
        toast.success("Konto erstellt – welcome!");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        if (data.user) {
          await ensureProfileForUser(data.user);
        }
        toast.success("Welcome back!");
      }
      // Routing now handled by the useEffect above based on onboarding state.
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Etwas ist schiefgelaufen";
      toast.error(
        msg.includes("Invalid login")
          ? "E-Mail oder Passwort falsch"
          : msg.toLowerCase().includes("already registered")
          ? "Diese E-Mail ist schon registriert – bitte mit dem bestehenden Passwort anmelden."
          : msg,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-gradient-to-br from-background via-muted to-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={appIcon}
            alt="Hello! App-Icon"
            className="mx-auto h-24 w-24 mb-4 animate-pop"
          />
          <h1 className="font-display text-4xl">Hello!</h1>
          <p className="text-muted-foreground mt-2">Englisch lernen mit Coach Ellie – so, wie es zu dir passt</p>
        </div>
        <Card className="p-6 shadow-card">
          <div className="flex gap-1 p-1 mb-6 bg-muted rounded-full">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-smooth ${mode === "login" ? "bg-background shadow-soft text-foreground" : "text-muted-foreground"}`}
            >Anmelden</button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-smooth ${mode === "signup" ? "bg-background shadow-soft text-foreground" : "text-muted-foreground"}`}
            >Konto erstellen</button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="username">Benutzername</Label>
                <Input id="username" type="text" autoComplete="nickname" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={40} required placeholder="z. B. EmmaLernt" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Passwort</Label>
              <Input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={busy} variant="hero" size="lg" className="w-full">
              {busy ? "Bitte warten…" : mode === "signup" ? "Konto erstellen" : "Anmelden"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
