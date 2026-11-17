export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  unit: string;
  created_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  created_at: string;
}

export interface WarehouseStock {
  id: string;
  item_id: string;
  warehouse_id: string;
  total_quantity: number;
  reserved_quantity: number;
  used_quantity: number;
  available_quantity: number | null;
  updated_at: string;
}

export interface InventorySummary {
  item_id: string | null;
  item_name: string | null;
  sku: string | null;
  unit: string | null;
  warehouse_id: string | null;
  warehouse_name: string | null;
  total_quantity: number | null;
  available_quantity: number | null;
  reserved_quantity: number | null;
  used_quantity: number | null;
}

export interface InventoryActivityLog {
  id: string;
  item_id: string;
  warehouse_id: string;
  activity_type: 'addition' | 'manual_usage' | 'reservation' | 'release' | 'consumption' | 'transfer_out' | 'transfer_in';
  quantity: number;
  previous_total: number;
  new_total: number;
  previous_reserved: number;
  new_reserved: number;
  previous_used: number;
  new_used: number;
  related_order_id: string | null;
  transfer_id: string | null;
  performed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface WarehouseTransfer {
  id: string;
  item_id: string;
  source_warehouse_id: string;
  destination_warehouse_id: string;
  quantity: number;
  transfer_date: string;
  notes: string | null;
  performed_by: string | null;
  created_at: string;
}
