import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";
import DonationCards from "@/components/DonationCards";
import FeedbackBox from "@/components/FeedbackBox";

export default function Unterstuetzen() {
  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5 bg-gradient-card shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 p-2">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg leading-tight">Hello! unterstützen</h2>
            <p className="text-xs text-muted-foreground">Hilf mit, Hello! am Leben zu halten 💛</p>
          </div>
        </div>
        <div className="rounded-xl bg-muted/40 p-3 sm:p-4 text-sm leading-relaxed text-muted-foreground">
          Hello! ist mein privates Hobby-Projekt — kein Startup, keine Werbung, keine Datenverkäufe.
          Mit Spenden geht es <strong className="text-foreground">nicht um Gewinn</strong>, sondern darum,
          die laufenden Kosten zu decken (Server, KI-Modelle, Domain). Jeder Euro hilft, dass Hello!
          online bleibt und weiterwächst. Danke! 💛
        </div>
        <DonationCards />
      </Card>

      <FeedbackBox />
    </div>
  );
}
