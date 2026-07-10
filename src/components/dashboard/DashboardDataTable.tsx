"use client";

import type { ReactNode } from "react";

export type SortOrder = "asc" | "desc";

export function MaterialIcon({
  children,
  className = "",
  filled = false,
}: {
  children: string;
  className?: string;
  filled?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
    >
      {children}
    </span>
  );
}

export function SortButton<T extends string>({
  field,
  active,
  order,
  onSort,
  children,
}: {
  field: T;
  active: T;
  order: SortOrder;
  onSort: (field: T) => void;
  children: ReactNode;
}) {
  const activeField = active === field;

  return (
    <button
      type="button"
      className="inline-flex min-h-9 items-center gap-xs rounded-lg text-[13px] font-extrabold uppercase text-current transition hover:text-white/90 focus:outline-none focus:ring-2 focus:ring-white/45"
      onClick={() => onSort(field)}
    >
      {children}
      <MaterialIcon className="text-[16px]">
        {activeField ? (order === "asc" ? "keyboard_arrow_up" : "keyboard_arrow_down") : "unfold_more"}
      </MaterialIcon>
    </button>
  );
}

export function LoadingState({ label = "Memuat data" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[220px] w-full items-center justify-center rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-sm"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
        <span className="size-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
      </div>
    </div>
  );
}

export function EmptyState({ title, text, icon = "inbox" }: { title: string; text: string; icon?: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-lowest p-xl text-center">
      <MaterialIcon filled className="mb-sm text-5xl text-outline">
        {icon}
      </MaterialIcon>
      <p className="font-bold text-on-surface">{title}</p>
      <p className="mt-xs max-w-md text-sm text-on-surface-variant">{text}</p>
    </div>
  );
}

export function paginationItems(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 3) return [1, 2, 3, "ellipsis", totalPages];
  if (currentPage >= totalPages - 2) return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  return [1, "ellipsis", currentPage, "ellipsis", totalPages];
}

export function DataTablePagination({
  page,
  pageSize,
  total,
  totalPages,
  loading,
  itemLabel,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  loading: boolean;
  itemLabel: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const firstVisible = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisible = Math.min(page * pageSize, total);

  return (
    <div className="shrink-0 flex flex-col gap-md border-t border-outline-variant/20 bg-gradient-to-r from-primary/5 via-surface-container-lowest to-sky-50/45 p-md lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm text-on-surface-variant">
        Menampilkan <span className="font-extrabold text-on-surface">{firstVisible.toLocaleString("id-ID")}</span>{" "}
        sampai <span className="font-extrabold text-on-surface">{lastVisible.toLocaleString("id-ID")}</span> dari{" "}
        <span className="font-extrabold text-on-surface">{total.toLocaleString("id-ID")}</span> {itemLabel}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-xs">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1 || loading}
          aria-label="Halaman sebelumnya"
          className="inline-flex size-11 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-on-surface-variant shadow-sm transition hover:bg-surface-container hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <MaterialIcon className="text-[17px]">chevron_left</MaterialIcon>
        </button>

        {paginationItems(page, totalPages).map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex size-11 items-center justify-center rounded-xl text-sm font-extrabold text-on-surface-variant"
            >
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              disabled={loading || item === page}
              aria-current={item === page ? "page" : undefined}
              className={`inline-flex size-11 items-center justify-center rounded-xl border text-sm font-extrabold shadow-sm transition ${
                item === page
                  ? "border-secondary-container bg-secondary-container text-on-secondary-container"
                  : "border-outline-variant/20 bg-surface-container-lowest text-on-surface hover:bg-surface-container"
              } disabled:cursor-not-allowed`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || loading}
          aria-label="Halaman berikutnya"
          className="inline-flex size-11 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-on-surface-variant shadow-sm transition hover:bg-surface-container hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <MaterialIcon className="text-[17px]">chevron_right</MaterialIcon>
        </button>
      </div>

      <label className="flex items-center gap-sm text-sm font-semibold text-on-surface-variant">
        Tampilkan:
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="min-h-11 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-md py-2 text-sm font-extrabold text-on-surface shadow-sm outline-none"
        >
          {[10, 20, 50, 100].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
