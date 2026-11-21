import { StyleSheet } from "@react-pdf/renderer";

export const reportStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 30,
    paddingBottom: 45,
    paddingHorizontal: 30,
    lineHeight: 1.4,
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  // Header styles
  headerContainer: {
    marginBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: "#0284c7",
    paddingBottom: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: 0.5,
  },
  companySubtext: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  reportTitleContainer: {
    gap:"8px",
    alignItems: "flex-end",
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0369a1",
    textTransform: "uppercase",
  },
  generatedAt: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  // Filters section
  filterBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 8,
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#475569",
    marginRight: 4,
  },
  filterValue: {
    fontSize: 8,
    color: "#0f172a",
  },
  // Summary Section
  summaryContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 6,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    minWidth: 110,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 8,
  },
  summaryCardLabel: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  summaryCardValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
  },
  // Table Section
  tableContainer: {
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    minHeight: 22,
    alignItems: "center",
  },
  tableHeaderCell: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#ffffff",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    minHeight: 20,
    alignItems: "center",
  },
  tableRowEven: {
    backgroundColor: "#f8fafc",
  },
  tableRowOdd: {
    backgroundColor: "#ffffff",
  },
  tableCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 7.5,
    color: "#334155",
  },
  emptyStateBox: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  emptyStateText: {
    fontSize: 8.5,
    color: "#64748b",
    fontStyle: "italic",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7.5,
    color: "#94a3b8",
  },
  footerPageNumber: {
    fontSize: 7.5,
    color: "#64748b",
    fontWeight: "bold",
  },
});
