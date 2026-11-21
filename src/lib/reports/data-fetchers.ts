import { SupabaseClient } from "@supabase/supabase-js";
import {
  ReportFilters,
  OrdersReportData,
  InventoryReportData,
  InventoryActivityReportData,
  EmployeeReportData,
  PayrollReportData,
  OrderItem,
  AssignedInventoryItem,
  InventoryStockItem,
  LowStockItem,
  InventoryActivityItem,
  EmployeeInfoItem,
  EmployeeAssignedOrderItem,
  EmployeePayrollSummaryItem,
  SalaryPaymentItem,
  PayrollBalanceItem,
} from "./types";

export async function fetchOrdersReportData(
  supabase: SupabaseClient,
  filters: ReportFilters = {},
): Promise<OrdersReportData> {
  let query = supabase.from("orders").select(`
      id,
      order_number,
      title,
      client_name,
      status,
      order_date,
      employee_id,
      employees (
        id,
        full_name
      ),
      order_inventory (
        quantity,
        unit,
        inventory_items (
          name,
          sku,
          unit
        ),
        warehouses (
          name
        )
      )
    `);

  if (filters.startDate) {
    query = query.gte("order_date", filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte("order_date", filters.endDate);
  }
  if (filters.orderStatus) {
    query = query.eq("status", filters.orderStatus);
  }
  if (filters.employeeId) {
    query = query.eq("employee_id", filters.employeeId);
  }

  const { data: rawOrders, error } = await query.order("order_date", {
    ascending: false,
  });

  if (error) {
    console.error("fetchOrdersReportData error:", error);
    throw new Error(`Failed to fetch orders data: ${error.message}`);
  }

  const orders: OrderItem[] = [];
  const assignedInventory: AssignedInventoryItem[] = [];

  for (const o of rawOrders || []) {
    const employeeName = (o as any).employees?.full_name || "Unassigned";

    orders.push({
      order_number: o.order_number,
      title: o.title,
      client_name: o.client_name,
      employee_name: employeeName,
      order_date: o.order_date,
      status: o.status,
    });

    const items = (o as any).order_inventory || [];
    for (const inv of items) {
      const itemInfo = inv.inventory_items;
      const whInfo = inv.warehouses;
      assignedInventory.push({
        order_number: o.order_number,
        item_name: itemInfo?.name || "Unknown Item",
        sku: itemInfo?.sku || "-",
        warehouse_name: whInfo?.name || "Unknown Warehouse",
        quantity: Number(inv.quantity) || 0,
        unit: inv.unit || itemInfo?.unit || "units",
      });
    }
  }

  const summary = {
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === "pending").length,
    inProgressOrders: orders.filter((o) => o.status === "in_progress").length,
    paidOrders: orders.filter((o) => o.status === "paid").length,
    cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
  };

  return { orders, assignedInventory, summary };
}

