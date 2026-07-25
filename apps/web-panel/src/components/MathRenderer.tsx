"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

interface MathRendererProps {
  text: string;
  className?: string;
}

/**
 * Normalizes and wraps bare LaTeX expressions into $...$ or $$...$$ delimiters
 * so KaTeX can render them properly even when the user didn't manually type $ or $$.
 */
function autoWrapBareLatex(text: string): string {
  if (!text) return "";

  // 1. Convert LaTeX native block delimiters \[...\] → $$...$$ and inline \(...\) → $...$
  let processed = text
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

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
      return `$$${part.trim()}$$`;
    }

    // Regex to match a complete LaTeX command structure:
    // 1. A LaTeX command (e.g. \frac, \sqrt, \int, \sum, \lim, \alpha, \vec, etc.)
    // 2. Followed by any sequence of arguments:
    //    - optional brackets [arg]
    //    - brace groups {arg} (including nested braces)
    //    - parenthesized args (arg)
    //    - superscripts ^arg or ^{arg}
    //    - subscripts _arg or _{arg}
    // 3. Or bare superscript/subscripts attached to numbers/variables, e.g. x^{2}, a_{i}
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

export default function MathRenderer({ text, className }: MathRendererProps) {
  const processedText = autoWrapBareLatex(text || "");

  // Split into math parts ($$...$$ or $...$) and plain text
  const finalParts = processedText.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);

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
  try {
    const html = katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      output: "htmlAndMathml",
      fleqn: true,
    });

    return (
      <span
        className={displayMode ? "block my-2 text-left overflow-x-auto" : "inline"}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return <span className="text-red-500 text-xs font-mono">{raw}</span>;
  }
}