import { useState, useEffect } from "react";
import { Pencil, Target } from "lucide-react";
import { useLearning } from "@/hooks/useLearningContext";
import { LEVELS, QUICK_TOPICS, Level } from "@/lib/learning";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  className?: string;
}

/**
 * Compact display of the active learning focus (CEFR level + topic) with
 * an inline editor opened via popover. Editing happens in place — never
 * navigates away from the current section.
 */
export function FocusChip({ className = "" }: Props) {
  const { level, topic, hasSelection, setSelection } = useLearning();
  const [open, setOpen] = useState(false);
  const isCustom = hasSelection && !(QUICK_TOPICS as readonly string[]).includes(topic);
  const [customMode, setCustomMode] = useState(isCustom);
  const [draftTopic, setDraftTopic] = useState(topic);

  useEffect(() => {
    if (open) {
      setDraftTopic(topic);
      setCustomMode(hasSelection && !(QUICK_TOPICS as readonly string[]).includes(topic));
    }
  }, [open, topic, hasSelection]);

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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="ml-1 inline-flex items-center gap-1 rounded-full bg-background/70 hover:bg-background px-2 py-0.5 text-[11px] font-semibold text-foreground transition-smooth shrink-0"
            aria-label="Fokus ändern"
          >
            <Pencil className="h-3 w-3" />
            Ändern
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-4 space-y-4">
          <div>
            <Label className="mb-2 block text-xs font-semibold">Niveau</Label>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setSelection(l as Level, topic, { persist: true })}
                  className={`min-w-[2.5rem] rounded-xl px-2.5 py-1 text-xs font-bold transition-bounce ${
                    level === l
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "bg-muted text-foreground hover:bg-muted/70"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Thema</Label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TOPICS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setCustomMode(false); setSelection(level, t, { persist: true }); }}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-smooth ${
                    !customMode && topic === t
                      ? "bg-accent text-accent-foreground shadow-soft"
                      : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setCustomMode(true); setDraftTopic(isCustom ? topic : ""); }}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-smooth inline-flex items-center gap-1 ${
                  customMode
                    ? "bg-accent text-accent-foreground shadow-soft"
                    : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                <Pencil className="h-3 w-3" /> Eigenes
              </button>
            </div>
            {customMode && (
              <Input
                value={draftTopic}
                maxLength={60}
                onChange={(e) => setDraftTopic(e.target.value)}
                onBlur={() => draftTopic.trim() && setSelection(level, draftTopic.trim(), { persist: true })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && draftTopic.trim()) {
                    setSelection(level, draftTopic.trim(), { persist: true });
                    setOpen(false);
                  }
                }}
                placeholder="z. B. Weltraum, Musik…"
                className="h-9 rounded-xl text-sm"
                autoFocus
              />
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
