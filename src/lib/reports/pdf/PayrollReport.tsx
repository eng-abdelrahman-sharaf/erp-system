import React from "react";
import { Document, Page } from "@react-pdf/renderer";
import { ReportHeader } from "./components/ReportHeader";
import { ReportFooter } from "./components/ReportFooter";
import { SummarySection } from "./components/SummarySection";
import { ReportTable, Column } from "./components/ReportTable";
import { reportStyles } from "./components/styles";
import {
  PayrollReportData,
  ReportFilters,
  SalaryPaymentItem,
  PayrollBalanceItem,
} from "../types";

interface PayrollReportProps {
  data: PayrollReportData;
  filters?: ReportFilters;
  generationDate?: string;
}

export const PayrollReport: React.FC<PayrollReportProps> = ({
  data,
  filters = {},
  generationDate,
}) => {
  const { salaryPayments, payrollBalances, summary } = data;

  const paymentColumns: Column<SalaryPaymentItem>[] = [
    {
      header: "Employee",
      width: "18%",
      render: (r) => r.employee_name,
    },
    {
      header: "Payroll Period",
      width: "16%",
      render: (r) => r.payroll_period,
    },
    {
      header: "Salary",
      width: "11%",
      align: "right",
      render: (r) =>
        `$${Number(r.salary).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      header: "Amount Paid",
      width: "11%",
      align: "right",
      render: (r) =>
        `$${Number(r.amount_paid).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      header: "Payment Date",
      width: "11%",
      render: (r) => r.payment_date,
    },
    {
      header: "Payment Method",
      width: "12%",
      render: (r) => {
        const methodMap: Record<string, string> = {
          bank_transfer: "Bank Transfer",
          cash: "Cash",
          cheque: "Cheque",
        };
        return methodMap[r.payment_method] || r.payment_method;
      },
    },
    {
      header: "Reference No.",
      width: "10%",
      render: (r) => r.reference_number || "N/A",
    },
    {
      header: "Recorded By",
      width: "11%",
      render: (r) => r.recorded_by || "System",
    },
  ];

  const balanceColumns: Column<PayrollBalanceItem>[] = [
    {
      header: "Employee",
      width: "25%",
      render: (r) => r.employee_name,
    },
    {
      header: "Payroll Period",
      width: "25%",
      render: (r) => r.payroll_period,
    },
    {
      header: "Agreed Salary",
      width: "18%",
      align: "right",
      render: (r) =>
        `$${Number(r.agreed_salary).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      header: "Total Paid",
      width: "16%",
      align: "right",
      render: (r) =>
        `$${Number(r.total_paid).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      header: "Outstanding",
      width: "16%",
      align: "right",
      render: (r) =>
        `$${Number(r.outstanding).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
  ];

  const summaryItems = [
    {
      label: "Total Agreed Salaries",
      value: `$${Number(summary.totalAgreedSalaries).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      label: "Total Paid",
      value: `$${Number(summary.totalPaid).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      label: "Total Outstanding Salary",
      value: `$${Number(summary.totalOutstandingSalary).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
  ];

  return (
    <Document title="Payroll Report" author="ERP System">
      <Page size="A4" orientation="landscape" style={reportStyles.page}>
        <ReportHeader
          title="Payroll & Salary Payments Report"
          filters={filters}
          generationDate={generationDate}
        />

        <SummarySection title="Payroll Totals" items={summaryItems} />

        <ReportTable<SalaryPaymentItem>
          title="Table 1: Salary Payments Recorded"
          columns={paymentColumns}
          data={salaryPayments}
          emptyMessage="No salary payments found for the selected period or criteria."
        />

        <ReportTable<PayrollBalanceItem>
          title="Table 2: Payroll Balances & Outstanding Salaries"
          columns={balanceColumns}
          data={payrollBalances}
          emptyMessage="No payroll balances found for the selected period or criteria."
        />

        <ReportFooter />
      </Page>
    </Document>
  );
};
