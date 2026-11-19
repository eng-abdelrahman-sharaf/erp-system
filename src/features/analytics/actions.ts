"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  DashboardMetrics,
  OrderVolumeData,
  DashboardFilters,
} from "./types";

/**
 * Fetch all dashboard metrics
 */
export async function getDashboardMetrics(
  filters?: DashboardFilters,
): Promise<DashboardMetrics> {
  const supabase = await createClient();

  // Build date filter for orders
  const dateFilter =
    filters?.startDate || filters?.endDate
      ? {
          gte: filters.startDate,
          lte: filters.endDate,
        }
      : undefined;

  // Fetch order metrics
  let ordersQuery = supabase
    .from("orders")
    .select("status", { count: "exact", head: false });

  if (dateFilter) {
    if (dateFilter.gte)
      ordersQuery = ordersQuery.gte("order_date", dateFilter.gte);
    if (dateFilter.lte)
      ordersQuery = ordersQuery.lte("order_date", dateFilter.lte);
  }

  if (
    filters?.orderStatus &&
    ["pending", "in_progress", "paid", "cancelled"].includes(
      filters.orderStatus,
    )
  ) {
    ordersQuery = ordersQuery.eq(
      "status",
      filters.orderStatus as "pending" | "in_progress" | "paid" | "cancelled",
    );
  }

  const { data: orders } = await ordersQuery;

  const orderMetrics = {
    total: orders?.length || 0,
    pending: orders?.filter((o) => o.status === "pending").length || 0,
    inProgress: orders?.filter((o) => o.status === "in_progress").length || 0,
    paid: orders?.filter((o) => o.status === "paid").length || 0,
    cancelled: orders?.filter((o) => o.status === "cancelled").length || 0,
  };

  // Fetch inventory metrics
  let stockQuery = supabase.from("warehouse_stock").select("*");

  if (filters?.warehouseId) {
    stockQuery = stockQuery.eq("warehouse_id", filters.warehouseId);
  }

  const { data: stock } = await stockQuery;

  const inventoryMetrics = {
    totalItems: await getTotalInventoryItems(),
    totalWarehouses: await getTotalWarehouses(),
    availableStock:
      stock?.reduce((sum, s) => sum + Number(s.available_quantity || 0), 0) ||
      0,
    reservedStock:
      stock?.reduce((sum, s) => sum + Number(s.reserved_quantity), 0) || 0,
    usedStock: stock?.reduce((sum, s) => sum + Number(s.used_quantity), 0) || 0,
    lowStockItems: await getLowStockItemsCount(
      filters?.lowStockThreshold || 10,
      filters?.warehouseId,
    ),
  };

  // Fetch employee metrics
  let employeesQuery = supabase.from("employees").select("*");

  if (filters?.employeeId) {
    employeesQuery = employeesQuery.eq("id", filters.employeeId);
  }

  const { data: employees } = await employeesQuery;

  const employeeIds = employees?.map((e) => e.id) || [];

  const payrollMetrics = await getPayrollMetrics(employeeIds);

  const employeeMetrics = {
    total: employees?.length || 0,
    active: employees?.filter((e) => e.status === "active").length || 0,
    totalSalaryPayments: payrollMetrics.totalPayments,
    outstandingPayroll: payrollMetrics.outstanding,
  };

  return {
    orders: orderMetrics,
    inventory: inventoryMetrics,
    employees: employeeMetrics,
  };
}

/**
 * Get total count of inventory items
 */
async function getTotalInventoryItems(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("inventory_items")
    .select("*", { count: "exact", head: true });
  return count || 0;
}

/**
 * Get total count of warehouses
 */
async function getTotalWarehouses(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("warehouses")
    .select("*", { count: "exact", head: true });
  return count || 0;
}

/**
 * Get count of low-stock items
 */
async function getLowStockItemsCount(
  threshold: number,
  warehouseId?: string,
): Promise<number> {
  const supabase = await createClient();

  let query = supabase
    .from("warehouse_stock")
    .select("*")
    .lte("available_quantity", threshold);

  if (warehouseId) {
    query = query.eq("warehouse_id", warehouseId);
  }

  const { data } = await query;

  // Count unique items with low stock across warehouses
  const uniqueItems = new Set(data?.map((s) => s.item_id));
  return uniqueItems.size || 0;
}

/**
 * Get payroll metrics for given employee IDs
 */
async function getPayrollMetrics(employeeIds: string[]): Promise<{
  totalPayments: number;
  outstanding: number;
}> {
  const supabase = await createClient();

  if (employeeIds.length === 0) {
    return { totalPayments: 0, outstanding: 0 };
  }

  // Get total salary payments
  const { data: payments } = await supabase
    .from("salary_payments")
    .select("amount")
    .in(
      "payroll_period_id",
      // First get payroll period IDs for these employees
      (
        await supabase
          .from("payroll_periods")
          .select("id")
          .in("employee_id", employeeIds)
      ).data?.map((p) => p.id) || [],
    );

  const totalPayments =
    payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  // Get total agreed salary and calculate outstanding
  const { data: periods } = await supabase
    .from("payroll_periods")
    .select("salary_amount")
    .in("employee_id", employeeIds);

  const totalAgreed =
    periods?.reduce((sum, p) => sum + Number(p.salary_amount), 0) || 0;
  const outstanding = Math.max(0, totalAgreed - totalPayments);

  return { totalPayments, outstanding };
}

/**
 * Get order volume over time (grouped by date)
 */
export async function getOrderVolumeData(
  filters?: DashboardFilters,
): Promise<OrderVolumeData[]> {
  const supabase = await createClient();

  let query = supabase.from("orders").select("order_date, status");

  if (filters?.startDate) {
    query = query.gte("order_date", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("order_date", filters.endDate);
  }
  if (
    filters?.orderStatus &&
    ["pending", "in_progress", "paid", "cancelled"].includes(
      filters.orderStatus,
    )
  ) {
    query = query.eq(
      "status",
      filters.orderStatus as "pending" | "in_progress" | "paid" | "cancelled",
    );
  }

  const { data: orders } = await query;

  if (!orders || orders.length === 0) {
    return [];
  }

  // Group orders by date
  const groupedByDate = orders.reduce(
    (acc, order) => {
      const date = order.order_date;
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Convert to array and sort by date
  return Object.entries(groupedByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Get warehouse options for filters
 */
export async function getWarehouseOptions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("warehouses")
    .select("id, name")
    .order("name");
  return data || [];
}

/**
 * Get employee options for filters
 */
export async function getEmployeeOptions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employees")
    .select("id, full_name")
    .eq("status", "active")
    .order("full_name");
  return data || [];
}
