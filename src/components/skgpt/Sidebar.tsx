import { Link, useNavigate } from "@tanstack/react-router";
import { MessageSquarePlus, Trash2, MoreVertical, Sparkles } from "lucide-react";
import type { Thread } from "@/lib/skgpt-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Sidebar({
  threads,
  activeId,
  onNewChat,
  onDelete,
}: {
  threads: Thread[];
  activeId: string;
  onNewChat: () => void;
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <aside className="flex h-full w-full flex-col bg-surface/60">
      <div className="flex items-center justify-between px-3 pt-3">
        <Link to="/" className="flex items-center gap-2 rounded-lg px-1.5 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground glow-neon">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight">SKGPT</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Roblox Lua Co-pilot
            </span>
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              aria-label="Menu"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onNewChat}>
              <MessageSquarePlus className="mr-2 h-4 w-4" /> New chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="px-3 pt-3">
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 py-2.5 text-sm font-medium hover:bg-muted"
        >
          <MessageSquarePlus className="h-4 w-4 text-primary" />
          New chat
        </button>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto px-2 pb-3">
        <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Chats
        </div>
        {threads.length === 0 && (
          <div className="px-2 py-4 text-xs text-muted-foreground">
            No chats yet. Start a new one.
          </div>
        )}
        <ul className="space-y-0.5">
          {threads.map((t) => {
            const active = t.id === activeId;
            return (
              <li key={t.id}>
                <div
                  className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm ${
                    active
                      ? "bg-surface-2 text-foreground"
                      : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground"
                  }`}
                >
                  <button
                    onClick={() =>
                      navigate({ to: "/chat/$threadId", params: { threadId: t.id } })
                    }
                    className="flex-1 truncate text-left"
                    title={t.title}
                  >
                    {t.title || "New chat"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(t.id);
                    }}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                    aria-label="Delete chat"
                    title="Delete chat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
