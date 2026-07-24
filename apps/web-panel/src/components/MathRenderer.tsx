"use client";

import React from "react";

interface MathRendererProps {
  text: string;
  className?: string;
}

/**
 * Matches a "bare" LaTeX token that is NOT already inside $ delimiters:
 *  - \command  followed by optional ^, _, {}, ()
 *  - x^{...}  or  x_{...}  shorthand
 *
 * We use this to auto-wrap individual math snippets in $...$
 * so spaces around them are preserved.
 */
const BARE_LATEX_RE = /(\\[a-zA-Z]+(?:\s*[\^_]\{[^}]*\})*(?:\s*\([^)]*\))?(?:\s*[\^_]\{[^}]*\})*|[a-zA-Z0-9]*[\^_]\{[^}]*\})/g;

function autoWrapBareLatex(segment: string): string {
  // Only wrap if there is at least one LaTeX command or superscript/subscript
  if (!/\\[a-zA-Z]|[\^_]\{/.test(segment)) return segment;
  return segment.replace(BARE_LATEX_RE, (match) => `$${match.trim()}$`);
}

export default function MathRenderer({ text, className }: MathRendererProps) {
  let processedText = text || "";

  // 1. Convert native LaTeX block delimiters  \[...\]  →  $$...$$
  processedText = processedText.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
  // 2. Convert native LaTeX inline delimiters  \(...\)  →  $...$
  processedText = processedText.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  // 3. Split on already-delimited math ($$...$$  or  $...$)
  const rawParts = processedText.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);

  // 4. For each plain-text segment, auto-wrap any bare LaTeX tokens
  const parts: string[] = rawParts.map((part) => {
    if ((part.startsWith('$$') && part.endsWith('$$')) ||
        (part.startsWith('$') && part.endsWith('$'))) {
      return part; // already a math block, leave alone
    }
    return autoWrapBareLatex(part);
  });

  // 5. Re-split after auto-wrapping so new $...$ tokens are parsed
  const finalParts = parts
    .join('')
    .split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);

  return (
    <span className={className}>
      {finalParts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const latex = part.slice(2, -2).trim();
          return <MathBlock key={i} latex={latex} displayMode={true} raw={part} />;
        } else if (part.startsWith("$") && part.endsWith("$")) {
          const latex = part.slice(1, -1).trim();
          return <MathBlock key={i} latex={latex} displayMode={false} raw={part} />;
        }
        return (
          <span key={i} className="whitespace-pre-wrap">
            {part}
          </span>
        );
      })}
    </span>
  );
}

function MathBlock({
  latex,
  displayMode,
  raw,
}: {
  latex: string;
  displayMode: boolean;
  raw: string;
}) {
  const [html, setHtml] = React.useState<string | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const render = async () => {
      try {
        const mod = await import("katex");
        const katexLib = (mod as any).default ?? mod;
        if (!cancelled) {
          setHtml(
            katexLib.renderToString(latex, {
              displayMode,
              throwOnError: false,
              output: "htmlAndMathml",
              fleqn: true,
            })
          );
        }
      } catch {
        if (!cancelled) setError(true);
      }
    };
    render();
    return () => { cancelled = true; };
  }, [latex, displayMode]);

  if (error) return <span className="text-red-500 text-xs font-mono">{raw}</span>;
  if (html === null) return <span className="opacity-40 text-xs font-mono">{raw}</span>;

  return (
    <span
      className={displayMode ? "block my-2 text-left overflow-x-auto" : "inline"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}