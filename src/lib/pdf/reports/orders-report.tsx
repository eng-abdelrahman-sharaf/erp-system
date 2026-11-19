import { Document, Page, View, Text } from "@react-pdf/renderer";
import {
  ReportHeader,
  ReportFooter,
  Table,
  SummaryRow,
  FilterSection,
  styles,
} from "../components";
import { OrdersReportData } from "../data-fetchers";

interface OrdersReportProps {
  data: OrdersReportData;
  filters: {
    startDate?: string;
    endDate?: string;
    employeeId?: string;
    orderStatus?: string;
  };
  generationDate: string;
}

export const OrdersReport = ({
  data,
  filters,
  generationDate,
}: OrdersReportProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <ReportHeader
        title="Orders Report"
        subtitle={`Generated on ${new Date(generationDate).toLocaleDateString()}`}
      />

      <FilterSection
        filters={[
          { label: "Start Date", value: filters.startDate || null },
          { label: "End Date", value: filters.endDate || null },
          { label: "Order Status", value: filters.orderStatus || null },
        ]}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <SummaryRow label="Total Orders" value={data.summary.totalOrders} />
        <SummaryRow label="Pending" value={data.summary.pendingOrders} />
        <SummaryRow label="In Progress" value={data.summary.inProgressOrders} />
        <SummaryRow label="Paid" value={data.summary.paidOrders} />
        <SummaryRow label="Cancelled" value={data.summary.cancelledOrders} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Orders</Text>
        <Table
          headers={[
            "Order #",
            "Title",
            "Client",
            "Employee",
            "Status",
            "Date",
            "Inventory",
            "Qty",
          ]}
          rows={data.orders.map((order) => [
            order.order_number,
            order.title,
            order.client_name,
            order.employee_name || "N/A",
            order.status,
            new Date(order.order_date).toLocaleDateString(),
            order.inventory_items || "N/A",
            order.total_quantity.toString(),
          ])}
          widths={[12, 20, 18, 15, 10, 12, 8, 5]}
        />
      </View>

      <ReportFooter pageNumber={1} totalPages={1} />
    </Page>
  </Document>
);
