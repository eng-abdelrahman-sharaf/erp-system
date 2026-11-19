import { createClient } from "@/lib/supabase/client";

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  employeeId?: string;
  orderStatus?: string;
}

export interface OrdersReportData {
  orders: {
    order_number: string;
    title: string;
    client_name: string;
    client_phone: string | null;
    client_address: string | null;
    employee_name: string | null;
    status: string;
    order_date: string;
    inventory_items: string;
    total_quantity: number;
  }[];
  summary: {
    totalOrders: number;
    pendingOrders: number;
    inProgressOrders: number;
    paidOrders: number;
    cancelledOrders: number;
  };
}

export interface InventoryReportData {
  items: {
    item_name: string;
    sku: string;
    warehouse_name: string;
    unit: string;
    total_quantity: number;
    available_quantity: number;
    reserved_quantity: number;
    used_quantity: number;
  }[];
  summary: {
    totalItems: number;
    totalWarehouses: number;
    totalAvailableStock: number;
    totalReservedStock: number;
    totalUsedStock: number;
    lowStockItems: number;
  };
}

export interface InventoryActivityReportData {
  activities: {
    activity_type: string;
    item_name: string;
    warehouse_name: string;
    quantity: number;
    previous_total: number;
    new_total: number;
    previous_reserved: number;
    new_reserved: number;
    previous_used: number;
    new_used: number;
    related_order_number: string | null;
    performed_by_name: string | null;
    created_at: string;
    notes: string | null;
  }[];
  summary: {
    totalActivities: number;
    additions: number;
    manualUsage: number;
    reservations: number;
    releases: number;
    transfers: number;
  };
}

export interface EmployeeReportData {
  employees: {
    full_name: string;
    email: string | null;
    phone: string | null;
    position: string | null;
    salary: number;
    employment_date: string;
    status: string;
    assigned_orders_count: number;
    total_assigned_orders: string;
  }[];
  summary: {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    totalSalary: number;
    totalAssignedOrders: number;
  };
}

export interface PayrollReportData {
  payments: {
    employee_name: string;
    period_start: string;
    period_end: string;
    salary_amount: number;
    payment_amount: number;
    payment_date: string;
    method: string;
    reference_number: string | null;
    notes: string | null;
    recorded_by_name: string | null;
    outstanding: number;
  }[];
  summary: {
    totalPayments: number;
    totalPaidAmount: number;
    totalSalaryAmount: number;
    totalOutstanding: number;
  };
}

export async function fetchOrdersReportData(
  filters: ReportFilters,
): Promise<OrdersReportData> {
  const supabase = await createClient();

  let query = supabase.from("orders").select(`
      order_number,
      title,
      client_name,
      client_phone,
      client_address,
      status,
      order_date,
      employees!inner(full_name),
      order_inventory(
        quantity,
        inventory_items!inner(name)
      )
    `);

  if (filters.startDate) {
    query = query.gte("order_date", filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte("order_date", filters.endDate);
  }
  if (filters.orderStatus) {
    query = query.eq(
      "status",
      filters.orderStatus as "pending" | "in_progress" | "paid" | "cancelled",
    );
  }
  if (filters.employeeId) {
    query = query.eq("employee_id", filters.employeeId);
  }

  const { data: orders, error } = await query.order("order_date", {
    ascending: false,
  });

  if (error) throw error;

  const processedOrders =
    orders?.map((order) => ({
      order_number: order.order_number,
      title: order.title,
      client_name: order.client_name,
      client_phone: order.client_phone,
      client_address: order.client_address,
      employee_name: order.employees?.full_name || null,
      status: order.status,
      order_date: order.order_date,
      inventory_items:
        order.order_inventory
          ?.map(
            (oi: { inventory_items?: { name?: string } }) =>
              oi.inventory_items?.name,
          )
          .join(", ") || "",
      total_quantity:
        order.order_inventory?.reduce(
          (sum: number, oi: { quantity: number }) => sum + oi.quantity,
          0,
        ) || 0,
    })) || [];

  const summary = {
    totalOrders: processedOrders.length,
    pendingOrders: processedOrders.filter((o) => o.status === "pending").length,
    inProgressOrders: processedOrders.filter((o) => o.status === "in_progress")
      .length,
    paidOrders: processedOrders.filter((o) => o.status === "paid").length,
    cancelledOrders: processedOrders.filter((o) => o.status === "cancelled")
      .length,
  };

  return { orders: processedOrders, summary };
}

export async function fetchInventoryReportData(
  filters: ReportFilters,
): Promise<InventoryReportData> {
  const supabase = await createClient();

  let query = supabase.from("inventory_summary").select("*");

  if (filters.warehouseId) {
    query = query.eq("warehouse_id", filters.warehouseId);
  }

  const { data: inventory, error } = await query;

  if (error) throw error;

  const processedItems =
    inventory?.map((item) => ({
      item_name: item.item_name || "",
      sku: item.sku || "",
      warehouse_name: item.warehouse_name || "",
      unit: item.unit || "",
      total_quantity: item.total_quantity || 0,
      available_quantity: item.available_quantity || 0,
      reserved_quantity: item.reserved_quantity || 0,
      used_quantity: item.used_quantity || 0,
    })) || [];

  const uniqueItems = new Set(processedItems.map((i) => i.item_name));
  const uniqueWarehouses = new Set(processedItems.map((i) => i.warehouse_name));
  const lowStockItems = processedItems.filter(
    (i) => (i.available_quantity || 0) < 10,
  ).length;

  const summary = {
    totalItems: uniqueItems.size,
    totalWarehouses: uniqueWarehouses.size,
    totalAvailableStock: processedItems.reduce(
      (sum: number, i: any) => sum + (i.available_quantity || 0),
      0,
    ),
    totalReservedStock: processedItems.reduce(
      (sum: number, i: any) => sum + (i.reserved_quantity || 0),
      0,
    ),
    totalUsedStock: processedItems.reduce(
      (sum: number, i: any) => sum + (i.used_quantity || 0),
      0,
    ),
    lowStockItems,
  };

  return { items: processedItems, summary };
}

export async function fetchInventoryActivityReportData(
  filters: ReportFilters,
): Promise<InventoryActivityReportData> {
  const supabase = await createClient();

  let query = supabase.from("inventory_activity_logs").select(`
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
      inventory_items!inner(name),
      warehouses!inner(name),
      profiles!inner(full_name),
      orders!inner(order_number)
    `);

  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte("created_at", filters.endDate);
  }
  if (filters.warehouseId) {
    query = query.eq("warehouse_id", filters.warehouseId);
  }

  const { data: activities, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) throw error;

  const processedActivities =
    activities?.map((activity) => ({
      activity_type: activity.activity_type,
      item_name: (activity as any).inventory_items?.name || "",
      warehouse_name: (activity as any).warehouses?.name || "",
      quantity: activity.quantity,
      previous_total: activity.previous_total,
      new_total: activity.new_total,
      previous_reserved: activity.previous_reserved,
      new_reserved: activity.new_reserved,
      previous_used: activity.previous_used,
      new_used: activity.new_used,
      related_order_number: (activity as any).orders?.order_number || null,
      performed_by_name: (activity as any).profiles?.full_name || null,
      created_at: activity.created_at,
      notes: activity.notes,
    })) || [];

  const summary = {
    totalActivities: processedActivities.length,
    additions: processedActivities.filter((a) => a.activity_type === "addition")
      .length,
    manualUsage: processedActivities.filter(
      (a) => a.activity_type === "manual_usage",
    ).length,
    reservations: processedActivities.filter(
      (a) => a.activity_type === "reservation",
    ).length,
    releases: processedActivities.filter((a) => a.activity_type === "release")
      .length,
    transfers: processedActivities.filter(
      (a) =>
        a.activity_type === "transfer_out" || a.activity_type === "transfer_in",
    ).length,
  };

  return { activities: processedActivities, summary };
}

