import { diffLines } from "diff";

export type DiffLine = { text: string; number: number };
export type DiffRow = { a?: DiffLine; b?: DiffLine; changed: boolean };
const lines = (text: string) => text.match(/[^\n]*\n|[^\n]+$/g) ?? [];

function ordered(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(ordered);
  if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, ordered(item)]));
  return value;
}

export function normalizedJsonPair(a: string, b: string): [string, string] | null {
  try { return [JSON.stringify(ordered(JSON.parse(a)), null, 2), JSON.stringify(ordered(JSON.parse(b)), null, 2)]; }
  catch { return null; }
}

export function compareText(a: string, b: string) {
  const changes = diffLines(a, b, { maxEditLength: 2000, timeout: 100 });
  const rows: DiffRow[] = [];
  let aNumber = 1, bNumber = 1;
  let removed: string[] = [], added: string[] = [];
  function flush() {
    for (let index = 0; index < Math.max(removed.length, added.length); index++) rows.push({
      a: index < removed.length ? { text: removed[index], number: aNumber++ } : undefined,
      b: index < added.length ? { text: added[index], number: bNumber++ } : undefined, changed: true,
    });
    removed = []; added = [];
  }
  if (!changes) { removed = lines(a); added = lines(b); flush(); }
  else for (const change of changes) {
    if (change.removed) removed.push(...lines(change.value));
    else if (change.added) added.push(...lines(change.value));
    else { flush(); for (const text of lines(change.value)) rows.push({ a: { text, number: aNumber++ }, b: { text, number: bNumber++ }, changed: false }); }
  }
  flush();
  return { rows, simplified: !changes, additions: rows.filter((row) => row.changed && row.b).length, deletions: rows.filter((row) => row.changed && row.a).length };
}
