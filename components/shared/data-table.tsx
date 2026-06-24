import * as React from "react";

import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  /** Rendered when there are no rows (e.g. an <EmptyState />). */
  empty?: React.ReactNode;
  className?: string;
}

// Brand data table: black header row, alternating cream-soft rows, dotted rules.
// Collapses to stacked label:value cards below the `sm` breakpoint.
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  empty,
  className,
}: DataTableProps<T>) {
  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <div
      data-slot="data-table"
      className={cn(
        "w-full overflow-hidden rounded-xl border border-dotted border-border bg-card",
        className
      )}
    >
      {/* Desktop */}
      <table className="hidden w-full text-sm sm:table">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "px-3 py-2.5 text-left font-medium whitespace-nowrap",
                  c.headerClassName
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={getRowKey(row)}
              className={cn(
                "border-t border-dotted border-border",
                i % 2 === 1 && "bg-cream-soft"
              )}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn("px-3 py-2.5 align-middle", c.className)}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: stacked label:value cards */}
      <div className="divide-y divide-dotted divide-border sm:hidden">
        {rows.map((row) => (
          <div key={getRowKey(row)} className="flex flex-col gap-1.5 p-3">
            {columns.map((c) => (
              <div key={c.key} className="flex items-start justify-between gap-3">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {c.header}
                </span>
                <span className="min-w-0 text-right text-sm">{c.cell(row)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
