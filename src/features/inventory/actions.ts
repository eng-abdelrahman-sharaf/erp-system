"use server";

import { createClient } from "@/lib/supabase/client";
import type { InventoryItem, Warehouse } from "./types";
import { revalidatePath } from "next/cache";

export async function getInventoryItems(search?: string, sortBy?: string) {
  const supabase = createClient();

  let query = supabase
    .from("inventory_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  }

  if (sortBy) {
    const [field, direction] = sortBy.split("-");
    const validFields = ["name", "sku", "created_at"] as const;
    if (validFields.includes(field as (typeof validFields)[number])) {
      query = query.order(field as "name" | "sku" | "created_at", {
        ascending: direction === "asc",
      });
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching inventory items:", error);
    return [];
  }

  return data as InventoryItem[];
}

export async function getInventoryItem(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching inventory item:", error);
    return null;
  }

  return data as InventoryItem;
}

export async function createInventoryItem(
  item: Omit<InventoryItem, "id" | "created_at">,
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("inventory_items")
    .insert(item)
    .select()
    .single();

  if (error) {
    console.error("Error creating inventory item:", error);
    throw error;
  }

  revalidatePath("/inventory");
  return data as InventoryItem;
}

export async function updateInventoryItem(
  id: string,
  item: Partial<Omit<InventoryItem, "id" | "created_at">>,
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("inventory_items")
    .update(item)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating inventory item:", error);
    throw error;
  }

  revalidatePath("/inventory");
  revalidatePath(`/inventory/items/${id}`);
  return data as InventoryItem;
}

export async function deleteInventoryItem(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("inventory_items")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting inventory item:", error);
    throw error;
  }

  revalidatePath("/inventory");
}

export async function getWarehouses(search?: string) {
  const supabase = createClient();

  let query = supabase
    .from("warehouses")
    .select("*")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching warehouses:", error);
    return [];
  }

  return data as Warehouse[];
}

export async function getWarehouse(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("warehouses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching warehouse:", error);
    return null;
  }

  return data as Warehouse;
}

export async function createWarehouse(
  warehouse: Omit<Warehouse, "id" | "created_at">,
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("warehouses")
    .insert(warehouse)
    .select()
    .single();

  if (error) {
    console.error("Error creating warehouse:", error);
    throw error;
  }

  revalidatePath("/warehouses");
  return data as Warehouse;
}

export async function updateWarehouse(
  id: string,
  warehouse: Partial<Omit<Warehouse, "id" | "created_at">>,
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("warehouses")
    .update(warehouse)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating warehouse:", error);
    throw error;
  }

  revalidatePath("/warehouses");
  revalidatePath(`/warehouses/${id}`);
  return data as Warehouse;
}

export async function deleteWarehouse(id: string) {
  const supabase = createClient();

  // Check if warehouse has stock
  const { data: stockData } = await supabase
    .from("warehouse_stock")
    .select("id")
    .eq("warehouse_id", id)
    .limit(1);

  if (stockData && stockData.length > 0) {
    throw new Error("Cannot delete warehouse with existing stock records");
  }

  const { error } = await supabase.from("warehouses").delete().eq("id", id);

  if (error) {
    console.error("Error deleting warehouse:", error);
    throw error;
  }

  revalidatePath("/warehouses");
}

export async function getInventorySummary(filters?: {
  item_id?: string;
  warehouse_id?: string;
}) {
  const supabase = createClient();

  let query = supabase
    .from("inventory_summary")
    .select("*")
    .order("item_name", { ascending: true });

  if (filters?.item_id) {
    query = query.eq("item_id", filters.item_id);
  }

  if (filters?.warehouse_id) {
    query = query.eq("warehouse_id", filters.warehouse_id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching inventory summary:", error);
    return [];
  }

  return data;
}

export async function adjustInventory(
  itemId: string,
  warehouseId: string,
  activity: "addition" | "manual_usage",
  quantity: number,
  notes?: string,
) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("adjust_inventory", {
    p_item_id: itemId,
    p_warehouse_id: warehouseId,
    p_activity: activity,
    p_quantity: quantity,
    p_notes: notes,
  });

  if (error) {
    console.error("Error adjusting inventory:", error);
    throw error;
  }

  revalidatePath("/inventory");
  revalidatePath("/inventory/stock");
  revalidatePath("/inventory/activity");
  return data;
}

export async function transferInventory(
  itemId: string,
  sourceWarehouseId: string,
  destinationWarehouseId: string,
  quantity: number,
  notes?: string,
) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("transfer_inventory", {
    p_item_id: itemId,
    p_source_warehouse_id: sourceWarehouseId,
    p_destination_warehouse_id: destinationWarehouseId,
    p_quantity: quantity,
    p_notes: notes,
  });

  if (error) {
    console.error("Error transferring inventory:", error);
    throw error;
  }

  revalidatePath("/inventory");
  revalidatePath("/inventory/stock");
  revalidatePath("/inventory/transfers");
  revalidatePath("/inventory/activity");
  return data;
}

export async function getInventoryActivityLogs(filters?: {
  item_id?: string;
  warehouse_id?: string;
  activity_type?: string;
}) {
  const supabase = createClient();

  let query = supabase
    .from("inventory_activity_logs")
    .select(
      `
      *,
      inventory_items (name, sku),
      warehouses (name),
      profiles (full_name),
      orders (order_number)
    `,
    )
    .order("created_at", { ascending: false });

  if (filters?.item_id) {
    query = query.eq("item_id", filters.item_id);
  }

  if (filters?.warehouse_id) {
    query = query.eq("warehouse_id", filters.warehouse_id);
  }

  if (filters?.activity_type) {
    query = query.eq(
      "activity_type",
      filters.activity_type as
        | "addition"
        | "manual_usage"
        | "reservation"
        | "release"
        | "consumption"
        | "transfer_out"
        | "transfer_in",
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching activity logs:", error);
    return [];
  }

  return data;
}

export async function getWarehouseTransfers(filters?: {
  item_id?: string;
  source_warehouse_id?: string;
  destination_warehouse_id?: string;
}) {
  const supabase = createClient();

  let query = supabase
    .from("warehouse_transfers")
    .select(
      `
      *,
      inventory_items (name, sku),
      source_warehouse:warehouses!warehouse_transfers_source_warehouse_id_fkey (name),
      destination_warehouse:warehouses!warehouse_transfers_destination_warehouse_id_fkey (name),
      profiles (full_name)
    `,
    )
    .order("transfer_date", { ascending: false });

  if (filters?.item_id) {
    query = query.eq("item_id", filters.item_id);
  }

  if (filters?.source_warehouse_id) {
    query = query.eq("source_warehouse_id", filters.source_warehouse_id);
  }

  if (filters?.destination_warehouse_id) {
    query = query.eq(
      "destination_warehouse_id",
      filters.destination_warehouse_id,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching transfers:", error);
    return [];
  }

  return data;
}

export async function getWarehouseStock(warehouseId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("inventory_summary")
    .select("*")
    .eq("warehouse_id", warehouseId)
    .order("item_name", { ascending: true });

  if (error) {
    console.error("Error fetching warehouse stock:", error);
    return [];
  }

  return data;
}
