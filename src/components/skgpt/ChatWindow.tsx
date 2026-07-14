import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { Composer, type ComposerSettings, type PendingFile } from "./Composer";
import skgptLogo from "@/assets/skgpt-logo.png";
import { toast } from "sonner";

const DEFAULT_SETTINGS: ComposerSettings = {
  model: "sk2.0",
  mode: "talking",
  quality: "medium",
  deepThinking: false,
  poweredThought: false,
};

const FALLBACK_KEY = "skgpt.sk25.fallbackUntil";
const FAIL_KEY = "skgpt.sk25.failCount";

function isFallbackActive(): boolean {
  if (typeof window === "undefined") return false;
  const until = Number(window.localStorage.getItem(FALLBACK_KEY) || 0);
  return until > Date.now();
}

function tomorrowMidnight(): number {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function ChatWindow({
  threadId,
  initialMessages,
  onMessagesChange,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  onMessagesChange: (msgs: UIMessage[]) => void;
}) {
  const [settings, setSettings] = useState<ComposerSettings>(DEFAULT_SETTINGS);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const initialRef = useRef(initialMessages);

  const { messages, sendMessage, status, stop } = useChat({
    id: threadId,
    messages: initialRef.current,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages, body }) => ({
        body: {
          messages,
          model: settingsRef.current.model,
          mode: settingsRef.current.mode,
          quality: settingsRef.current.quality,
          deepThinking: settingsRef.current.deepThinking,
          poweredThought: settingsRef.current.poweredThought,
          forceFlash:
            settingsRef.current.model === "sk2.5" ? isFallbackActive() : false,
          clientDate: new Date().toISOString(),
          clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ...body,
        },
      }),
    }),
    onError: (err) => {
      const raw = err instanceof Error ? err.message : String(err);
      if (settingsRef.current.model !== "sk2.5") return;
      if (!/quota|429|unavailable|500|503|overloaded/i.test(raw)) return;
      const n = Number(window.localStorage.getItem(FAIL_KEY) || 0) + 1;
      window.localStorage.setItem(FAIL_KEY, String(n));
      if (n >= 2 && !isFallbackActive()) {
        const ok = window.confirm(
          "SK 2.5 (Gemini 2.5 Pro) failed twice. Switch to Gemini 2.5 Flash for a while? SKGPT will auto-switch back to Pro tomorrow.",
        );
        if (ok) {
          window.localStorage.setItem(FALLBACK_KEY, String(tomorrowMidnight()));
          window.localStorage.setItem(FAIL_KEY, "0");
          toast.success("SK 2.5 → Flash fallback enabled until tomorrow.");
        }
      }
    },
  });

  useEffect(() => {
    onMessagesChange(messages);
  }, [messages, onMessagesChange]);

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  const onSend = (text: string, files: PendingFile[]) => {
    if (!text && files.length === 0) return;
    const fileList = files.map((f) => ({
      type: "file" as const,
      mediaType: f.type,
      url: f.dataUrl,
      filename: f.name,
    }));
    void sendMessage({
      text: text || undefined,
      files: fileList.length > 0 ? fileList : undefined,
    } as Parameters<typeof sendMessage>[0]);
  };

  const isEmpty = messages.length === 0;
  const fallback = settings.model === "sk2.5" && isFallbackActive();

  return (
    <div className="flex h-full flex-col">
      {fallback && (
        <div className="mx-auto mt-2 max-w-3xl rounded-lg border border-border bg-accent/50 px-3 py-1.5 text-[11px] text-accent-foreground">
          SK 2.5 is temporarily using Gemini 2.5 Flash. Auto-switching back to Pro tomorrow.
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <EmptyState mode={settings.mode} model={settings.model} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 py-6">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {status === "submitted" && (
              <div className="px-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  Thinking…
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <Composer
        settings={settings}
        onSettingsChange={setSettings}
        onSend={onSend}
        status={status}
        onStop={stop}
      />
    </div>
  );
}

function EmptyState({
  mode,
  model,
}: {
  mode: ComposerSettings["mode"];
  model: ComposerSettings["model"];
}) {
  const suggestions =
    mode === "code"
      ? [
          "Build a Nexus UI latest window with a draggable tab and a toggle.",
          "Write a Roblox LocalScript that makes the player double-jump.",
          "Give me a Script that saves player coins to DataStore safely.",
        ]
      : [
          "Explain quantum entanglement like I'm 15.",
          "Help me plan a 4-week study routine for calculus.",
          "Expand this idea: a mobile app that helps kids learn coding.",
          "Summarize the causes of World War I in 6 bullet points.",
        ];

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center">
        <img src={skgptLogo} alt="SKGPT" width={64} height={64} className="drop-shadow-[0_8px_24px_rgba(167,139,250,0.45)]" />
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="text-gradient-neon">SKGPT</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your global co-pilot — study, learn, expand ideas, and build Roblox / Nexus UI.
          <br />
          Chat in <span className="text-foreground">Global Do</span>, or switch to <span className="text-foreground">Writing code</span> for Luau.

        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {model === "sk3.2pro"
            ? "SK 3.2 pro · Gemini 3.1 Pro · deepest"
            : model === "sk3.5"
              ? "SK 3.5 · Gemini 3.5 Flash · powerful coding"
              : model === "sk2.5"
                ? "SK 2.5 · deepest reasoning"
                : "SK 2.0 · thinking"} · {mode}
        </div>
      </div>
      <div className="grid w-full gap-2 sm:grid-cols-1">
        {suggestions.map((s) => (
          <div
            key={s}
            className="rounded-xl border border-border bg-surface p-3 text-left text-sm text-muted-foreground"
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}
