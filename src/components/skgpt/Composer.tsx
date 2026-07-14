import { useRef, useState } from "react";
import { Plus, ArrowUp, Square, ChevronDown, Brain, Sparkles, X, FileText, Image as ImageIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

export type ModelKey = "sk2.0" | "sk2.5" | "sk3.5" | "sk3.2pro";
export type Mode = "talking" | "code";
export type Quality = "low" | "medium" | "high" | "max";

export type ComposerSettings = {
  model: ModelKey;
  mode: Mode;
  quality: Quality;
  deepThinking: boolean;
  poweredThought: boolean;
};

export type PendingFile = {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  size: number;
};

const MODEL_LABEL: Record<ModelKey, string> = {
  "sk2.0": "SK 2.0",
  "sk2.5": "SK 2.5",
  "sk3.5": "SK 3.5",
  "sk3.2pro": "SK 3.2 pro",
};

const MODEL_DESC: Record<ModelKey, string> = {
  "sk2.0": "Thinking · fast + smart",
  "sk2.5": "Deep thinking · Gemini 2.5 Pro",
  "sk3.5": "Gemini 3.5 Flash · powerful coding",
  "sk3.2pro": "Gemini 3.1 Pro · deepest + best code",
};

const QUALITY_LABEL: Record<Quality, string> = {
  low: "Low · fast",
  medium: "Medium · balanced",
  high: "High · careful",
  max: "Max · deepest reasoning",
};

const MODE_LABEL: Record<Mode, string> = {
  talking: "Global Do",
  code: "Writing code",
};

export function Composer({
  settings,
  onSettingsChange,
  onSend,
  status,
  onStop,
}: {
  settings: ComposerSettings;
  onSettingsChange: (s: ComposerSettings) => void;
  onSend: (text: string, files: PendingFile[]) => void;
  status: "submitted" | "streaming" | "ready" | "error";
  onStop?: () => void;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<PendingFile[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const busy = status === "submitted" || status === "streaming";

  const send = () => {
    if (busy) return;
    if (!text.trim() && files.length === 0) return;
    onSend(text.trim(), files);
    setText("");
    setFiles([]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const onPickFiles = async (list: FileList | null) => {
    if (!list) return;
    const arr: PendingFile[] = [];
    for (const f of Array.from(list).slice(0, 10)) {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(f);
      });
      arr.push({
        id: `${f.name}_${f.size}_${Math.random().toString(36).slice(2, 6)}`,
        name: f.name,
        type: f.type || "application/octet-stream",
        dataUrl,
        size: f.size,
      });
    }
    setFiles((prev) => [...prev, ...arr].slice(0, 10));
    if (fileRef.current) fileRef.current.value = "";
  };

  const isDeepTier = settings.model === "sk2.5" || settings.model === "sk3.2pro";
  const isSK25 = isDeepTier;
  const reasoningLabel = isDeepTier ? "Deep thinking" : "Thinking";

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-4 pt-2">
      <div className="rounded-2xl border border-border bg-card/95 shadow-lg backdrop-blur">
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-border/60 p-2">
            {files.map((f) => (
              <div
                key={f.id}
                className="group flex items-center gap-2 rounded-lg bg-surface-2 px-2 py-1.5 text-xs"
              >
                {f.type.startsWith("image/") ? (
                  <ImageIcon className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-primary" />
                )}
                <span className="max-w-[160px] truncate font-mono">{f.name}</span>
                <button
                  onClick={() =>
                    setFiles((prev) => prev.filter((x) => x.id !== f.id))
                  }
                  className="rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                  aria-label="Remove file"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask SKGPT anything — Lua scripts, game ideas, or just chill…"
          rows={1}
          className="max-h-48 min-h-[52px] w-full resize-none bg-transparent px-4 pt-3.5 text-[15px] outline-none placeholder:text-muted-foreground"
        />

        <div className="flex flex-wrap items-center gap-1.5 px-2 pb-2 pt-1">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,.txt,.lua,.luau,.json,.md,.pdf"
            className="hidden"
            onChange={(e) => onPickFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            title="Attach files / images"
          >
            <Plus className="h-5 w-5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-9 items-center gap-1 rounded-lg bg-surface-2 px-2.5 text-xs font-medium hover:bg-muted"
              >
                <span className="text-gradient-neon font-semibold">
                  {MODEL_LABEL[settings.model]}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Model</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={settings.model}
                onValueChange={(v) =>
                  onSettingsChange({ ...settings, model: v as ModelKey })
                }
              >
                {(Object.keys(MODEL_LABEL) as ModelKey[]).map((k) => (
                  <DropdownMenuRadioItem key={k} value={k}>
                    <div className="flex flex-col">
                      <span className="font-medium">{MODEL_LABEL[k]}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {MODEL_DESC[k]}
                      </span>
                    </div>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-9 items-center gap-1 rounded-lg bg-surface-2 px-2.5 text-xs hover:bg-muted"
              >
                {MODE_LABEL[settings.mode]}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Mode</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={settings.mode}
                onValueChange={(v) =>
                  onSettingsChange({ ...settings, mode: v as Mode })
                }
              >
                <DropdownMenuRadioItem value="talking">
                  Global Do · study · learn · ideas · world
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="code">
                  Writing code · Lua / Roblox
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-9 items-center gap-1 rounded-lg bg-surface-2 px-2.5 text-xs hover:bg-muted"
              >
                <Brain className="h-3.5 w-3.5 text-magenta" />
                {settings.quality[0].toUpperCase() + settings.quality.slice(1)}
                {settings.deepThinking && !settings.poweredThought && (
                  <span className="ml-1 rounded bg-magenta/20 px-1 text-[10px] font-semibold text-magenta">
                    {isSK25 ? "DEEP" : "THINK"}
                  </span>
                )}
                {settings.poweredThought && (
                  <span className="ml-1 inline-flex items-center gap-0.5 rounded bg-primary/20 px-1 text-[10px] font-semibold text-primary">
                    <Sparkles className="h-2.5 w-2.5" />PT
                  </span>
                )}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Reasoning quality</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={settings.quality}
                onValueChange={(v) =>
                  onSettingsChange({ ...settings, quality: v as Quality })
                }
              >
                {(Object.keys(QUALITY_LABEL) as Quality[]).map((q) => (
                  <DropdownMenuRadioItem key={q} value={q}>
                    {QUALITY_LABEL[q]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              {!settings.poweredThought && (
                <DropdownMenuCheckboxItem
                  checked={settings.deepThinking}
                  onCheckedChange={(v) =>
                    onSettingsChange({ ...settings, deepThinking: Boolean(v) })
                  }
                >
                  <div className="flex flex-col">
                    <span>{reasoningLabel}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {isSK25
                        ? "Extended, deepest reasoning + Nexus UI pro"
                        : "Careful thinking before answering"}
                    </span>
                  </div>
                </DropdownMenuCheckboxItem>
              )}
              <DropdownMenuCheckboxItem
                checked={settings.poweredThought}
                onCheckedChange={(v) =>
                  onSettingsChange({ ...settings, poweredThought: Boolean(v) })
                }
              >
                <div className="flex flex-col">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Powered Thought
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Learns human life · empathy · Studio Lite + Roblox focus
                  </span>
                </div>
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto" />
          {busy ? (
            <button
              type="button"
              onClick={onStop}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive text-destructive-foreground hover:opacity-90"
              title="Stop"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={send}
              disabled={!text.trim() && files.length === 0}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 enabled:glow-neon"
              title="Send"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        SKGPT can make mistakes — I learn and improve on the next update.
      </p>
    </div>
  );
}
