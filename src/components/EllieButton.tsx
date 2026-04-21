import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { buildEllieUrl } from "@/lib/ellie";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface EllieButtonProps {
  prefill: string;
  title?: string;
  returnTo: string;
  returnLabel?: string;
  /** sessionStorage key to set right before navigating, so the source page knows to restore state on return. */
  returnFlagKey: string;
  /** Visual size. "icon" = compact circular icon button. "sm" = labeled pill. */
  variant?: "icon" | "sm";
  className?: string;
}

/**
 * Unified Coach Ellie action used everywhere across the app.
 * Single recognizable visual identity: Sparkles icon + warm primary tint.
 */
export function EllieButton({
  prefill,
  title,
  returnTo,
  returnLabel,
  returnFlagKey,
  variant = "icon",
  className,
}: EllieButtonProps) {
  const markReturning = () => {
    try { sessionStorage.setItem(returnFlagKey, "1"); } catch { /* ignore */ }
  };

  const to = buildEllieUrl({ prefill, auto: true, title, returnTo, returnLabel });

  if (variant === "sm") {
    return (
      <Button
        asChild
        size="sm"
        className={cn(
          "h-9 rounded-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 font-semibold shadow-sm",
          className,
        )}
        title="Mit Coach Ellie besprechen"
      >
        <Link onClick={markReturning} to={to}>
          <Sparkles className="h-4 w-4" />
          <span>Frag Ellie</span>
        </Link>
      </Button>
    );
  }

  return (
    <Button
      asChild
      size="icon"
      className={cn(
        "h-10 w-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 shadow-sm",
        className,
      )}
      title="Mit Coach Ellie besprechen"
    >
      <Link onClick={markReturning} to={to} aria-label="Mit Coach Ellie besprechen">
        <Sparkles className="h-[18px] w-[18px]" />
      </Link>
    </Button>
  );
}
