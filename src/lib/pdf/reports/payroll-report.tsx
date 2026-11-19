import { Document, Page, View, Text } from "@react-pdf/renderer";
import {
  ReportHeader,
  ReportFooter,
  Table,
  SummaryRow,
  FilterSection,
  styles,
} from "../components";
import { PayrollReportData } from "../data-fetchers";

interface PayrollReportProps {
  data: PayrollReportData;
  filters: { startDate?: string; endDate?: string; employeeId?: string };
  generationDate: string;
}

export const PayrollReport = ({
  data,
  filters,
  generationDate,
}: PayrollReportProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <ReportHeader
        title="Payroll Report"
        subtitle={`Generated on ${new Date(generationDate).toLocaleDateString()}`}
      />

      <FilterSection
        filters={[
          { label: "Start Date", value: filters.startDate || null },
          { label: "End Date", value: filters.endDate || null },
          { label: "Employee", value: filters.employeeId || null },
        ]}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <SummaryRow label="Total Payments" value={data.summary.totalPayments} />
        <SummaryRow
          label="Total Paid Amount"
          value={`$${data.summary.totalPaidAmount.toFixed(2)}`}
        />
        <SummaryRow
          label="Total Salary Amount"
          value={`$${data.summary.totalSalaryAmount.toFixed(2)}`}
        />
        <SummaryRow
          label="Total Outstanding"
          value={`$${data.summary.totalOutstanding.toFixed(2)}`}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Salary Payments</Text>
        <Table
          headers={[
            "Employee",
            "Period Start",
            "Period End",
            "Salary",
            "Paid",
            "Date",
            "Method",
            "Outstanding",
            "Recorded By",
          ]}
          rows={data.payments.map((payment) => [
            payment.employee_name,
            new Date(payment.period_start).toLocaleDateString(),
            new Date(payment.period_end).toLocaleDateString(),
            `$${payment.salary_amount.toFixed(2)}`,
            `$${payment.payment_amount.toFixed(2)}`,
            new Date(payment.payment_date).toLocaleDateString(),
            payment.method,
            `$${payment.outstanding.toFixed(2)}`,
            payment.recorded_by_name || "N/A",
          ])}
          widths={[15, 10, 10, 10, 10, 10, 10, 10, 10]}
        />
      </View>

      <ReportFooter pageNumber={1} totalPages={1} />
    </Page>
  </Document>
);
