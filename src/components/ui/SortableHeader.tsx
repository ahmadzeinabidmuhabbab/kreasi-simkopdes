// ── SortableHeader ────────────────────────────────────────────────────────────
// A <th> replacement that shows a sort icon and handles click-to-sort.
// Usage:
//   <SortableHeader label="Nama" colKey="name" current={sortKey} dir={sortDir} onSort={toggleSort} />

import React from "react";
import { SortDir } from "@/hooks/useSortable";

interface Props<K extends string> {
  label: string;
  colKey: K;
  current: K | null;
  dir: SortDir;
  onSort: (key: K) => void;
  className?: string;
}

export function SortableHeader<K extends string>({
  label, colKey, current, dir, onSort, className = "",
}: Props<K>) {
  const isActive = current === colKey;
  const icon =
    !isActive || dir === null ? "unfold_more"
    : dir === "asc"           ? "keyboard_arrow_up"
    :                           "keyboard_arrow_down";

  return (
    <th
      onClick={() => onSort(colKey)}
      className={`text-left px-md py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap cursor-pointer select-none group ${className}`}
    >
      <div className="flex items-center gap-xs">
        <span className={`${isActive ? "text-primary" : ""} transition-colors group-hover:text-primary`}>{label}</span>
        <span
          className={`material-symbols-outlined text-[14px] transition-all ${
            isActive ? "text-primary opacity-100" : "opacity-30 group-hover:opacity-60"
          }`}
        >
          {icon}
        </span>
      </div>
    </th>
  );
}
