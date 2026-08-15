/**
 * Robustly parses custom exam instructions into an array of non-empty strings.
 * Handles string[], JSON string array, Postgres array string `{item1, item2}`,
 * multiline text, or single string values.
 */
export function parseExamInstructions(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    
    // Try JSON.parse if string starts with '['
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item).trim()).filter(Boolean);
        }
      } catch (_) {}
    }

    // Try Postgres array literal like {"item 1", "item 2"} or {item 1, item 2}
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const content = trimmed.slice(1, -1);
      const items = content.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(s => s.replace(/^"|"$/g, '').trim());
      return items.filter(Boolean);
    }

    // Fallback: split by newline or return single item
    return trimmed.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}
