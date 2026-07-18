"use client";

import React from "react";

interface MathRendererProps {
  text: string;
  className?: string;
}

export default function MathRenderer({ text, className }: MathRendererProps) {
  let processedText = text || "";
  
  // Convert LaTeX native block/inline delimiters to $$ and $ for our parser
  processedText = processedText.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
  processedText = processedText.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  // Heuristic: If there are no $ signs, but it contains obvious LaTeX math commands,
  // treat the entire text as a block math equation.
  const hasMathCommands = /\\(frac|lim|int|sum|prod|sqrt|alpha|beta|theta|pi|infty|pm|leq|geq|neq|rightarrow|Rightarrow|begin|end|sin|cos|tan|csc|sec|cot|log|ln|to)\b/.test(processedText) || /[\^_]\{/.test(processedText);
  
  if (!processedText.includes("$") && hasMathCommands) {
    processedText = `$$${processedText.trim()}$$`;
  }

  const parts = processedText.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
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