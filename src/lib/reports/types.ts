export type ReportType =
  | "orders"
  | "inventory"
  | "inventory-activity"
  | "employees"
  | "payroll";

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  warehouseName?: string;
  employeeId?: string;
  employeeName?: string;
  orderStatus?: string;
}

// ----------------------------------------------------
// 1. Orders Report Data
// ----------------------------------------------------
export interface OrderItem {
  order_number: string;
  title: string;
  client_name: string;
  employee_name: string;
  order_date: string;
  status: string;
}

export interface AssignedInventoryItem {
  order_number: string;
  item_name: string;
  sku: string;
  warehouse_name: string;
  quantity: number;
  unit: string;
}

export interface OrdersReportData {
  orders: OrderItem[];
  assignedInventory: AssignedInventoryItem[];
  summary: {
    totalOrders: number;
    pendingOrders: number;
    inProgressOrders: number;
    paidOrders: number;
    cancelledOrders: number;
  };
}

// ----------------------------------------------------
// 2. Inventory Report Data
// ----------------------------------------------------
export interface InventoryStockItem {
  sku: string;
  item_name: string;
  warehouse_name: string;
  total_quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  used_quantity: number;
  unit: string;
}

export interface LowStockItem {
  item_name: string;
  warehouse_name: string;
  available_quantity: number;
  threshold: number;
  unit: string;
}

export interface InventoryReportData {
  stock: InventoryStockItem[];
  lowStockItems: LowStockItem[];
  summary: {
    totalItems: number;
    totalWarehouses: number;
    totalStock: number;
    totalAvailableStock: number;
    totalReservedStock: number;
    totalUsedStock: number;
  };
}

// ----------------------------------------------------
// 3. Inventory Activity Report Data
// ----------------------------------------------------
export interface InventoryActivityItem {
  date: string;
  activity_type: string;
  item_name: string;
  sku: string;
  warehouse_name: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  related_order: string | null;
  performed_by: string;
  notes: string | null;
  transfer_reference?: string | null;
  source_warehouse?: string | null;
  destination_warehouse?: string | null;
}

export interface InventoryActivityReportData {
  activities: InventoryActivityItem[];
  summary: {
    totalAdded: number;
    totalUsed: number;
    totalReserved: number;
    totalReleased: number;
    totalTransferred: number;
  };
}

// ----------------------------------------------------
// 4. Employee Report Data
// ----------------------------------------------------
export interface EmployeeInfoItem {
  employee_id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  salary: number;
  employment_date: string;
  status: string;
}

export interface EmployeeAssignedOrderItem {
  employee_name: string;
  order_number: string;
  title: string;
  client_name: string;
  status: string;
  order_date: string;
}

export interface EmployeePayrollSummaryItem {
  employee_name: string;
  salary: number;
  payroll_period: string;
  total_paid: number;
  outstanding: number;
}

export interface EmployeeReportData {
  employees: EmployeeInfoItem[];
  assignedOrders: EmployeeAssignedOrderItem[];
  payrollSummary: EmployeePayrollSummaryItem[];
  summary: {
    totalEmployees: number;
    activeEmployees: number;
    totalSalaryPayments: number;
    outstandingPayroll: number;
  };
}

// ----------------------------------------------------
// 5. Payroll Report Data
// ----------------------------------------------------
export interface SalaryPaymentItem {
  employee_name: string;
  payroll_period: string;
  salary: number;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  reference_number: string | null;
  recorded_by: string;
}

export interface PayrollBalanceItem {
  employee_name: string;
  payroll_period: string;
  agreed_salary: number;
  total_paid: number;
  outstanding: number;
}

export interface PayrollReportData {
  salaryPayments: SalaryPaymentItem[];
  payrollBalances: PayrollBalanceItem[];
  summary: {
    totalAgreedSalaries: number;
    totalPaid: number;
    totalOutstandingSalary: number;
  };
}
