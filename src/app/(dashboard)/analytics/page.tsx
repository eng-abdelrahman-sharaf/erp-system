"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  Select as SelectShadcn,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/SelectShadcn";
import { OrderVolumeChart } from "@/components/charts/OrderVolumeChart";
import {
  getDashboardMetrics,
  getOrderVolumeData,
  getWarehouseOptions,
  getEmployeeOptions,
} from "@/features/analytics/actions";
import type {
  DashboardMetrics,
  OrderVolumeData,
} from "@/features/analytics/types";
import {
  Package,
  ShoppingCart,
  Users,
  Building2,
  Calendar,
  RefreshCw,
  LucideIcon,
} from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
}

function MetricCard({ title, value, icon: Icon, color }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`rounded-full p-3 ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [orderVolume, setOrderVolume] = useState<OrderVolumeData[]>([]);
  const [warehouseOptions, setWarehouseOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [employeeOptions, setEmployeeOptions] = useState<
    { id: string; full_name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [warehouseId, setWarehouseId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [orderStatus, setOrderStatus] = useState("");

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const filters = {
        startDate: startDate
          ? startDate.toISOString().split("T")[0]
          : undefined,
        endDate: endDate ? endDate.toISOString().split("T")[0] : undefined,
        warehouseId: warehouseId || undefined,
        employeeId: employeeId || undefined,
        orderStatus: orderStatus as
          | "pending"
          | "in_progress"
          | "paid"
          | "cancelled"
          | undefined,
      };

      const [metricsData, volumeData, warehouses, employees] =
        await Promise.all([
          getDashboardMetrics(filters),
          getOrderVolumeData(filters),
          getWarehouseOptions(),
          getEmployeeOptions(),
        ]);

      setMetrics(metricsData);
      setOrderVolume(volumeData);
      setWarehouseOptions(warehouses);
      setEmployeeOptions(employees);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, warehouseId, employeeId, orderStatus]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <Button onClick={loadDashboardData} disabled={loading}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="block text-sm font-medium mb-2">
                Start Date
              </label>
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
            <div>
              <label className="block text-sm font-medium mb-2">
                Warehouse
              </label>
              <SelectShadcn
                value={warehouseId}
                onValueChange={(value) => setWarehouseId(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Warehouses</SelectItem>
                  {warehouseOptions.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      <div className="flex flex-col items-start">
                        <span>{wh.name}</span>
                        <span className="text-xs text-gray-400">{wh.id}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectShadcn>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Employee</label>
              <SelectShadcn
                value={employeeId}
                onValueChange={(value) => setEmployeeId(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Employees</SelectItem>
                  {employeeOptions.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      <div className="flex flex-col items-start">
                        <span>{emp.full_name}</span>
                        <span className="text-xs text-gray-400">{emp.id}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectShadcn>
            </div>
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
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : metrics ? (
        <>
          {/* Order Metrics */}
          <h2 className="text-lg font-semibold text-gray-900">Orders</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <MetricCard
              title="Total Orders"
              value={metrics.orders.total}
              icon={ShoppingCart}
              color="bg-blue-100 text-blue-600"
            />
            <MetricCard
              title="Pending"
              value={metrics.orders.pending}
              icon={Package}
              color="bg-yellow-100 text-yellow-600"
            />
            <MetricCard
              title="In Progress"
              value={metrics.orders.inProgress}
              icon={Package}
              color="bg-blue-100 text-blue-600"
            />
            <MetricCard
              title="Paid"
              value={metrics.orders.paid}
              icon={ShoppingCart}
              color="bg-green-100 text-green-600"
            />
            <MetricCard
              title="Cancelled"
              value={metrics.orders.cancelled}
              icon={Package}
              color="bg-red-100 text-red-600"
            />
          </div>

          {/* Order Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Order Volume Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderVolumeChart data={orderVolume} />
            </CardContent>
          </Card>

          {/* Inventory Metrics */}
          <h2 className="text-lg font-semibold text-gray-900">Inventory</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Items"
              value={metrics.inventory.totalItems}
              icon={Package}
              color="bg-blue-100 text-blue-600"
            />
            <MetricCard
              title="Warehouses"
              value={metrics.inventory.totalWarehouses}
              icon={Building2}
              color="bg-purple-100 text-purple-600"
            />
            <MetricCard
              title="Available Stock"
              value={metrics.inventory.availableStock}
              icon={Package}
              color="bg-green-100 text-green-600"
            />
            <MetricCard
              title="Low Stock Items"
              value={metrics.inventory.lowStockItems}
              icon={Package}
              color="bg-red-100 text-red-600"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <MetricCard
              title="Reserved Stock"
              value={metrics.inventory.reservedStock}
              icon={Package}
              color="bg-yellow-100 text-yellow-600"
            />
            <MetricCard
              title="Used Stock"
              value={metrics.inventory.usedStock}
              icon={Package}
              color="bg-gray-100 text-gray-600"
            />
          </div>

          {/* Employee Metrics */}
          <h2 className="text-lg font-semibold text-gray-900">
            Employees & Payroll
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Employees"
              value={metrics.employees.total}
              icon={Users}
              color="bg-blue-100 text-blue-600"
            />
            <MetricCard
              title="Active Employees"
              value={metrics.employees.active}
              icon={Users}
              color="bg-green-100 text-green-600"
            />
            <MetricCard
              title="Total Salary Payments"
              value={metrics.employees.totalSalaryPayments}
              icon={Calendar}
              color="bg-green-100 text-green-600"
            />
            <MetricCard
              title="Outstanding Payroll"
              value={metrics.employees.outstandingPayroll}
              icon={Calendar}
              color="bg-yellow-100 text-yellow-600"
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
