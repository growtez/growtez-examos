"use client";

import React from "react";

const FORMULA_GROUPS = [
  {
    label: "Trig",
    items: [
      { label: "sin", insert: "\\sin()" },
      { label: "cos", insert: "\\cos()" },
      { label: "tan", insert: "\\tan()" },
      { label: "cosec", insert: "\\csc()" },
      { label: "sec", insert: "\\sec()" },
      { label: "cot", insert: "\\cot()" },
      { label: "sin-1", insert: "\\sin^{-1}()" },
      { label: "cos-1", insert: "\\cos^{-1}()" },
    ],
  },
  {
    label: "Calculus",
    items: [
      { label: "d/dx", insert: "\\frac{d}{dx}()" },
      { label: "d2/dx2", insert: "\\frac{d^2}{dx^2}()" },
      { label: "int dx", insert: "\\int () \\, dx" },
      { label: "int ab", insert: "\\int_{a}^{b} () \\, dx" },
      { label: "lim", insert: "\\lim_{x \\to }" },
      { label: "Sum", insert: "\\sum_{i=0}^{n} " },
      { label: "Product", insert: "\\prod_{i=0}^{n} " },
    ],
  },
  {
    label: "Algebra",
    items: [
      { label: "x^2", insert: "x^{2}" },
      { label: "x^n", insert: "x^{n}" },
      { label: "sqrt", insert: "\\sqrt{}" },
      { label: "nthrt", insert: "\\sqrt[n]{}" },
      { label: "a/b", insert: "\\frac{a}{b}" },
      { label: "|x|", insert: "|x|" },
      { label: "log", insert: "\\log_{}" },
      { label: "ln", insert: "\\ln()" },
    ],
  },
  {
    label: "Symbols",
    items: [
      { label: "pi", insert: "\\pi" },
      { label: "inf", insert: "\\infty" },
      { label: "alpha", insert: "\\alpha" },
      { label: "beta", insert: "\\beta" },
      { label: "theta", insert: "\\theta" },
      { label: "lambda", insert: "\\lambda" },
      { label: "+-", insert: "\\pm" },
      { label: "<=", insert: "\\leq" },
      { label: ">=", insert: "\\geq" },
      { label: "!=", insert: "\\neq" },
      { label: "->", insert: "\\rightarrow" },
      { label: "=>", insert: "\\Rightarrow" },
    ],
  },
];

interface FormulaToolbarProps {
  onInsert: (text: string) => void;
  compact?: boolean;
}

export default function FormulaToolbar({ onInsert, compact = false }: FormulaToolbarProps) {
  const [activeGroup, setActiveGroup] = React.useState(0);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="flex border-b border-border bg-bg">
        <span className="flex items-center px-3 py-1.5 text-[10px] font-bold text-accent-primary shrink-0 border-r border-border">
          Fx
        </span>
        {FORMULA_GROUPS.map((group, idx) => (
          <button
            key={group.label}
            type="button"
            onClick={() => setActiveGroup(idx)}
            className={`px-3 py-1.5 text-[10px] font-bold transition-colors whitespace-nowrap border-none cursor-pointer ${
              activeGroup === idx
                ? "bg-accent-primary/10 text-accent-primary"
                : "text-text-muted hover:text-text-main hover:bg-surface"
            }`}
          >
            {group.label}
          </button>
        ))}
      </div>
      <div className={`flex flex-wrap gap-1 p-2 ${compact ? "max-h-[52px]" : "max-h-[68px]"} overflow-y-auto`}>
        {FORMULA_GROUPS[activeGroup].items.map((item) => (
          <button
            key={item.label}
            type="button"
            title={`Insert: ${item.insert}`}
            onClick={() => onInsert(item.insert)}
            className="px-2 py-1 text-[11px] font-mono bg-bg border border-border rounded-lg hover:bg-accent-primary/10 hover:border-accent-primary/40 hover:text-accent-primary transition-all text-text-main cursor-pointer active:scale-95"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}