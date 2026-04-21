import { Card } from "@/components/ui/card";
import { EllieIcon } from "@/components/EllieIcon";
import { Heart, ExternalLink } from "lucide-react";

const PAYPAL_HANDLE = "Englischlernen";

const tiers = [
  { amount: "5.40", display: "5,40 €", title: "Kaffee für Ellie", subtitle: "Ein kleines Dankeschön" },
  { amount: "10.20", display: "10,20 €", title: "Monat Hosting", subtitle: "Hält Hello! online" },
  { amount: "19.20", display: "19,20 €", title: "Ein Quartal Hello!", subtitle: "Drei Monate Power" },
];

export default function DonationCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${compact ? "sm:grid-cols-3" : "sm:grid-cols-3"}`}>
        {tiers.map((t) => (
          <a
            key={t.amount}
            href={`https://paypal.me/${PAYPAL_HANDLE}/${t.amount}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <Card className="p-4 h-full bg-gradient-card shadow-card hover:shadow-glow hover:-translate-y-1 transition-bounce border-2 border-transparent hover:border-primary/30 cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-full bg-primary/10 p-1.5">
                  <EllieIcon size={20} />
                </div>
                <Heart className="h-4 w-4 text-primary opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-bounce" />
              </div>
              <div className="font-display text-2xl text-primary">{t.display}</div>
              <div className="font-semibold text-sm mt-1">{t.title}</div>
              <div className="text-xs text-muted-foreground">{t.subtitle}</div>
            </Card>
          </a>
        ))}
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground">
          Kein Abo, keine Verpflichtung. Einmalspende per PayPal.
        </p>
        <a
          href={`https://paypal.me/${PAYPAL_HANDLE}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
        >
          Eigenen Betrag wählen <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
