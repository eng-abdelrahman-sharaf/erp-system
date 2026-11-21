import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { reportStyles } from "./styles";

export interface Column<T = any> {
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (row: T, index: number) => string | number;
}

interface ReportTableProps<T = any> {
  title?: string;
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export const ReportTable = <T extends Record<string, any>>({
  title,
  columns,
  data,
  emptyMessage = "No records found",
}: ReportTableProps<T>) => {
  // Default equal widths if width not specified
  const defaultWidth = `${100 / columns.length}%`;

  return (
    <View style={reportStyles.tableContainer}>
      {title && <Text style={reportStyles.sectionTitle}>{title}</Text>}

      {/* Table Header - 'fixed' prop repeats the header on every page */}
      <View style={reportStyles.tableHeaderRow} fixed>
        {columns.map((col, idx) => (
          <View
            key={idx}
            style={{
              width: col.width || defaultWidth,
              alignItems:
                col.align === "right"
                  ? "flex-end"
                  : col.align === "center"
                    ? "center"
                    : "flex-start",
            }}
          >
            <Text
              style={[
                reportStyles.tableHeaderCell,
                {
                  textAlign: col.align || "left",
                },
              ]}
            >
              {col.header}
            </Text>
          </View>
        ))}
      </View>

      {/* Data Rows or Empty State */}
      {data.length === 0 ? (
        <View style={reportStyles.emptyStateBox}>
          <Text style={reportStyles.emptyStateText}>{emptyMessage}</Text>
        </View>
      ) : (
        data.map((row, rowIndex) => (
          <View
            key={rowIndex}
            style={[
              reportStyles.tableRow,
              rowIndex % 2 === 1
                ? reportStyles.tableRowEven
                : reportStyles.tableRowOdd,
            ]}
            wrap={false}
          >
            {columns.map((col, colIndex) => {
              const val = col.render
                ? col.render(row, rowIndex)
                : row[col.header.toLowerCase().replace(/[^a-z0-9]/g, "_")] ??
                  "-";

              return (
                <View
                  key={colIndex}
                  style={{
                    width: col.width || defaultWidth,
                    alignItems:
                      col.align === "right"
                        ? "flex-end"
                        : col.align === "center"
                          ? "center"
                          : "flex-start",
                  }}
                >
                  <Text
                    style={[
                      reportStyles.tableCell,
                      {
                        textAlign: col.align || "left",
                      },
                    ]}
                  >
                    {val === null || val === undefined || val === ""
                      ? "-"
                      : String(val)}
                  </Text>
                </View>
              );
            })}
          </View>
        ))
      )}
    </View>
  );
};
