import React from "react";
import { View, Text, Svg, Path } from "@react-pdf/renderer";
import { reportStyles } from "./styles";
import { ReportFilters } from "../../types";

export const BoxesLinkedIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 28,
  color = "#2563eb",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M14 6h2a2 2 0 0 1 2 2v5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M14.21 15.202 18 17.4V22"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M14.796 14.611A1.6 1.6 0 0 0 14 15.995v3.013a1.6 1.6 0 0 0 .797 1.384l2.4 1.392a1.6 1.6 0 0 0 1.606 0l2.4-1.392A1.6 1.6 0 0 0 22 19.008v-3.013a1.6 1.6 0 0 0-.796-1.384l-2.4-1.394a1.6 1.6 0 0 0-1.514-.051z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="m18 17.4 3.79-2.198"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M2.21 4.202 6 6.4V16a2 2 0 0 0 2 2h2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M2.796 3.611A1.6 1.6 0 0 0 2 4.995v3.013a1.6 1.6 0 0 0 .797 1.384l2.4 1.392a1.6 1.6 0 0 0 1.606 0l2.4-1.392A1.6 1.6 0 0 0 10 8.008V4.995a1.6 1.6 0 0 0-.796-1.384l-2.4-1.394a1.6 1.6 0 0 0-1.514-.052z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="m6 6.4 3.79-2.198"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

interface ReportHeaderProps {
  title: string;
  filters?: ReportFilters;
  generationDate?: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  title,
  filters = {},
  generationDate,
}) => {
  const formattedDate = generationDate
    ? new Date(generationDate).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : new Date().toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

  const filterList: { label: string; value: string }[] = [];

  if (filters.startDate && filters.endDate) {
    filterList.push({
      label: "Date Range:",
      value: `${filters.startDate} to ${filters.endDate}`,
    });
  } else if (filters.startDate) {
    filterList.push({
      label: "From Date:",
      value: filters.startDate,
    });
  } else if (filters.endDate) {
    filterList.push({
      label: "To Date:",
      value: filters.endDate,
    });
  }

  if (filters.warehouseName || filters.warehouseId) {
    filterList.push({
      label: "Warehouse:",
      value: filters.warehouseName || filters.warehouseId || "All",
    });
  }

  if (filters.employeeName || filters.employeeId) {
    filterList.push({
      label: "Employee:",
      value: filters.employeeName || filters.employeeId || "All",
    });
  }

  if (filters.orderStatus) {
    const statusLabel =
      filters.orderStatus
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    filterList.push({
      label: "Status:",
      value: statusLabel,
    });
  }

  return (
    <View style={reportStyles.headerContainer}>
      <View style={reportStyles.headerTopRow}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <BoxesLinkedIcon size={28} color="#0284c7" />
          <View style={{ marginLeft: 8, gap: "8px" }}>
            <Text style={reportStyles.companyName}>ERP System</Text>
            <Text style={reportStyles.companySubtext}>
              Enterprise Resource Planning & Management System
            </Text>
          </View>
        </View>
        <View style={reportStyles.reportTitleContainer}>
          <Text style={reportStyles.reportTitle}>{title}</Text>
          <Text style={reportStyles.generatedAt}>
            Generated: {formattedDate}
          </Text>
        </View>
      </View>

      <View style={reportStyles.filterBox}>
        <View style={reportStyles.filterItem}>
          <Text style={reportStyles.filterLabel}>Filters Applied:</Text>
          <Text style={reportStyles.filterValue}>
            {filterList.length === 0 ? "None (All records)" : ""}
          </Text>
        </View>
        {filterList.map((f, i) => (
          <View key={i} style={reportStyles.filterItem}>
            <Text style={reportStyles.filterLabel}>{f.label}</Text>
            <Text style={reportStyles.filterValue}>{f.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
