import katex from "katex";
import "katex/dist/katex.min.css";

interface MathRendererProps {
  text: string;
  className?: string;
}

/**
 * MathRenderer
 * Renders plain text mixed with LaTeX expressions.
 * Inline:  $\sin(x)$
 * Block:   $$\int_0^1 x^2\,dx$$
 */
export default function MathRenderer({ text, className }: MathRendererProps) {
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const latex = part.slice(2, -2).trim();
          return <KatexSpan key={i} latex={latex} displayMode={true} raw={part} />;
        } else if (part.startsWith("$") && part.endsWith("$")) {
          const latex = part.slice(1, -1).trim();
          return <KatexSpan key={i} latex={latex} displayMode={false} raw={part} />;
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

function KatexSpan({
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
    });
    return (
      <span
        className={displayMode ? "block my-1 text-center" : "inline"}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return <span className="text-red-500 font-mono text-xs">{raw}</span>;
  }
}