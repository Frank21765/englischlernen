import { useNavigate } from "react-router-dom";
import { Pencil, Target } from "lucide-react";
import { useLearning } from "@/hooks/useLearningContext";

interface Props {
  className?: string;
  /** Where the "Ändern" action navigates to (default: /lernen). */
  editTo?: string;
}

/**
 * Compact display of the active learning focus (CEFR level + topic)
 * with a small "Ändern" action that takes the user back to Lernen.
 *
 * Use this in sections like Üben, Vokabeln, Coach to avoid repeating
 * the full focus picker.
 */
export function FocusChip({ className = "", editTo = "/lernen" }: Props) {
  const { level, topic, hasSelection } = useLearning();
  const navigate = useNavigate();

  return (
    <div
      className={`flex items-center gap-2 rounded-full bg-muted/70 pl-2 pr-1 py-1 text-xs sm:text-sm min-w-0 ${className}`}
    >
      <Target className="h-3.5 w-3.5 shrink-0 text-accent" />
      {hasSelection ? (
        <span className="flex items-baseline gap-1.5 min-w-0">
          <span className="font-mono font-bold text-primary">{level}</span>
          <span className="text-muted-foreground/60">·</span>
          <span className="font-semibold truncate max-w-[10rem] sm:max-w-[16rem]">{topic}</span>
        </span>
      ) : (
        <span className="text-muted-foreground">Kein Fokus gesetzt</span>
      )}
      <button
        type="button"
        onClick={() => navigate(editTo)}
        className="ml-1 inline-flex items-center gap-1 rounded-full bg-background/70 hover:bg-background px-2 py-0.5 text-[11px] font-semibold text-foreground transition-smooth shrink-0"
        aria-label="Fokus ändern"
      >
        <Pencil className="h-3 w-3" />
        Ändern
      </button>
    </div>
  );
}
