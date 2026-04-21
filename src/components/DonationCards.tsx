import { Card } from "@/components/ui/card";
import { EllieIcon } from "@/components/EllieIcon";
import { Heart, ExternalLink } from "lucide-react";

const PAYPAL_HANDLE = "Englischlernen";

const tiers = [
  { amount: "5.40", display: "5,40 €", title: "3 Monate Hello!", subtitle: "Ein Quartal lernen" },
  { amount: "10.20", display: "10,20 €", title: "6 Monate Hello!", subtitle: "Ein halbes Jahr dabei" },
  { amount: "19.20", display: "19,20 €", title: "1 Jahr Hello!", subtitle: "Das ganze Jahr 💛" },
];

export default function DonationCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
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

        {/* Freier Betrag — mit kleinem roten Herz in der Ecke */}
        <a
          href={`https://paypal.me/${PAYPAL_HANDLE}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group block"
        >
          <Card className="relative p-4 h-full bg-gradient-card shadow-card hover:shadow-glow hover:-translate-y-1 transition-bounce border-2 border-dashed border-primary/30 hover:border-primary/60 cursor-pointer">
            <div className="absolute -top-2 -right-2 rounded-full bg-destructive p-1.5 shadow-soft group-hover:scale-110 transition-bounce">
              <Heart className="h-3.5 w-3.5 text-destructive-foreground fill-current" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-primary/10 p-1.5">
                <EllieIcon size={20} />
              </div>
            </div>
            <div className="font-display text-2xl text-primary">★</div>
            <div className="font-semibold text-sm mt-1">Freier Betrag</div>
            <div className="text-xs text-muted-foreground">Du entscheidest</div>
          </Card>
        </a>
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground">
          Einmalspende per PayPal · Kein Abo · Du wirst auf paypal.me weitergeleitet, wo du den Betrag bestätigen oder anpassen kannst.
        </p>
        <a
          href={`https://paypal.me/${PAYPAL_HANDLE}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
        >
          Direkt zu paypal.me/{PAYPAL_HANDLE} <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
