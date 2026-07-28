"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

interface MathRendererProps {
  text: string;
  className?: string;
  inline?: boolean;
}

/**
 * Normalizes and wraps bare LaTeX expressions into $...$ or $$...$$ delimiters
 * so KaTeX can render them properly even when the user didn't manually type $ or $$.
 */
function autoWrapBareLatex(text: string, inline = false): string {
  if (!text) return "";

  // 1. Convert LaTeX native block delimiters \[...\] → $$...$$ and inline \(...\) → $...$
  let processed = text;
  if (inline) {
    processed = processed
      .replace(/\$\$([\s\S]*?)\$\$/g, '$$$1$$')
      .replace(/\\\[([\s\S]*?)\\\]/g, '$$$1$$')
      .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
  } else {
    processed = processed
      .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
      .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
  }

  // If text already contains explicit $ delimiters, leave delimited parts as-is and process plain segments.
  const rawParts = processed.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);

  const processedParts = rawParts.map((part) => {
    // If it's already enclosed in $ or $$, keep it intact
    if (
      (part.startsWith("$$") && part.endsWith("$$")) ||
      (part.startsWith("$") && part.endsWith("$"))
    ) {
      return part;
    }

    // Check if segment has any LaTeX commands or math syntax
    if (!/\\|[\^_]\{/.test(part)) {
      return part;
    }

    // If segment contains matrix or array environments, wrap in block math $$...$$
    if (part.includes("\\begin{") && part.includes("\\end{")) {
      return inline ? `$${part.trim()}$` : `$$${part.trim()}$$`;
    }

    const ARG_GROUP = `(?:\\s*(?:\\[[^\\]]*\\]|\\{(?:[^{}]|\\{[^{}]*\\})*\\}|\\([^)]*\\)|[\\^_](?:[a-zA-Z0-9]+|\\{(?:[^{}]|\\{[^{}]*\\})*\\})))*`;
    
    const BARE_EXPR_RE = new RegExp(
      `(\\\\[a-zA-Z]+${ARG_GROUP}|\\\\[^a-zA-Z0-9\\s]|(?:[a-zA-Z0-9]|\\)|\\\]|\\})[\\^_](?:[a-zA-Z0-9]+|\\{(?:[^{}]|\\{[^{}]*\\})*\\}))`,
      'g'
    );

    return part.replace(BARE_EXPR_RE, (match) => {
      const trimmed = match.trim();
      if (!trimmed) return match;
      return `$${trimmed}$`;
    });
  });

  return processedParts.join("");
}

export default function MathRenderer({ text, className, inline = false }: MathRendererProps) {
  const processedText = autoWrapBareLatex(text || "", inline);

  // Split into math parts ($$...$$ or $...$) and plain text
  const finalParts = processedText.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);

  return (
    <span className={className}>
      {finalParts.map((part, i) => {
        if (!inline && part.startsWith("$$") && part.endsWith("$$")) {
          const latex = part.slice(2, -2).trim();
          return <MathBlock key={i} latex={latex} displayMode={true} raw={part} />;
        } else if (part.startsWith("$$") && part.endsWith("$$")) {
          const latex = part.slice(2, -2).trim();
          return <MathBlock key={i} latex={latex} displayMode={false} raw={part} />;
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
  try {
    const html = katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: "htmlAndMathml",
      fleqn: true,
    });

    return (
      <span
        className={displayMode ? "block my-2 text-left overflow-x-auto" : "inline-block align-baseline"}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return <span className="text-red-500 text-xs font-mono">{raw}</span>;
  }
}