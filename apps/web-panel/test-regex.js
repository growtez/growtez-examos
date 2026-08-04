const text = 'a = 4\\,\\mathrm{m\\,s^{-2}}. If the particle travels... t = 8\\,\\mathrm{s}. find the displacement s = ut + \\frac{1}{2}at^2';
function autoWrapBareLatex(text, inline = false) {
  if (!text) return '';
  let processed = text;
  if (inline) {
    processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, '$$$$1$$').replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$').replace(/\\\(([\s\S]*?)\\\)/g, '$$$$1$$');
  } else {
    processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$$$$1$$$$$$$$').replace(/\\\(([\s\S]*?)\\\)/g, '$$$$1$$');
  }
  const rawParts = processed.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);
  const ARG_GROUP = `(?:\\s*(?:\\[[^\\]]*\\]|\\{(?:[^{}]|\\{[^{}]*\\})*\\}|\\([^)]*\\)|[\\^_](?:[a-zA-Z0-9]+|\\{(?:[^{}]|\\{[^{}]*\\})*\\})))*`;
  const BARE_EXPR_RE = new RegExp(`(\\\\[a-zA-Z]+${ARG_GROUP}|\\\\[^a-zA-Z0-9\\s]|(?:[a-zA-Z0-9]|\\)|\\\]|\\})[\\^_](?:[a-zA-Z0-9]+|\\{(?:[^{}]|\\{[^{}]*\\})*\\}))`, 'g');
  const processedParts = rawParts.map((part) => {
    if ((part.startsWith('$$') && part.endsWith('$$')) || (part.startsWith('$') && part.endsWith('$'))) {
      return part;
    }
    if (!/\\|[\^_]\{/.test(part)) return part;
    if (part.includes('\\begin{') && part.includes('\\end{')) return inline ? '$' + part.trim() + '$' : '$$' + part.trim() + '$$';
    return part.replace(BARE_EXPR_RE, (match) => {
      const trimmed = match.trim();
      if (!trimmed) return match;
      return '$' + trimmed + '$';
    });
  });
  return processedParts.join('');
}
console.log(autoWrapBareLatex(text));
