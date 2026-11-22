"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ReportType, ReportFilters } from "@/lib/reports/types";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("orders");
  const [loading, setLoading] = useState(false);
  const [error, setErrorState] = useState("");

  // Filter state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [warehouseId, setWarehouseId] = useState<string>("all");
  const [employeeId, setEmployeeId] = useState<string>("all");
  const [orderStatus, setOrderStatus] = useState<string>("all");

  // Options fetched from DB for dropdowns
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>(
    [],
  );

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const supabase = createClient();
        const [{ data: whData }, { data: empData }] = await Promise.all([
          supabase.from("warehouses").select("id, name").order("name"),
          supabase.from("employees").select("id, full_name").order("full_name"),
        ]);

        if (whData) setWarehouses(whData);
        if (empData) {
          setEmployees(empData.map((e) => ({ id: e.id, name: e.full_name })));
        }
      } catch (err) {
        console.error("Error loading filter options:", err);
      }
    }
    loadFilterOptions();
  }, []);

  const setError = (msg: string) => {
    setErrorState(msg);
    if (msg) toast.error(msg);
  };

  const reportOptions = [
    {
      value: "orders" as const,
      label: "Orders Report",
      icon: FileText,
      description: "Customer orders, status, and assigned inventory items",
    },
    {
      value: "inventory" as const,
      label: "Inventory Report",
      icon: Building,
      description: "Current warehouse stock positions and low-stock alerts",
    },
    {
      value: "inventory-activity" as const,
      label: "Inventory Activity Report",
      icon: Filter,
      description:
        "Historical stock movement audit log and warehouse transfers",
    },
    {
      value: "employees" as const,
      label: "Employee Report",
      icon: User,
      description:
        "Employee directory, assigned customer orders, and payroll summary",
    },
    {
      value: "payroll" as const,
      label: "Payroll Report",
      icon: Calendar,
      description: "Salary payments history and outstanding period balances",
    },
  ];

  const getReportFilters = (): ReportFilters => {
    const filters: ReportFilters = {};
    if (startDate) filters.startDate = formatDateToYYYYMMDD(startDate);
    if (endDate) filters.endDate = formatDateToYYYYMMDD(endDate);
    if (warehouseId && warehouseId !== "all") filters.warehouseId = warehouseId;
    if (employeeId && employeeId !== "all") filters.employeeId = employeeId;
    if (orderStatus && orderStatus !== "all") filters.orderStatus = orderStatus;
    return filters;
  };

  const generateReport = async () => {
    setLoading(true);
    setErrorState("");

    try {
      const filters = getReportFilters();
      const queryParams = new URLSearchParams();

      if (filters.startDate) queryParams.set("startDate", filters.startDate);
      if (filters.endDate) queryParams.set("endDate", filters.endDate);
      if (filters.warehouseId)
        queryParams.set("warehouseId", filters.warehouseId);
      if (filters.employeeId) queryParams.set("employeeId", filters.employeeId);
      if (filters.orderStatus)
        queryParams.set("orderStatus", filters.orderStatus);

      const endpoint = `/api/reports/${reportType}?${queryParams.toString()}`;
      const response = await fetch(endpoint, {
        method: "GET",
      });

      if (!response.ok) {
        let errorMessage = `Failed to generate report (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData?.error) errorMessage = errorData.error;
        } catch {
          // Response was not JSON
        }
        throw new Error(errorMessage);
      }

      // Download the PDF blob from server
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `${reportType}-report-${dateStr}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Report generated and downloaded successfully");
    } catch (err: any) {
      setError(err.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const renderFilters = () => {
    const commonDateFilters = (
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

    const warehouseFilter = (
      <div>
        <label className="block text-sm font-medium mb-2">Warehouse</label>
        <SelectShadcn
          value={warehouseId}
          onValueChange={(val) => setWarehouseId(val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Warehouses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warehouses</SelectItem>
            {warehouses.map((wh) => (
              <SelectItem key={wh.id} value={wh.id}>
                {wh.name}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectShadcn>
      </div>
    );

    const employeeFilter = (
      <div>
        <label className="block text-sm font-medium mb-2">Employee</label>
        <SelectShadcn
          value={employeeId}
          onValueChange={(val) => setEmployeeId(val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectShadcn>
      </div>
    );

    switch (reportType) {
      case "orders":
        return (
          <>
            {commonDateFilters}
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
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </SelectShadcn>
            </div>
            {employeeFilter}
          </>
        );
      case "inventory":
        return <>{warehouseFilter}</>;
      case "inventory-activity":
        return (
          <>
            {commonDateFilters}
            {warehouseFilter}
          </>
        );
      case "employees":
        return <>{employeeFilter}</>;
      case "payroll":
        return (
          <>
            {commonDateFilters}
            {employeeFilter}
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
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generate and export official PDF management reports
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Icon className="w-5 h-5 text-primary" />
            Generate {selectedReport?.label}
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
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              Report Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {renderFilters()}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              onClick={generateReport}
              disabled={loading}
              className="flex items-center gap-2 min-w-48"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate & Download PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportOptions.map((option) => {
              const OptionIcon = option.icon;
              const isSelected = reportType === option.value;
              return (
                <div
                  key={option.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "hover:border-primary/50 hover:bg-muted/50"
                  }`}
                  onClick={() => setReportType(option.value)}
                >
                  <div className="flex items-start gap-3">
                    <OptionIcon
                      className={`w-5 h-5 mt-0.5 ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <div>
                      <h4
                        className={`font-medium ${
                          isSelected ? "text-primary" : ""
                        }`}
                      >
                        {option.label}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {option.description}
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
