import React from "react";
import { Document, Page } from "@react-pdf/renderer";
import { ReportHeader } from "./components/ReportHeader";
import { ReportFooter } from "./components/ReportFooter";
import { SummarySection } from "./components/SummarySection";
import { ReportTable, Column } from "./components/ReportTable";
import { reportStyles } from "./components/styles";
import {
  EmployeeReportData,
  ReportFilters,
  EmployeeInfoItem,
  EmployeeAssignedOrderItem,
  EmployeePayrollSummaryItem,
} from "../types";

interface EmployeeReportProps {
  data: EmployeeReportData;
  filters?: ReportFilters;
  generationDate?: string;
}

export const EmployeeReport: React.FC<EmployeeReportProps> = ({
  data,
  filters = {},
  generationDate,
}) => {
  const { employees, assignedOrders, payrollSummary, summary } = data;

  const employeeColumns: Column<EmployeeInfoItem>[] = [
    {
      header: "Employee ID",
      width: "12%",
      render: (r) => (r.employee_id ? r.employee_id.slice(0, 8) : "-"),
    },
    {
      header: "Full Name",
      width: "18%",
      render: (r) => r.full_name,
    },
    {
      header: "Email",
      width: "18%",
      render: (r) => r.email,
    },
    {
      header: "Phone",
      width: "14%",
      render: (r) => r.phone,
    },
    {
      header: "Position",
      width: "14%",
      render: (r) => r.position,
    },
    {
      header: "Salary",
      width: "10%",
      align: "right",
      render: (r) =>
        `$${Number(r.salary).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      header: "Employment Date",
      width: "8%",
      render: (r) => r.employment_date,
    },
    {
      header: "Status",
      width: "6%",
      align: "center",
      render: (r) => (r.status === "active" ? "Active" : "Inactive"),
    },
  ];

  const assignedOrderColumns: Column<EmployeeAssignedOrderItem>[] = [
    {
      header: "Employee",
      width: "20%",
      render: (r) => r.employee_name,
    },
    {
      header: "Order No.",
      width: "16%",
      render: (r) => r.order_number,
    },
    {
      header: "Title",
      width: "24%",
      render: (r) => r.title,
    },
    {
      header: "Client",
      width: "20%",
      render: (r) => r.client_name,
    },
    {
      header: "Status",
      width: "10%",
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
    {
      header: "Order Date",
      width: "10%",
      render: (r) => r.order_date,
    },
  ];

  const payrollSummaryColumns: Column<EmployeePayrollSummaryItem>[] = [
    {
      header: "Employee",
      width: "25%",
      render: (r) => r.employee_name,
    },
    {
      header: "Salary",
      width: "18%",
      align: "right",
      render: (r) =>
        `$${Number(r.salary).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      header: "Payroll Period",
      width: "23%",
      render: (r) => r.payroll_period,
    },
    {
      header: "Total Paid",
      width: "17%",
      align: "right",
      render: (r) =>
        `$${Number(r.total_paid).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      header: "Outstanding",
      width: "17%",
      align: "right",
      render: (r) =>
        `$${Number(r.outstanding).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
  ];

  const summaryItems = [
    { label: "Total Employees", value: summary.totalEmployees },
    { label: "Active Employees", value: summary.activeEmployees },
    {
      label: "Total Salary Payments",
      value: `$${Number(summary.totalSalaryPayments).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      label: "Outstanding Payroll",
      value: `$${Number(summary.outstandingPayroll).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
  ];

  return (
    <Document title="Employee Report" author="ERP System">
      <Page size="A4" orientation="landscape" style={reportStyles.page}>
        <ReportHeader
          title="Employees, Assigned Orders & Payroll Report"
          filters={filters}
          generationDate={generationDate}
        />

        <SummarySection title="Employee Overview Totals" items={summaryItems} />

        <ReportTable<EmployeeInfoItem>
          title="Table 1: Employees Directory"
          columns={employeeColumns}
          data={employees}
          emptyMessage="No employees found for the selected criteria."
        />

        <ReportTable<EmployeeAssignedOrderItem>
          title="Table 2: Assigned Customer Orders"
          columns={assignedOrderColumns}
          data={assignedOrders}
          emptyMessage="No assigned orders found for the selected employee(s)."
        />

        <ReportTable<EmployeePayrollSummaryItem>
          title="Table 3: Payroll Summary & Outstanding Balances"
          columns={payrollSummaryColumns}
          data={payrollSummary}
          emptyMessage="No payroll records found for the selected employee(s)."
        />

        <ReportFooter />
      </Page>
    </Document>
  );
};