export async function fetchEmployeeReportData(
  filters: ReportFilters,
): Promise<EmployeeReportData> {
  const supabase = await createClient();

  let query = supabase.from("employees").select(`
      full_name,
      email,
      phone,
      position,
      salary,
      employment_date,
      status,
      orders!inner(order_number, status)
    `);

  if (filters.employeeId) {
    query = query.eq("id", filters.employeeId);
  }

  const { data: employees, error } = await query;

  if (error) throw error;

  const processedEmployees =
    employees?.map((employee) => {
      const assignedOrders = employee.orders || [];
      return {
        full_name: employee.full_name,
        email: employee.email,
        phone: employee.phone,
        position: employee.position,
        salary: employee.salary,
        employment_date: employee.employment_date,
        status: employee.status,
        assigned_orders_count: assignedOrders.length,
        total_assigned_orders: assignedOrders
          .map((o: any) => o.order_number)
          .join(", "),
      };
    }) || [];

  const summary = {
    totalEmployees: processedEmployees.length,
    activeEmployees: processedEmployees.filter((e) => e.status === "active")
      .length,
    inactiveEmployees: processedEmployees.filter((e) => e.status === "inactive")
      .length,
    totalSalary: processedEmployees.reduce((sum, e) => sum + e.salary, 0),
    totalAssignedOrders: processedEmployees.reduce(
      (sum, e) => sum + e.assigned_orders_count,
      0,
    ),
  };

  return { employees: processedEmployees, summary };
}

export async function fetchPayrollReportData(
  filters: ReportFilters,
): Promise<PayrollReportData> {
  const supabase = await createClient();

  let query = supabase.from("salary_payments").select(`
      amount,
      payment_date,
      method,
      reference_number,
      notes,
      payroll_periods!inner(
        salary_amount,
        period_start,
        period_end,
        employees!inner(full_name)
      ),
      profiles!inner(full_name)
    `);

  if (filters.startDate) {
    query = query.gte("payment_date", filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte("payment_date", filters.endDate);
  }
  if (filters.employeeId) {
    query = query.eq("payroll_periods.employee_id", filters.employeeId);
  }

  const { data: payments, error } = await query.order("payment_date", {
    ascending: false,
  });

  if (error) throw error;

  const processedPayments =
    payments?.map((payment) => {
      const period = payment.payroll_periods;
      const employee = period?.employees;
      return {
        employee_name: employee?.full_name || "",
        period_start: period?.period_start || "",
        period_end: period?.period_end || "",
        salary_amount: period?.salary_amount || 0,
        payment_amount: payment.amount,
        payment_date: payment.payment_date,
        method: payment.method,
        reference_number: payment.reference_number,
        notes: payment.notes,
        recorded_by_name: payment.profiles?.full_name || null,
        outstanding: (period?.salary_amount || 0) - payment.amount,
      };
    }) || [];

  const summary = {
    totalPayments: processedPayments.length,
    totalPaidAmount: processedPayments.reduce(
      (sum, p) => sum + p.payment_amount,
      0,
    ),
    totalSalaryAmount: processedPayments.reduce(
      (sum, p) => sum + p.salary_amount,
      0,
    ),
    totalOutstanding: processedPayments.reduce(
      (sum, p) => sum + p.outstanding,
      0,
    ),
  };

  return { payments: processedPayments, summary };
}