export async function fetchInventoryReportData(
  supabase: SupabaseClient,
  filters: ReportFilters = {},
): Promise<InventoryReportData> {
  let query = supabase.from("warehouse_stock").select(`
      id,
      warehouse_id,
      total_quantity,
      available_quantity,
      reserved_quantity,
      used_quantity,
      inventory_items!inner (
        id,
        name,
        sku,
        unit
      ),
      warehouses!inner (
        id,
        name
      )
    `);

  if (filters.warehouseId) {
    query = query.eq("warehouse_id", filters.warehouseId);
  }

  const { data: rawStock, error } = await query;

  if (error) {
    console.error("fetchInventoryReportData error:", error);
    throw new Error(`Failed to fetch inventory stock data: ${error.message}`);
  }

  const stock: InventoryStockItem[] = [];
  const lowStockItems: LowStockItem[] = [];
  const LOW_STOCK_THRESHOLD = 10;

  for (const s of rawStock || []) {
    const item = (s as any).inventory_items;
    const wh = (s as any).warehouses;

    const totalQty = Number(s.total_quantity) || 0;
    const availQty = Number(s.available_quantity) || 0;
    const resQty = Number(s.reserved_quantity) || 0;
    const usedQty = Number(s.used_quantity) || 0;
    const unit = item?.unit || "units";

    stock.push({
      sku: item?.sku || "-",
      item_name: item?.name || "Unknown Item",
      warehouse_name: wh?.name || "Unknown Warehouse",
      total_quantity: totalQty,
      available_quantity: availQty,
      reserved_quantity: resQty,
      used_quantity: usedQty,
      unit,
    });

    if (availQty <= LOW_STOCK_THRESHOLD) {
      lowStockItems.push({
        item_name: item?.name || "Unknown Item",
        warehouse_name: wh?.name || "Unknown Warehouse",
        available_quantity: availQty,
        threshold: LOW_STOCK_THRESHOLD,
        unit,
      });
    }
  }

  // Sort stock alphabetically by item name
  stock.sort((a, b) => a.item_name.localeCompare(b.item_name));
  lowStockItems.sort((a, b) => a.available_quantity - b.available_quantity);

  const uniqueItems = new Set(stock.map((s) => s.sku));
  const uniqueWarehouses = new Set(stock.map((s) => s.warehouse_name));

  const summary = {
    totalItems: uniqueItems.size,
    totalWarehouses: uniqueWarehouses.size,
    totalStock: stock.reduce((acc, s) => acc + s.total_quantity, 0),
    totalAvailableStock: stock.reduce(
      (acc, s) => acc + s.available_quantity,
      0,
    ),
    totalReservedStock: stock.reduce((acc, s) => acc + s.reserved_quantity, 0),
    totalUsedStock: stock.reduce((acc, s) => acc + s.used_quantity, 0),
  };

  return { stock, lowStockItems, summary };
}

