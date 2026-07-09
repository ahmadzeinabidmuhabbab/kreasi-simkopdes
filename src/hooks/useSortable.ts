// ── useSortable ──────────────────────────────────────────────────────────────
// Generic sort hook for table columns.
// Usage:
//   const { sorted, sortKey, sortDir, toggleSort } = useSortable(data, "name");
//   // In JSX: <SortableHeader label="Name" colKey="name" current={sortKey} dir={sortDir} onSort={toggleSort} />

import { useState, useMemo } from "react";

export type SortDir = "asc" | "desc" | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useSortable<T extends Record<string, any>>(
  data: T[],
  defaultKey: keyof T | null = null
) {
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultKey ? "asc" : null);

  const toggleSort = (key: keyof T) => {
    if (sortKey === key) {
      // cycle: asc → desc → null
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") { setSortDir(null); setSortKey(null); }
      else { setSortDir("asc"); }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      // numeric
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }
      // string
      const sa = String(va ?? "").toLowerCase();
      const sb = String(vb ?? "").toLowerCase();
      if (sa < sb) return sortDir === "asc" ? -1 : 1;
      if (sa > sb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir]);

  return { sorted, sortKey, sortDir, toggleSort };
}
