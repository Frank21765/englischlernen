import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function FeedbackBox() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!user) return;
    const text = message.trim();
    if (text.length < 3) {
      toast.error("Bitte schreib ein paar Worte mehr.");
      return;
    }
    if (text.length > 2000) {
      toast.error("Maximal 2000 Zeichen.");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("feedback").insert({ user_id: user.id, message: text });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMessage("");
    toast.success("Danke, ist angekommen! 💛");
  };

  return (
    <Card className="p-4 sm:p-5 bg-gradient-card shadow-card space-y-3">
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-primary/10 p-2">
          <MessageSquarePlus className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg leading-tight">Feedback & Wünsche</h2>
          <p className="text-xs text-muted-foreground">Was läuft gut, was fehlt? Schreib's mir!</p>
        </div>
      </div>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Deine Nachricht an Frank…"
        rows={4}
        maxLength={2000}
        className="resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{message.length}/2000</span>
        <Button onClick={send} disabled={sending || message.trim().length < 3} variant="hero" size="sm">
          <Send className="h-4 w-4 mr-1.5" /> Senden
        </Button>
      </div>
    </Card>
  );
}
