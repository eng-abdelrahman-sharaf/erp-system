import React from "react";
import { Document, Page } from "@react-pdf/renderer";
import { ReportHeader } from "./components/ReportHeader";
import { ReportFooter } from "./components/ReportFooter";
import { SummarySection } from "./components/SummarySection";
import { ReportTable, Column } from "./components/ReportTable";
import { reportStyles } from "./components/styles";
import {
  OrdersReportData,
  ReportFilters,
  OrderItem,
  AssignedInventoryItem,
} from "../types";

interface OrdersReportProps {
  data: OrdersReportData;
  filters?: ReportFilters;
  generationDate?: string;
}

export const OrdersReport: React.FC<OrdersReportProps> = ({
  data,
  filters = {},
  generationDate,
}) => {
  const { orders, assignedInventory, summary } = data;

  const orderColumns: Column<OrderItem>[] = [
    {
      header: "Order No.",
      width: "16%",
      render: (r) => r.order_number,
    },
    {
      header: "Title",
      width: "22%",
      render: (r) => r.title,
    },
    {
      header: "Client",
      width: "20%",
      render: (r) => r.client_name,
    },
    {
      header: "Assigned Employee",
      width: "18%",
      render: (r) => r.employee_name || "Unassigned",
    },
    {
      header: "Order Date",
      width: "12%",
      render: (r) => r.order_date,
    },
    {
      header: "Status",
      width: "12%",
      render: (r) => {
        const statusMap: Record<string, string> = {
          pending: "Pending",
          in_progress: "In Progress",
          paid: "Paid",
          cancelled: "Cancelled",
        };
        return statusMap[r.status] || r.status;
      },
    },
  ];

  const assignedInventoryColumns: Column<AssignedInventoryItem>[] = [
    {
      header: "Order No.",
      width: "18%",
      render: (r) => r.order_number,
    },
    {
      header: "Item",
      width: "24%",
      render: (r) => r.item_name,
    },
    {
      header: "SKU",
      width: "18%",
      render: (r) => r.sku,
    },
    {
      header: "Warehouse",
      width: "20%",
      render: (r) => r.warehouse_name,
    },
    {
      header: "Quantity",
      width: "10%",
      align: "right",
      render: (r) => Number(r.quantity).toLocaleString(),
    },
    {
      header: "Unit",
      width: "10%",
      render: (r) => r.unit,
    },
  ];

  const summaryItems = [
    { label: "Total Orders", value: summary.totalOrders },
    { label: "Pending", value: summary.pendingOrders },
    { label: "In Progress", value: summary.inProgressOrders },
    { label: "Paid", value: summary.paidOrders },
    { label: "Cancelled", value: summary.cancelledOrders },
  ];

  return (
    <Document title="Orders Report" author="ERP System">
      <Page size="A4" orientation="landscape" style={reportStyles.page}>
        <ReportHeader
          title="Orders & Assigned Inventory Report"
          filters={filters}
          generationDate={generationDate}
        />

        <SummarySection title="Order Summary Totals" items={summaryItems} />

        <ReportTable<OrderItem>
          title="Table 1: Customer Orders"
          columns={orderColumns}
          data={orders}
          emptyMessage="No customer orders found for the selected criteria."
        />

        <ReportTable<AssignedInventoryItem>
          title="Table 2: Assigned Inventory"
          columns={assignedInventoryColumns}
          data={assignedInventory}
          emptyMessage="No assigned inventory records found for the selected criteria."
        />

        <ReportFooter />
      </Page>
    </Document>
  );
};
