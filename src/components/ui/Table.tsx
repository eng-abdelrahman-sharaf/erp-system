import { cn } from "@/lib/utils/cn";
import { HTMLAttributes } from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface TableProps<T> extends HTMLAttributes<HTMLTableElement> {
  columns?: Column<T>[];
  data?: T[];
  className?: string;
}

export function Table<T>({
  columns,
  data,
  className,
  children,
  ...props
}: TableProps<T>) {
  // If columns and data are provided, use the structured table
  if (columns && data) {
    return (
      <div className={cn("overflow-x-auto", className)}>
        <table className="w-full border-collapse" {...props}>
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-900"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 text-sm text-gray-700"
                  >
                    {column.render
                      ? column.render(row)
                      : String(
                          (row as Record<string, unknown>)[column.key] ?? "",
                        )}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // Otherwise, render as a regular table with children
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse" {...props}>
        {children}
      </table>
    </div>
  );
}
