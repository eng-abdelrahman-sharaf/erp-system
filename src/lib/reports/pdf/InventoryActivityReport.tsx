import React from "react";
import { Document, Page } from "@react-pdf/renderer";
import { ReportHeader } from "./components/ReportHeader";
import { ReportFooter } from "./components/ReportFooter";
import { SummarySection } from "./components/SummarySection";
import { ReportTable, Column } from "./components/ReportTable";
import { reportStyles } from "./components/styles";
import {
  InventoryActivityReportData,
  ReportFilters,
  InventoryActivityItem,
} from "../types";

interface InventoryActivityReportProps {
  data: InventoryActivityReportData;
  filters?: ReportFilters;
  generationDate?: string;
}

export const InventoryActivityReport: React.FC<
  InventoryActivityReportProps
> = ({ data, filters = {}, generationDate }) => {
  const { activities, summary } = data;

  const activityColumns: Column<InventoryActivityItem>[] = [
    {
      header: "Date",
      width: "11%",
      render: (r) => {
        if (!r.date) return "-";
        const d = new Date(r.date);
        return `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 5)}`;
      },
    },
    {
      header: "Activity Type",
      width: "10%",
      render: (r) => {
        const typeMap: Record<string, string> = {
          addition: "Addition",
          manual_usage: "Usage",
          reservation: "Reservation",
          release: "Release",
          transfer_out: "Transfer (Out)",
          transfer_in: "Transfer (In)",
          transfer: "Transfer",
        };
        return typeMap[r.activity_type] || r.activity_type;
      },
    },
    {
      header: "Item",
      width: "13%",
      render: (r) => r.item_name,
    },
    {
      header: "SKU",
      width: "9%",
      render: (r) => r.sku,
    },
    {
      header: "Warehouse",
      width: "20%",
      render: (r) => {
        if (r.source_warehouse && r.destination_warehouse) {
          const side =
            r.activity_type === "transfer_out" ? "[Source]" : "[Dest]";
          return `${r.source_warehouse} -> ${r.destination_warehouse} ${side}`;
        }
        return r.warehouse_name;
      },
    },
    {
      header: "Quantity",
      width: "7%",
      align: "right",
      render: (r) => Number(r.quantity).toLocaleString(),
    },
    {
      header: "Prev Qty",
      width: "6%",
      align: "right",
      render: (r) => Number(r.previous_quantity).toLocaleString(),
    },
    {
      header: "New Qty",
      width: "6%",
      align: "right",
      render: (r) => Number(r.new_quantity).toLocaleString(),
    },
    {
      header: "Related Order",
      width: "9%",
      render: (r) => r.related_order || "-",
    },
    {
      header: "Performed By",
      width: "9%",
      render: (r) => r.performed_by || "System",
    },
  ];

  const summaryItems = [
    {
      label: "Stock Added",
      value: Number(summary.totalAdded).toLocaleString(),
    },
    {
      label: "Stock Used",
      value: Number(summary.totalUsed).toLocaleString(),
    },
    {
      label: "Stock Reserved",
      value: Number(summary.totalReserved).toLocaleString(),
    },
    {
      label: "Stock Released",
      value: Number(summary.totalReleased).toLocaleString(),
    },
    {
      label: "Stock Transferred",
      value: Number(summary.totalTransferred).toLocaleString(),
    },
  ];

  return (
    <Document title="Inventory Activity Report" author="ERP System">
      <Page size="A4" orientation="landscape" style={reportStyles.page}>
        <ReportHeader
          title="Inventory Activity & Stock Movements Report"
          filters={filters}
          generationDate={generationDate}
        />

        <SummarySection
          title="Stock Movement Activity Totals"
          items={summaryItems}
        />

        <ReportTable<InventoryActivityItem>
          title="Historical Inventory Activities & Transfers"
          columns={activityColumns}
          data={activities}
          emptyMessage="No inventory activities recorded for the selected criteria."
        />

        <ReportFooter />
      </Page>
    </Document>
  );
};
