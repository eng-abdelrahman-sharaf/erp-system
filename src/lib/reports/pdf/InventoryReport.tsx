import React from "react";
import { Document, Page } from "@react-pdf/renderer";
import { ReportHeader } from "./components/ReportHeader";
import { ReportFooter } from "./components/ReportFooter";
import { SummarySection } from "./components/SummarySection";
import { ReportTable, Column } from "./components/ReportTable";
import { reportStyles } from "./components/styles";
import {
  InventoryReportData,
  ReportFilters,
  InventoryStockItem,
  LowStockItem,
} from "../types";

interface InventoryReportProps {
  data: InventoryReportData;
  filters?: ReportFilters;
  generationDate?: string;
}

export const InventoryReport: React.FC<InventoryReportProps> = ({
  data,
  filters = {},
  generationDate,
}) => {
  const { stock, lowStockItems, summary } = data;

  const stockColumns: Column<InventoryStockItem>[] = [
    {
      header: "SKU",
      width: "14%",
      render: (r) => r.sku,
    },
    {
      header: "Item",
      width: "22%",
      render: (r) => r.item_name,
    },
    {
      header: "Warehouse",
      width: "18%",
      render: (r) => r.warehouse_name,
    },
    {
      header: "Total Quantity",
      width: "11%",
      align: "right",
      render: (r) => Number(r.total_quantity).toLocaleString(),
    },
    {
      header: "Available",
      width: "11%",
      align: "right",
      render: (r) => Number(r.available_quantity).toLocaleString(),
    },
    {
      header: "Reserved",
      width: "11%",
      align: "right",
      render: (r) => Number(r.reserved_quantity).toLocaleString(),
    },
    {
      header: "Used",
      width: "7%",
      align: "right",
      render: (r) => Number(r.used_quantity).toLocaleString(),
    },
    {
      header: "Unit",
      width: "6%",
      align: "center",
      render: (r) => r.unit,
    },
  ];

  const lowStockColumns: Column<LowStockItem>[] = [
    {
      header: "Item",
      width: "35%",
      render: (r) => r.item_name,
    },
    {
      header: "Warehouse",
      width: "30%",
      render: (r) => r.warehouse_name,
    },
    {
      header: "Available Quantity",
      width: "18%",
      align: "right",
      render: (r) =>
        `${Number(r.available_quantity).toLocaleString()} ${r.unit}`,
    },
    {
      header: "Low-Stock Threshold",
      width: "17%",
      align: "right",
      render: (r) => `${Number(r.threshold).toLocaleString()} ${r.unit}`,
    },
  ];

  const summaryItems = [
    { label: "Total Items", value: summary.totalItems },
    { label: "Warehouses", value: summary.totalWarehouses },
    {
      label: "Total Stock",
      value: Number(summary.totalStock).toLocaleString(),
    },
    {
      label: "Available Stock",
      value: Number(summary.totalAvailableStock).toLocaleString(),
    },
    {
      label: "Reserved Stock",
      value: Number(summary.totalReservedStock).toLocaleString(),
    },
    {
      label: "Used Stock",
      value: Number(summary.totalUsedStock).toLocaleString(),
    },
  ];

  return (
    <Document title="Inventory Report" author="ERP System">
      <Page size="A4" orientation="landscape" style={reportStyles.page}>
        <ReportHeader
          title="Inventory Stock Position Report"
          filters={filters}
          generationDate={generationDate}
        />

        <SummarySection title="Stock Position Summary" items={summaryItems} />

        <ReportTable<InventoryStockItem>
          title="Table 1: Current Inventory Stock"
          columns={stockColumns}
          data={stock}
          emptyMessage="No inventory stock records found for the selected warehouse or criteria."
        />

        <ReportTable<LowStockItem>
          title="Table 2: Low-Stock Items (Below Threshold)"
          columns={lowStockColumns}
          data={lowStockItems}
          emptyMessage="No items are currently below the low-stock threshold."
        />

        <ReportFooter />
      </Page>
    </Document>
  );
};
