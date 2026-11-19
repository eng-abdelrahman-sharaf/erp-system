export interface DashboardMetrics {
  orders: {
    total: number;
    pending: number;
    inProgress: number;
    paid: number;
    cancelled: number;
  };
  inventory: {
    totalItems: number;
    totalWarehouses: number;
    availableStock: number;
    reservedStock: number;
    usedStock: number;
    lowStockItems: number;
  };
  employees: {
    total: number;
    active: number;
    totalSalaryPayments: number;
    outstandingPayroll: number;
  };
}

export interface OrderVolumeData {
  date: string;
  count: number;
}

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  employeeId?: string;
  orderStatus?: "pending" | "in_progress" | "paid" | "cancelled";
  lowStockThreshold?: number;
}
