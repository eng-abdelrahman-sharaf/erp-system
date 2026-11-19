export interface Order {
  id: string;
  order_number: string;
  title: string;
  description: string | null;
  client_name: string;
  client_phone: string | null;
  client_address: string | null;
  employee_id: string | null;
  status: "pending" | "in_progress" | "paid" | "cancelled";
  order_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderInput = Omit<
  Order,
  "id" | "created_at" | "updated_at" | "created_by"
>;

export interface OrderWithEmployee extends Order {
  employees: {
    id: string;
    full_name: string;
  } | null;
}

export interface OrderInventory {
  id: string;
  order_id: string;
  item_id: string;
  warehouse_id: string;
  quantity: number;
  unit: string;
  created_at: string;
}

export interface OrderInventoryWithDetails extends OrderInventory {
  inventory_items: {
    id: string;
    name: string;
    sku: string;
  };
  warehouses: {
    id: string;
    name: string;
  };
}

export interface OrderNote {
  id: string;
  order_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
}

export interface OrderNoteWithProfile extends OrderNote {
  profiles: {
    id: string;
    full_name: string;
  } | null;
}

export interface OrderActivityLog {
  id: string;
  order_id: string;
  activity_type: string;
  description: string;
  performed_by: string | null;
  created_at: string;
}

export interface OrderActivityLogWithProfile extends OrderActivityLog {
  profiles: {
    id: string;
    full_name: string;
  } | null;
}
