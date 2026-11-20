import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  OrdersFilters,
  InventoryFilters,
  EmployeesFilters,
  DashboardFilterProvider,
  DashboardSection,
} from "./DashboardFilters";
import { OrderVolumeChart } from "@/components/charts/OrderVolumeChart";
import { NumberTicket } from "@/components/ui/NumberTicket";
import {
  getDashboardMetrics,
  getOrderVolumeData,
  getWarehouseOptions,
  getEmployeeOptions,
} from "@/features/analytics/actions";
import type { DashboardFilters } from "@/features/analytics/types";
import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

export const instant = false;

interface DashboardPageProps {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    warehouseId?: string;
    employeeId?: string;
    orderStatus?: string;
    lowStockThreshold?: string;
  }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const filters: DashboardFilters = {
    startDate: params.startDate,
    endDate: params.endDate,
    warehouseId: params.warehouseId,
    employeeId: params.employeeId,
    orderStatus: params.orderStatus as
      | "pending"
      | "in_progress"
      | "paid"
      | "cancelled"
      | undefined,
    lowStockThreshold: params.lowStockThreshold
      ? parseInt(params.lowStockThreshold)
      : 10,
  };

  const [metrics, orderVolumeData, warehouses, employees] = await Promise.all([
    getDashboardMetrics(filters),
    getOrderVolumeData(filters),
    getWarehouseOptions(),
    getEmployeeOptions(),
  ]);

  return (
    <DashboardFilterProvider>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* ── Orders ─────────────────────────────────────────── */}
      <DashboardSection
        sectionId="orders"
        title="Orders"
        filters={
          <OrdersFilters
            startDate={params.startDate}
            endDate={params.endDate}
            orderStatus={params.orderStatus}
          />
        }
      >
        <div className="mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="Total Orders"
            value={metrics.orders.total}
            icon={<ShoppingCart className="h-6 w-6" />}
            color="blue"
          />
          <MetricCard
            title="Pending"
            value={metrics.orders.pending}
            icon={<TrendingUp className="h-6 w-6" />}
            color="yellow"
          />
          <MetricCard
            title="In Progress"
            value={metrics.orders.inProgress}
            icon={<TrendingUp className="h-6 w-6" />}
            color="blue"
          />
          <MetricCard
            title="Paid"
            value={metrics.orders.paid}
            icon={<DollarSign className="h-6 w-6" />}
            color="green"
          />
          <MetricCard
            title="Cancelled"
            value={metrics.orders.cancelled}
            icon={<AlertTriangle className="h-6 w-6" />}
            color="red"
          />
        </div>

        {/* Order Volume Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Order Volume Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={<div className="h-64 animate-pulse bg-gray-200" />}
            >
              <OrderVolumeChart data={orderVolumeData} />
            </Suspense>
          </CardContent>
        </Card>
      </DashboardSection>

      {/* ── Inventory ──────────────────────────────────────── */}
      <DashboardSection
        sectionId="inventory"
        title="Inventory"
        filters={
          <InventoryFilters
            warehouseId={params.warehouseId}
            warehouses={warehouses}
            lowStockThreshold={params.lowStockThreshold}
          />
        }
      >
        <div className="mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Items"
            value={metrics.inventory.totalItems}
            icon={<Package className="h-6 w-6" />}
            color="blue"
          />
          <MetricCard
            title="Warehouses"
            value={metrics.inventory.totalWarehouses}
            icon={<Package className="h-6 w-6" />}
            color="purple"
          />
          <MetricCard
            title="Available Stock"
            value={metrics.inventory.availableStock}
            icon={<Package className="h-6 w-6" />}
            color="green"
            showDecimals
          />
          <MetricCard
            title="Low Stock Items"
            value={metrics.inventory.lowStockItems}
            icon={<AlertTriangle className="h-6 w-6" />}
            color="red"
          />
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <MetricCard
            title="Reserved Stock"
            value={metrics.inventory.reservedStock}
            icon={<Package className="h-6 w-6" />}
            color="yellow"
            showDecimals
          />
          <MetricCard
            title="Used Stock"
            value={metrics.inventory.usedStock}
            icon={<Package className="h-6 w-6" />}
            color="gray"
            showDecimals
          />
        </div>
      </DashboardSection>

      {/* ── Employees & Payroll ────────────────────────────── */}
      <DashboardSection
        sectionId="employees"
        title="Employees & Payroll"
        filters={
          <EmployeesFilters
            employeeId={params.employeeId}
            employees={employees}
          />
        }
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Employees"
            value={metrics.employees.total}
            icon={<Users className="h-6 w-6" />}
            color="blue"
          />
          <MetricCard
            title="Active Employees"
            value={metrics.employees.active}
            icon={<Users className="h-6 w-6" />}
            color="green"
          />
          <MetricCard
            title="Total Salary Payments"
            value={metrics.employees.totalSalaryPayments}
            icon={<DollarSign className="h-6 w-6" />}
            color="green"
            isCurrency
          />
          <MetricCard
            title="Outstanding Payroll"
            value={metrics.employees.outstandingPayroll}
            icon={<DollarSign className="h-6 w-6" />}
            color="yellow"
            isCurrency
          />
        </div>
      </DashboardSection>
    </DashboardFilterProvider>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "green" | "yellow" | "red" | "purple" | "gray";
  isCurrency?: boolean;
  showDecimals?: boolean;
  decimalPlaces?: number;
}

function MetricCard({
  title,
  value,
  icon,
  color,
  isCurrency = false,
  showDecimals = false,
  decimalPlaces = 2,
}: MetricCardProps) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
    gray: "bg-gray-100 text-gray-600",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className={`rounded-full p-2 ${colorClasses[color]}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <NumberTicket
          value={value}
          isCurrency={isCurrency}
          showDecimals={showDecimals}
          decimalPlaces={decimalPlaces}
          className="w-full"
        />
      </CardContent>
    </Card>
  );
}
