// Decode JSON stored inside string fields for viewing only. Never mutate the log.
export function formatAuditJson(raw: string): string {
  const expand = (value: unknown, depth: number): unknown => {
    if (depth >= 10) return value;
    if (typeof value === 'string' && /^[\[{\"]/.test(value.trim())) {
      try {
        const parsed: unknown = JSON.parse(value);
        if (parsed !== value) return expand(parsed, depth + 1);
      } catch {
        // Ordinary strings that resemble JSON remain unchanged.
      }
    }
    if (Array.isArray(value)) return value.map(item => expand(item, depth + 1));
    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          expand(item, depth + 1),
        ])
      );
    }
    return value;
  };
  return JSON.stringify(expand(JSON.parse(raw), 0), null, 2);
}
