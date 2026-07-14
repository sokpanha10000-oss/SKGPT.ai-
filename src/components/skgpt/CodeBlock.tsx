import { useState, useRef, useEffect } from "react";
import { Copy, Check, ChevronDown, ChevronUp, Terminal, FileCode2 } from "lucide-react";

// Language → { label, accent } — accent is a tailwind color class used as the
// glow bar + language chip color. Roblox/Lua gets the SKGPT neon treatment.
const LANG_META: Record<string, { label: string; accent: string; icon: "lua" | "code" }> = {
  lua: { label: "Luau · Roblox", accent: "hsl(var(--primary))", icon: "lua" },
  luau: { label: "Luau · Roblox", accent: "hsl(var(--primary))", icon: "lua" },
  ts: { label: "TypeScript", accent: "#3b82f6", icon: "code" },
  typescript: { label: "TypeScript", accent: "#3b82f6", icon: "code" },
  js: { label: "JavaScript", accent: "#eab308", icon: "code" },
  javascript: { label: "JavaScript", accent: "#eab308", icon: "code" },
  py: { label: "Python", accent: "#22c55e", icon: "code" },
  python: { label: "Python", accent: "#22c55e", icon: "code" },
  json: { label: "JSON", accent: "#a855f7", icon: "code" },
  bash: { label: "Bash", accent: "#94a3b8", icon: "code" },
  sh: { label: "Shell", accent: "#94a3b8", icon: "code" },
};

export function CodeBlock({
  code,
  language,
}: {
  code: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);
  const [needsClamp, setNeedsClamp] = useState(false);

  useEffect(() => {
    const el = preRef.current;
    if (!el) return;
    const tmp = document.createElement("pre");
    tmp.textContent = code;
    tmp.style.cssText = getComputedStyle(el).cssText;
    tmp.style.height = "auto";
    tmp.style.maxHeight = "none";
    tmp.style.position = "absolute";
    tmp.style.visibility = "hidden";
    tmp.style.width = el.clientWidth + "px";
    document.body.appendChild(tmp);
    const natural = tmp.scrollHeight;
    document.body.removeChild(tmp);
    setNeedsClamp(natural > 280);
  }, [code]);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const lang = (language ?? "").toLowerCase();
  const meta = LANG_META[lang] ?? {
    label: lang ? lang.toUpperCase() : "code",
    accent: "hsl(var(--primary))",
    icon: "code" as const,
  };
  const lineCount = code.split("\n").length;

  return (
    <div
      className="group relative my-4 overflow-hidden rounded-2xl border border-border/70 bg-code-bg shadow-lg shadow-black/40 transition-shadow hover:shadow-xl"
      style={{ boxShadow: `0 0 0 1px ${meta.accent}22, 0 10px 30px -12px ${meta.accent}55` }}
    >
      {/* Neon accent bar */}
      <div
        className="h-[2px] w-full"
        style={{ background: `linear-gradient(90deg, transparent, ${meta.accent}, transparent)` }}
      />
      <div className="flex items-center justify-between border-b border-border/60 bg-surface-2/70 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          {/* mac-style dots */}
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          </div>
          <span
            className="ml-2 inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider"
            style={{
              color: meta.accent,
              borderColor: `${meta.accent}55`,
              background: `${meta.accent}12`,
            }}
          >
            {meta.icon === "lua" ? (
              <Terminal className="h-3 w-3" />
            ) : (
              <FileCode2 className="h-3 w-3" />
            )}
            {meta.label}
          </span>
          <span className="hidden font-mono text-[10.5px] text-muted-foreground sm:inline">
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {needsClamp && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              title={expanded ? "Collapse" : "View full"}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" /> Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" /> More
                </>
              )}
            </button>
          )}
          <button
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      <pre
        ref={preRef}
        className="overflow-auto p-4 font-mono text-[13px] leading-relaxed"
        style={{ maxHeight: needsClamp && !expanded ? "280px" : "none" }}
      >
        <code>{code}</code>
      </pre>
      {needsClamp && !expanded && (
        <div className="pointer-events-none -mt-12 h-12 bg-gradient-to-t from-code-bg to-transparent" />
      )}
    </div>
  );
}
