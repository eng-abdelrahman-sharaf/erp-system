import { Document, Page, View, Text } from "@react-pdf/renderer";
import {
  ReportHeader,
  ReportFooter,
  Table,
  SummaryRow,
  FilterSection,
  styles,
} from "../components";
import { EmployeeReportData } from "../data-fetchers";

interface EmployeeReportProps {
  data: EmployeeReportData;
  filters: { employeeId?: string };
  generationDate: string;
}

export const EmployeeReport = ({
  data,
  filters,
  generationDate,
}: EmployeeReportProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <ReportHeader
        title="Employee Report"
        subtitle={`Generated on ${new Date(generationDate).toLocaleDateString()}`}
      />

      <FilterSection
        filters={[{ label: "Employee", value: filters.employeeId || null }]}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <SummaryRow
          label="Total Employees"
          value={data.summary.totalEmployees}
        />
        <SummaryRow
          label="Active Employees"
          value={data.summary.activeEmployees}
        />
        <SummaryRow
          label="Inactive Employees"
          value={data.summary.inactiveEmployees}
        />
        <SummaryRow
          label="Total Salary"
          value={`$${data.summary.totalSalary.toFixed(2)}`}
        />
        <SummaryRow
          label="Total Assigned Orders"
          value={data.summary.totalAssignedOrders}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Employees</Text>
        <Table
          headers={[
            "Name",
            "Email",
            "Phone",
            "Position",
            "Salary",
            "Status",
            "Employment Date",
            "Assigned Orders",
          ]}
          rows={data.employees.map((employee) => [
            employee.full_name,
            employee.email || "N/A",
            employee.phone || "N/A",
            employee.position || "N/A",
            `$${employee.salary.toFixed(2)}`,
            employee.status,
            new Date(employee.employment_date).toLocaleDateString(),
            employee.assigned_orders_count.toString(),
          ])}
          widths={[18, 18, 12, 12, 10, 8, 12, 10]}
        />
      </View>

      <ReportFooter pageNumber={1} totalPages={1} />
    </Page>
  </Document>
);
