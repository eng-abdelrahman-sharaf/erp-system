"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { DatePicker, formatDateToYYYYMMDD } from "@/components/ui/DatePicker";
import {
  Select as SelectShadcn,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/SelectShadcn";
import {
  FileText,
  Download,
  Calendar,
  Building,
  User,
  Filter,
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import {
  OrdersReport,
  InventoryReport,
  InventoryActivityReport,
  EmployeeReport,
  PayrollReport,
} from "@/lib/pdf/reports";
import {
  fetchOrdersReportData,
  fetchInventoryReportData,
  fetchInventoryActivityReportData,
  fetchEmployeeReportData,
  fetchPayrollReportData,
  ReportFilters,
} from "@/lib/pdf/data-fetchers";

type ReportType =
  | "orders"
  | "inventory"
  | "inventory-activity"
  | "employees"
  | "payroll";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("orders");
  const [loading, setLoading] = useState(false);
  const [error, setErrorState] = useState("");

  const setError = (msg: string) => {
    setErrorState(msg);
    if (msg) toast.error(msg);
  };

  // Filter state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [warehouseId, setWarehouseId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [orderStatus, setOrderStatus] = useState("");

  const reportOptions = [
    { value: "orders", label: "Orders Report", icon: FileText },
    { value: "inventory", label: "Inventory Report", icon: Building },
    {
      value: "inventory-activity",
      label: "Inventory Activity Report",
      icon: Filter,
    },
    { value: "employees", label: "Employee Report", icon: User },
    { value: "payroll", label: "Payroll Report", icon: Calendar },
  ];

  const getReportFilters = (): ReportFilters => {
    const filters: ReportFilters = {};
    if (startDate) filters.startDate = formatDateToYYYYMMDD(startDate);
    if (endDate) filters.endDate = formatDateToYYYYMMDD(endDate);
    if (warehouseId) filters.warehouseId = warehouseId;
    if (employeeId) filters.employeeId = employeeId;
    if (orderStatus) filters.orderStatus = orderStatus;
    return filters;
  };

  const generateReport = async () => {
    setLoading(true);
    setError("");

    try {
      const filters = getReportFilters();
      const generationDate = new Date().toISOString();

      let blob: Blob;

      switch (reportType) {
        case "orders": {
          const data = await fetchOrdersReportData(filters);
          const doc = (
            <OrdersReport
              data={data}
              filters={filters}
              generationDate={generationDate}
            />
          );
          blob = await pdf(doc).toBlob();
          break;
        }
        case "inventory": {
          const data = await fetchInventoryReportData(filters);
          const doc = (
            <InventoryReport
              data={data}
              filters={filters}
              generationDate={generationDate}
            />
          );
          blob = await pdf(doc).toBlob();
          break;
        }
        case "inventory-activity": {
          const data = await fetchInventoryActivityReportData(filters);
          const doc = (
            <InventoryActivityReport
              data={data}
              filters={filters}
              generationDate={generationDate}
            />
          );
          blob = await pdf(doc).toBlob();
          break;
        }
        case "employees": {
          const data = await fetchEmployeeReportData(filters);
          const doc = (
            <EmployeeReport
              data={data}
              filters={filters}
              generationDate={generationDate}
            />
          );
          blob = await pdf(doc).toBlob();
          break;
        }
        case "payroll": {
          const data = await fetchPayrollReportData(filters);
          const doc = (
            <PayrollReport
              data={data}
              filters={filters}
              generationDate={generationDate}
            />
          );
          blob = await pdf(doc).toBlob();
          break;
        }
        default:
          throw new Error("Invalid report type");
      }

      // Download the PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportType}-report-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const renderFilters = () => {
    const commonFilters = (
      <>
        <div>
          <label className="block text-sm font-medium mb-2">Start Date</label>
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            placeholder="Select start date"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">End Date</label>
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            placeholder="Select end date"
            className="w-full"
          />
        </div>
      </>
    );

    switch (reportType) {
      case "orders":
        return (
          <>
            {commonFilters}
            <div>
              <label className="block text-sm font-medium mb-2">
                Order Status
              </label>
              <SelectShadcn
                value={orderStatus}
                onValueChange={(value) => setOrderStatus(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </SelectShadcn>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Employee ID
              </label>
              <Input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Enter employee ID"
                className="w-full"
              />
            </div>
          </>
        );
      case "inventory":
        return (
          <div>
            <label className="block text-sm font-medium mb-2">
              Warehouse ID
            </label>
            <Input
              type="text"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              placeholder="Enter warehouse ID"
              className="w-full"
            />
          </div>
        );
      case "inventory-activity":
        return (
          <>
            {commonFilters}
            <div>
              <label className="block text-sm font-medium mb-2">
                Warehouse ID
              </label>
              <Input
                type="text"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                placeholder="Enter warehouse ID"
                className="w-full"
              />
            </div>
          </>
        );
      case "employees":
        return (
          <div>
            <label className="block text-sm font-medium mb-2">
              Employee ID
            </label>
            <Input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="Enter employee ID"
              className="w-full"
            />
          </div>
        );
      case "payroll":
        return (
          <>
            {commonFilters}
            <div>
              <label className="block text-sm font-medium mb-2">
                Employee ID
              </label>
              <Input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Enter employee ID"
                className="w-full"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const selectedReport = reportOptions.find((r) => r.value === reportType);
  const Icon = selectedReport?.icon || FileText;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generate and download PDF reports
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            Generate Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Report Type
            </label>
            <SelectShadcn
              value={reportType}
              onValueChange={(value) => setReportType(value as ReportType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                {reportOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectShadcn>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-sm font-medium mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {renderFilters()}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={generateReport}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {loading ? "Generating..." : "Generate & Download PDF"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportOptions.map((option) => {
              const OptionIcon = option.icon;
              return (
                <div
                  key={option.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    reportType === option.value
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setReportType(option.value as ReportType)}
                >
                  <div className="flex items-center gap-3">
                    <OptionIcon className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium">{option.label}</h4>
                      <p className="text-sm text-muted-foreground">
                        {option.value === "orders" &&
                          "Orders, clients, employees, statuses, inventory"}
                        {option.value === "inventory" &&
                          "Items, warehouses, stock quantities"}
                        {option.value === "inventory-activity" &&
                          "Additions, usage, reservations, transfers"}
                        {option.value === "employees" &&
                          "Employee info, assigned orders, payroll"}
                        {option.value === "payroll" &&
                          "Salary payments, outstanding balances"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
