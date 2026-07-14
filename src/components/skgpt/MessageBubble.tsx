import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, ChevronDown, Brain } from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import skgptLogo from "@/assets/skgpt-logo.png";
import type { UIMessage } from "ai";


// Accept several variants the model sometimes emits:
//   <<<PT_THINK title="Thinking">>> ... <<<END_PT_THINK>>>
//   <<<PT_THINK>>> ... <<<END_PT_THINK>>>
//   <<PT_THINK ...>> ... <<END_PT_THINK>>   (looser brackets)
const PT_RE =
  /<<<?\s*PT_THINK\s*(?:title\s*=\s*"([^"]*)")?\s*>?>>([\s\S]*?)(?:<<<?\s*END_PT_THINK\s*>?>>|$)/i;

function splitPoweredThought(text: string): {
  title: string | null;
  reasoning: string | null;
  answer: string;
} {
  const m = text.match(PT_RE);
  if (!m) return { title: null, reasoning: null, answer: text };
  const title = m[1] || "Thinking";
  const reasoning = m[2].trim();
  const answer = (text.slice(0, m.index) + text.slice(m.index! + m[0].length)).trim();
  return { title, reasoning, answer };
}


function PoweredThoughtBlock({
  title,
  reasoning,
  streaming,
}: {
  title: string;
  reasoning: string;
  streaming: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3 rounded-xl border border-primary/30 bg-primary/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <Brain className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-primary">{title}</span>
        {streaming && (
          <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            thinking…
          </span>
        )}
        <ChevronDown
          className={`ml-auto h-4 w-4 text-primary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="border-t border-primary/20 px-3 py-2 text-[13px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {reasoning || "…"}
        </div>
      )}
    </div>
  );
}


function messageText(m: UIMessage) {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

function messageFiles(m: UIMessage) {
  return m.parts.flatMap((p) =>
    p.type === "file"
      ? [{ url: (p as { url: string }).url, mediaType: (p as { mediaType?: string }).mediaType }]
      : [],
  );
}

export function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = messageText(message);
  const files = messageFiles(message);
  const [showCopy, setShowCopy] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end px-4">
        <div className="flex max-w-[85%] flex-col items-end gap-1">
          <button
            type="button"
            onClick={() => setShowCopy((v) => !v)}
            className="rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-left text-primary-foreground shadow-sm transition hover:brightness-105"
          >
            {files.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {files.map((f, i) =>
                  f.mediaType?.startsWith("image/") ? (
                    <img
                      key={i}
                      src={f.url}
                      alt=""
                      className="max-h-40 rounded-lg border border-white/25 object-cover"
                    />
                  ) : (
                    <div
                      key={i}
                      className="rounded-md bg-white/20 px-2 py-1 font-mono text-xs"
                    >
                      file · {f.mediaType ?? "attachment"}
                    </div>
                  ),
                )}
              </div>
            )}
            <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{text}</div>
          </button>
          {showCopy && (
            <button
              type="button"
              onClick={copy}
              className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
              aria-label="Copy message"
            >
              {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="mb-1 flex items-center gap-2">
        <img src={skgptLogo} alt="" width={24} height={24} className="h-6 w-6 drop-shadow-[0_2px_6px_rgba(167,139,250,0.5)]" />
        <span className="text-xs text-muted-foreground">SKGPT</span>
      </div>

      <div className="max-w-none pl-8 text-[15px] leading-relaxed">
        {(() => {
          const pt = splitPoweredThought(text);
          const streamingPT = pt.title !== null && pt.answer.length === 0;
          return pt.title ? (
            <PoweredThoughtBlock
              title={pt.title}
              reasoning={pt.reasoning ?? ""}
              streaming={streamingPT}
            />
          ) : null;
        })()}
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {files.map((f, i) =>
              f.mediaType?.startsWith("image/") ? (
                <img
                  key={i}
                  src={f.url}
                  alt=""
                  className="max-h-64 rounded-xl border border-border object-cover shadow-sm"
                />
              ) : null,
            )}
          </div>
        )}
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => (
              <p className="my-2 whitespace-pre-wrap text-foreground">{children}</p>
            ),
            a: ({ children, href }) => (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-2"
              >
                {children}
              </a>
            ),
            img: ({ src, alt }) => (
              <img
                src={typeof src === "string" ? src : undefined}
                alt={alt ?? ""}
                className="my-2 max-h-80 rounded-xl border border-border object-cover shadow-sm"
              />
            ),
            ul: ({ children }) => (
              <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>
            ),
            code: ({ className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || "");
              const raw = String(children).replace(/\n$/, "");
              const isBlock = className?.includes("language-");
              if (isBlock) {
                return <CodeBlock code={raw} language={match?.[1]} />;
              }
              return (
                <code
                  className="rounded bg-code-bg px-1.5 py-0.5 font-mono text-[13px] text-primary"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            pre: ({ children }) => <>{children}</>,
          }}
        >
          {splitPoweredThought(text).answer || (splitPoweredThought(text).title ? "" : text)}
        </ReactMarkdown>
      </div>
    </div>
  );
}