export async function fetchInventoryActivityReportData(
  supabase: SupabaseClient,
  filters: ReportFilters = {},
): Promise<InventoryActivityReportData> {
  let query = supabase.from("inventory_activity_logs").select(`
      id,
      activity_type,
      quantity,
      previous_total,
      new_total,
      previous_reserved,
      new_reserved,
      previous_used,
      new_used,
      notes,
      created_at,
      transfer_id,
      inventory_items (
        name,
        sku,
        unit
      ),
      warehouses (
        id,
        name
      ),
      orders (
        order_number
      ),
      profiles (
        full_name
      )
    `);

  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate);
  }
  if (filters.endDate) {
    // If date only is provided e.g. 2026-11-21, include the full day
    const endStr = filters.endDate.includes("T")
      ? filters.endDate
      : `${filters.endDate}T23:59:59.999Z`;
    query = query.lte("created_at", endStr);
  }
  if (filters.warehouseId) {
    query = query.eq("warehouse_id", filters.warehouseId);
  }

  const { data: rawActivities, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    console.error("fetchInventoryActivityReportData error:", error);
    throw new Error(`Failed to fetch inventory activity data: ${error.message}`);
  }

  // Pre-fetch transfers and warehouses map if transfers exist
  const transferIds = Array.from(
    new Set(
      (rawActivities || [])
        .map((a: any) => a.transfer_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const transfersMap = new Map<
    string,
    { sourceWarehouse: string; destWarehouse: string }
  >();

  if (transferIds.length > 0) {
    // Fetch warehouse transfers and all warehouses to resolve names reliably
    const [{ data: transfers }, { data: warehouses }] = await Promise.all([
      supabase
        .from("warehouse_transfers")
        .select("id, source_warehouse_id, destination_warehouse_id")
        .in("id", transferIds),
      supabase.from("warehouses").select("id, name"),
    ]);

    const whMap = new Map<string, string>();
    for (const w of warehouses || []) {
      whMap.set(w.id, w.name);
    }

    for (const t of transfers || []) {
      transfersMap.set(t.id, {
        sourceWarehouse: whMap.get(t.source_warehouse_id) || "Source",
        destWarehouse: whMap.get(t.destination_warehouse_id) || "Destination",
      });
    }
  }

  const activities: InventoryActivityItem[] = [];
  let totalAdded = 0;
  let totalUsed = 0;
  let totalReserved = 0;
  let totalReleased = 0;
  let totalTransferred = 0;

  for (const a of rawActivities || []) {
    const item = (a as any).inventory_items;
    const wh = (a as any).warehouses;
    const order = (a as any).orders;
    const profile = (a as any).profiles;
    const qty = Number(a.quantity) || 0;

    let transferInfo:
      | { sourceWarehouse: string; destWarehouse: string }
      | undefined;
    if (a.transfer_id) {
      transferInfo = transfersMap.get(a.transfer_id);
    }

    if (a.activity_type === "addition") {
      totalAdded += qty;
    } else if (a.activity_type === "manual_usage") {
      totalUsed += qty;
    } else if (a.activity_type === "reservation") {
      totalReserved += qty;
    } else if (a.activity_type === "release") {
      totalReleased += qty;
    } else if (
      a.activity_type === "transfer_out" ||
      a.activity_type === "transfer_in"
    ) {
      // Count transfers once (e.g. transfer_out or / 2)
      if (a.activity_type === "transfer_out") {
        totalTransferred += qty;
      }
    }

    activities.push({
      date: a.created_at,
      activity_type: a.activity_type,
      item_name: item?.name || "Unknown Item",
      sku: item?.sku || "-",
      warehouse_name: wh?.name || "Unknown Warehouse",
      quantity: qty,
      previous_quantity: Number(a.previous_total) || 0,
      new_quantity: Number(a.new_total) || 0,
      related_order: order?.order_number || null,
      performed_by: profile?.full_name || "System",
      notes: a.notes || null,
      transfer_reference: a.transfer_id || null,
      source_warehouse: transferInfo?.sourceWarehouse || null,
      destination_warehouse: transferInfo?.destWarehouse || null,
    });
  }

  const summary = {
    totalAdded,
    totalUsed,
    totalReserved,
    totalReleased,
    totalTransferred,
  };

  return { activities, summary };
}

export async function fetchEmployeeReportData(
  supabase: SupabaseClient,
  filters: ReportFilters = {},
): Promise<EmployeeReportData> {
  // 1. Fetch employees
  let empQuery = supabase.from("employees").select(`
      id,
      full_name,
      email,
      phone,
      position,
      salary,
      employment_date,
      status
    `);

  if (filters.employeeId) {
    empQuery = empQuery.eq("id", filters.employeeId);
  }

  const { data: rawEmployees, error: empError } = await empQuery.order(
    "full_name",
    { ascending: true },
  );

  if (empError) {
    console.error("fetchEmployeeReportData empError:", empError);
    throw new Error(`Failed to fetch employees: ${empError.message}`);
  }

  const employees: EmployeeInfoItem[] = (rawEmployees || []).map((e) => ({
    employee_id: e.id,
    full_name: e.full_name,
    email: e.email,
    phone: e.phone,
    position: e.position,
    salary: Number(e.salary) || 0,
    employment_date: e.employment_date,
    status: e.status,
  }));

  const employeeIds = employees.map((e) => e.employee_id);

  // 2. Fetch assigned orders for these employees
  let ordersQuery = supabase.from("orders").select(`
      order_number,
      title,
      client_name,
      status,
      order_date,
      employee_id,
      employees!inner (
        full_name
      )
    `);

  if (filters.employeeId) {
    ordersQuery = ordersQuery.eq("employee_id", filters.employeeId);
  } else if (employeeIds.length > 0) {
    ordersQuery = ordersQuery.in("employee_id", employeeIds);
  }

  if (filters.startDate) {
    ordersQuery = ordersQuery.gte("order_date", filters.startDate);
  }
  if (filters.endDate) {
    ordersQuery = ordersQuery.lte("order_date", filters.endDate);
  }

  const { data: rawOrders } = await ordersQuery.order("order_date", {
    ascending: false,
  });

  const assignedOrders: EmployeeAssignedOrderItem[] = (rawOrders || []).map(
    (o) => ({
      employee_name: (o as any).employees?.full_name || "Unknown",
      order_number: o.order_number,
      title: o.title,
      client_name: o.client_name,
      status: o.status,
      order_date: o.order_date,
    }),
  );

  // 3. Fetch payroll summary for these employees
  let payrollQuery = supabase.from("payroll_periods").select(`
      id,
      employee_id,
      period_start,
      period_end,
      salary_amount,
      employees!inner (
        full_name
      ),
      salary_payments (
        amount
      )
    `);

  if (filters.employeeId) {
    payrollQuery = payrollQuery.eq("employee_id", filters.employeeId);
  } else if (employeeIds.length > 0) {
    payrollQuery = payrollQuery.in("employee_id", employeeIds);
  }

  if (filters.startDate) {
    payrollQuery = payrollQuery.gte("period_end", filters.startDate);
  }
  if (filters.endDate) {
    payrollQuery = payrollQuery.lte("period_start", filters.endDate);
  }

  const { data: rawPayroll } = await payrollQuery.order("period_start", {
    ascending: false,
  });

  const payrollSummary: EmployeePayrollSummaryItem[] = [];
  let totalSalaryPayments = 0;
  let outstandingPayroll = 0;

  for (const p of rawPayroll || []) {
    const agreedSalary = Number(p.salary_amount) || 0;
    const payments = (p as any).salary_payments || [];
    const totalPaid = payments.reduce(
      (sum: number, pay: { amount: number }) => sum + (Number(pay.amount) || 0),
      0,
    );
    const outstanding = Math.max(0, agreedSalary - totalPaid);

    totalSalaryPayments += totalPaid;
    outstandingPayroll += outstanding;

    payrollSummary.push({
      employee_name: (p as any).employees?.full_name || "Unknown",
      salary: agreedSalary,
      payroll_period: `${p.period_start} to ${p.period_end}`,
      total_paid: totalPaid,
      outstanding,
    });
  }

  const summary = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter((e) => e.status === "active").length,
    totalSalaryPayments,
    outstandingPayroll,
  };

  return { employees, assignedOrders, payrollSummary, summary };
}

export async function fetchPayrollReportData(
  supabase: SupabaseClient,
  filters: ReportFilters = {},
): Promise<PayrollReportData> {
  // Query payroll_periods joined with salary_payments, employees, and profiles (recorded_by)
  let query = supabase.from("payroll_periods").select(`
      id,
      employee_id,
      period_start,
      period_end,
      salary_amount,
      employees!inner (
        id,
        full_name
      ),
      salary_payments (
        id,
        amount,
        payment_date,
        method,
        reference_number,
        notes,
        profiles (
          full_name
        )
      )
    `);

  if (filters.employeeId) {
    query = query.eq("employee_id", filters.employeeId);
  }
  if (filters.startDate) {
    query = query.gte("period_end", filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte("period_start", filters.endDate);
  }

  const { data: rawPeriods, error } = await query.order("period_start", {
    ascending: false,
  });

  if (error) {
    console.error("fetchPayrollReportData error:", error);
    throw new Error(`Failed to fetch payroll data: ${error.message}`);
  }

  const salaryPayments: SalaryPaymentItem[] = [];
  const payrollBalances: PayrollBalanceItem[] = [];

  let totalAgreedSalaries = 0;
  let totalPaid = 0;
  let totalOutstandingSalary = 0;

  for (const period of rawPeriods || []) {
    const employeeName = (period as any).employees?.full_name || "Unknown";
    const agreedSalary = Number(period.salary_amount) || 0;
    const periodLabel = `${period.period_start} to ${period.period_end}`;

    const payments = (period as any).salary_payments || [];
    let periodTotalPaid = 0;

    for (const payment of payments) {
      const amountPaid = Number(payment.amount) || 0;
      periodTotalPaid += amountPaid;

      salaryPayments.push({
        employee_name: employeeName,
        payroll_period: periodLabel,
        salary: agreedSalary,
        amount_paid: amountPaid,
        payment_date: payment.payment_date,
        payment_method: payment.method,
        reference_number: payment.reference_number || null,
        recorded_by: payment.profiles?.full_name || "System",
      });
    }

    const outstanding = Math.max(0, agreedSalary - periodTotalPaid);

    payrollBalances.push({
      employee_name: employeeName,
      payroll_period: periodLabel,
      agreed_salary: agreedSalary,
      total_paid: periodTotalPaid,
      outstanding,
    });

    totalAgreedSalaries += agreedSalary;
    totalPaid += periodTotalPaid;
    totalOutstandingSalary += outstanding;
  }

  // Sort payments by payment date descending
  salaryPayments.sort((a, b) => b.payment_date.localeCompare(a.payment_date));

  const summary = {
    totalAgreedSalaries,
    totalPaid,
    totalOutstandingSalary,
  };

  return { salaryPayments, payrollBalances, summary };
}
