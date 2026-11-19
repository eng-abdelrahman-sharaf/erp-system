import { Document, Page, View, Text } from "@react-pdf/renderer";
import {
  ReportHeader,
  ReportFooter,
  Table,
  SummaryRow,
  FilterSection,
  styles,
} from "../components";
import { InventoryReportData } from "../data-fetchers";

interface InventoryReportProps {
  data: InventoryReportData;
  filters: { warehouseId?: string };
  generationDate: string;
}

export const InventoryReport = ({
  data,
  filters,
  generationDate,
}: InventoryReportProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <ReportHeader
        title="Inventory Report"
        subtitle={`Generated on ${new Date(generationDate).toLocaleDateString()}`}
      />

      <FilterSection
        filters={[{ label: "Warehouse", value: filters.warehouseId || null }]}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <SummaryRow label="Total Items" value={data.summary.totalItems} />
        <SummaryRow
          label="Total Warehouses"
          value={data.summary.totalWarehouses}
        />
        <SummaryRow
          label="Available Stock"
          value={data.summary.totalAvailableStock.toFixed(2)}
        />
        <SummaryRow
          label="Reserved Stock"
          value={data.summary.totalReservedStock.toFixed(2)}
        />
        <SummaryRow
          label="Used Stock"
          value={data.summary.totalUsedStock.toFixed(2)}
        />
        <SummaryRow
          label="Low Stock Items"
          value={data.summary.lowStockItems}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inventory by Warehouse</Text>
        <Table
          headers={[
            "Item Name",
            "SKU",
            "Warehouse",
            "Unit",
            "Total",
            "Available",
            "Reserved",
            "Used",
          ]}
          rows={data.items.map((item) => [
            item.item_name,
            item.sku,
            item.warehouse_name,
            item.unit,
            item.total_quantity.toFixed(2),
            item.available_quantity.toFixed(2),
            item.reserved_quantity.toFixed(2),
            item.used_quantity.toFixed(2),
          ])}
          widths={[20, 12, 15, 8, 10, 10, 10, 10]}
        />
      </View>

      <ReportFooter pageNumber={1} totalPages={1} />
    </Page>
  </Document>
);
