import { Check, MessageSquare, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface ChatSessionItem {
  id: string;
  title: string;
  updated_at: string;
}

interface ChatSessionListProps {
  activeId: string | null;
  onCommitRename: () => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onRenameCancel: () => void;
  onRenameChange: (value: string) => void;
  onSelect: (id: string) => void;
  onStartRename: (session: ChatSessionItem) => void;
  renameValue: string;
  renamingId: string | null;
  sessions: ChatSessionItem[];
  showCreateButton?: boolean;
}

export function ChatSessionList({
  activeId,
  onCommitRename,
  onCreate,
  onDelete,
  onRenameCancel,
  onRenameChange,
  onSelect,
  onStartRename,
  renameValue,
  renamingId,
  sessions,
  showCreateButton = true,
}: ChatSessionListProps) {
  return (
    <div className="space-y-3 min-w-0 w-full">
      {showCreateButton && (
        <Button onClick={onCreate} variant="hero" className="w-full">
          <Plus className="h-4 w-4" /> Neuer Chat
        </Button>
      )}
      <Card className="p-2 space-y-1 max-h-[60vh] overflow-y-auto min-w-0 w-full">
        {sessions.length === 0 && (
          <p className="text-xs text-muted-foreground p-3 text-center">Noch keine Chats.</p>
        )}
        {sessions.map((session) => {
          const isActive = session.id === activeId;
          const isRenaming = renamingId === session.id;

          return (
            <div
              key={session.id}
              className={`group rounded-xl px-2 py-1.5 text-sm transition-smooth min-w-0 ${
                isActive ? "bg-primary/10" : "hover:bg-muted"
              }`}
            >
              {isRenaming ? (
                <div className="flex items-center gap-1 min-w-0">
                  <Input
                    value={renameValue}
                    onChange={(e) => onRenameChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onCommitRename();
                      }
                      if (e.key === "Escape") onRenameCancel();
                    }}
                    className="h-8 text-sm min-w-0"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={onCommitRename}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={onRenameCancel}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1 min-w-0">
                  <button
                    onClick={() => onSelect(session.id)}
                    className={`flex-1 min-w-0 text-left flex items-center gap-1.5 ${
                      isActive ? "font-semibold text-foreground" : "text-foreground/80"
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{session.title}</span>
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-smooth"
                    onClick={() => onStartRename(session)}
                    title="Umbenennen"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-smooth text-destructive"
                    onClick={() => onDelete(session.id)}
                    title="Löschen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}