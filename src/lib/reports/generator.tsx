import React from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { ReportType, ReportFilters } from "./types";
import { OrdersReport } from "./pdf/OrdersReport";
import { InventoryReport } from "./pdf/InventoryReport";
import { InventoryActivityReport } from "./pdf/InventoryActivityReport";
import { EmployeeReport } from "./pdf/EmployeeReport";
import { PayrollReport } from "./pdf/PayrollReport";

export function getReportDocument(
  type: ReportType,
  data: any,
  filters: ReportFilters = {},
  generationDate: string = new Date().toISOString(),
): React.ReactElement<DocumentProps> {
  switch (type) {
    case "orders":
      return (
        <OrdersReport
          data={data}
          filters={filters}
          generationDate={generationDate}
        />
      );
    case "inventory":
      return (
        <InventoryReport
          data={data}
          filters={filters}
          generationDate={generationDate}
        />
      );
    case "inventory-activity":
      return (
        <InventoryActivityReport
          data={data}
          filters={filters}
          generationDate={generationDate}
        />
      );
    case "employees":
      return (
        <EmployeeReport
          data={data}
          filters={filters}
          generationDate={generationDate}
        />
      );
    case "payroll":
      return (
        <PayrollReport
          data={data}
          filters={filters}
          generationDate={generationDate}
        />
      );
    default:
      throw new Error(`Unsupported report type: ${type}`);
  }
}

export async function generateReportBuffer(
  type: ReportType,
  data: any,
  filters: ReportFilters = {},
  generationDate: string = new Date().toISOString(),
): Promise<Buffer> {
  const doc = getReportDocument(type, data, filters, generationDate);
  return await renderToBuffer(doc);
}
