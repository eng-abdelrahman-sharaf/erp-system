import { Document, Page, View, Text } from "@react-pdf/renderer";
import {
  ReportHeader,
  ReportFooter,
  Table,
  SummaryRow,
  FilterSection,
  styles,
} from "../components";
import { InventoryActivityReportData } from "../data-fetchers";

interface InventoryActivityReportProps {
  data: InventoryActivityReportData;
  filters: { startDate?: string; endDate?: string; warehouseId?: string };
  generationDate: string;
}

export const InventoryActivityReport = ({
  data,
  filters,
  generationDate,
}: InventoryActivityReportProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <ReportHeader
        title="Inventory Activity Report"
        subtitle={`Generated on ${new Date(generationDate).toLocaleDateString()}`}
      />

      <FilterSection
        filters={[
          { label: "Start Date", value: filters.startDate || null },
          { label: "End Date", value: filters.endDate || null },
          { label: "Warehouse", value: filters.warehouseId || null },
        ]}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <SummaryRow
          label="Total Activities"
          value={data.summary.totalActivities}
        />
        <SummaryRow label="Additions" value={data.summary.additions} />
        <SummaryRow label="Manual Usage" value={data.summary.manualUsage} />
        <SummaryRow label="Reservations" value={data.summary.reservations} />
        <SummaryRow label="Releases" value={data.summary.releases} />
        <SummaryRow label="Transfers" value={data.summary.transfers} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Log</Text>
        <Table
          headers={[
            "Type",
            "Item",
            "Warehouse",
            "Qty",
            "Order #",
            "User",
            "Date",
          ]}
          rows={data.activities.map((activity) => [
            activity.activity_type,
            activity.item_name,
            activity.warehouse_name,
            activity.quantity.toFixed(2),
            activity.related_order_number || "N/A",
            activity.performed_by_name || "N/A",
            new Date(activity.created_at).toLocaleDateString(),
          ])}
          widths={[14, 20, 18, 10, 13, 13, 12]}
        />
      </View>

      <ReportFooter pageNumber={1} totalPages={1} />
    </Page>
  </Document>
);
