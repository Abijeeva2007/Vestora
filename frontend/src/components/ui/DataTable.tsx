import React from "react";

export interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  selectedId?: string;
  caption?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  selectedId,
  caption,
}: DataTableProps<T>) {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={caption || "Scrollable data table"}
      className="overflow-x-auto border border-neutral-200 rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-2 focus:ring-neutral-900"
    >
      <table className="w-full text-left text-sm border-collapse">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="bg-neutral-50/70 border-b border-neutral-200">
            {columns.map((col, idx) => (
              <th
                key={idx}
                scope="col"
                className={`px-4 py-3 text-xs font-semibold tracking-wider uppercase text-neutral-500 ${
                  col.className || ""
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {data.map((item) => {
            const id = keyExtractor(item);
            const isSelected = selectedId === id;
            return (
              <tr
                key={id}
                onClick={() => onRowClick && onRowClick(item)}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onRowClick(item);
                  }
                }}
                tabIndex={onRowClick ? 0 : undefined}
                aria-selected={isSelected}
                className={`transition-colors ${
                  onRowClick ? "cursor-pointer" : ""
                } ${
                  isSelected
                    ? "bg-neutral-100 font-medium text-neutral-950"
                    : "hover:bg-neutral-50/70 bg-white text-neutral-800"
                }`}
              >
                {columns.map((col, idx) => (
                  <td key={idx} className={`px-4 py-3.5 align-top ${col.className || ""}`}>
                    {col.accessor(item)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
