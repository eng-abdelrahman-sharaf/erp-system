"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  Order,
  OrderInput,
  OrderWithEmployee,
  OrderInventoryWithDetails,
  OrderNoteWithProfile,
  OrderActivityLogWithProfile,
} from "./types";
import { revalidatePath } from "next/cache";

export async function getOrders(filters?: {
  search?: string;
  status?: "pending" | "in_progress" | "paid" | "cancelled";
  employee_id?: string;
  sortBy?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select(
      `
      *,
      employees (id, full_name)
    `,
    )
    .order("created_at", { ascending: false });

  if (filters?.search) {
    query = query.or(
      `order_number.ilike.%${filters.search}%,title.ilike.%${filters.search}%,client_name.ilike.%${filters.search}%`,
    );
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.employee_id) {
    query = query.eq("employee_id", filters.employee_id);
  }

  if (filters?.sortBy) {
    const [field, direction] = filters.sortBy.split("-");
    const validFields = [
      "order_number",
      "title",
      "client_name",
      "order_date",
      "status",
      "created_at",
    ] as const;
    if (validFields.includes(field as (typeof validFields)[number])) {
      query = query.order(
        field as
          | "order_number"
          | "title"
          | "client_name"
          | "order_date"
          | "status"
          | "created_at",
        {
          ascending: direction === "asc",
        },
      );
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }

  return data as OrderWithEmployee[];
}

export async function getOrder(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      employees (id, full_name)
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching order:", error);
    return null;
  }

  return data as unknown as OrderWithEmployee;
}

export async function createOrder(order: OrderInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .insert(order)
    .select()
    .single();

  if (error) {
    console.error("Error creating order:", error);
    throw error;
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return data as Order;
}

export async function updateOrderStatus(
  id: string,
  status: "pending" | "in_progress",
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating order status:", error);
    throw error;
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  revalidatePath("/dashboard");
  return data as Order;
}

export async function updateOrder(id: string, order: Partial<OrderInput>) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .update(order)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating order:", error);
    throw error;
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  revalidatePath("/dashboard");
  return data as Order;
}

export async function deleteOrder(id: string) {
  const supabase = await createClient();

  // Check if order has inventory assignments
  const { data: inventoryData } = await supabase
    .from("order_inventory")
    .select("id")
    .eq("order_id", id)
    .limit(1);

  if (inventoryData && inventoryData.length > 0) {
    throw new Error(
      "Cannot delete order with assigned inventory. Cancel the order first.",
    );
  }

  const { error } = await supabase.from("orders").delete().eq("id", id);

  if (error) {
    console.error("Error deleting order:", error);
    throw error;
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard");
}

export async function getOrderInventory(orderId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("order_inventory")
    .select(
      `
      *,
      inventory_items (id, name, sku),
      warehouses (id, name)
    `,
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching order inventory:", error);
    return [];
  }

  return data as OrderInventoryWithDetails[];
}

export async function reserveOrderInventory(
  orderId: string,
  itemId: string,
  warehouseId: string,
  quantity: number,
) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("reserve_order_inventory", {
    p_order_id: orderId,
    p_item_id: itemId,
    p_warehouse_id: warehouseId,
    p_quantity: quantity,
  });

  if (error) {
    console.error("Error reserving order inventory:", error);
    throw error;
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/inventory");
  return data;
}

export async function removeOrderInventory(
  orderInventoryId: string,
  orderId: string,
) {
  const supabase = await createClient();

  // Get the order inventory record first
  const { data: orderInventory } = await supabase
    .from("order_inventory")
    .select("*")
    .eq("id", orderInventoryId)
    .single();

  if (!orderInventory) {
    throw new Error("Order inventory not found");
  }

  // Check if order is still pending or in_progress
  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (
    !order ||
    (order.status !== "pending" && order.status !== "in_progress")
  ) {
    throw new Error(
      "Can only remove inventory from pending or in-progress orders",
    );
  }

  // Get current stock for logging
  const { data: stockBefore } = await supabase
    .from("warehouse_stock")
    .select("*")
    .eq("item_id", orderInventory.item_id)
    .eq("warehouse_id", orderInventory.warehouse_id)
    .single();

  if (!stockBefore) {
    throw new Error("Stock record not found");
  }

  // Release the reserved stock using direct SQL
  const { error: stockError } = await supabase
    .from("warehouse_stock")
    .update({
      reserved_quantity:
        stockBefore.reserved_quantity - orderInventory.quantity,
    })
    .eq("item_id", orderInventory.item_id)
    .eq("warehouse_id", orderInventory.warehouse_id);

  if (stockError) {
    console.error("Error releasing stock:", stockError);
    throw stockError;
  }

  // Log the release activity
  await supabase.from("inventory_activity_logs").insert({
    item_id: orderInventory.item_id,
    warehouse_id: orderInventory.warehouse_id,
    activity_type: "release",
    quantity: orderInventory.quantity,
    previous_total: stockBefore.total_quantity,
    new_total: stockBefore.total_quantity,
    previous_reserved: stockBefore.reserved_quantity,
    new_reserved: stockBefore.reserved_quantity - orderInventory.quantity,
    previous_used: stockBefore.used_quantity,
    new_used: stockBefore.used_quantity,
    related_order_id: orderId,
  });

  // Delete the order inventory record
  const { error } = await supabase
    .from("order_inventory")
    .delete()
    .eq("id", orderInventoryId);

  if (error) {
    console.error("Error removing order inventory:", error);
    throw error;
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/inventory");
}

export async function changeOrderStatus(
  orderId: string,
  newStatus: "pending" | "in_progress" | "paid" | "cancelled",
) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("change_order_status", {
    p_order_id: orderId,
    p_new_status: newStatus,
  });

  if (error) {
    console.error("Error changing order status:", error);
    throw error;
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
}

export async function getOrderNotes(orderId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("order_notes")
    .select(
      `
      *,
      profiles (id, full_name)
    `,
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching order notes:", error);
    return [];
  }

  return data as OrderNoteWithProfile[];
}

export async function addOrderNote(orderId: string, content: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("order_notes")
    .insert({
      order_id: orderId,
      content: content,
    })
    .select(
      `
      *,
      profiles (id, full_name)
    `,
    )
    .single();

  if (error) {
    console.error("Error adding order note:", error);
    throw error;
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return data as OrderNoteWithProfile;
}

export async function getOrderActivityLogs(orderId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("order_activity_logs")
    .select(
      `
      *,
      profiles (id, full_name)
    `,
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching order activity logs:", error);
    return [];
  }

  return data as OrderActivityLogWithProfile[];
}

export async function getActiveEmployees() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employees")
    .select("id, full_name")
    .eq("status", "active")
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Error fetching active employees:", error);
    return [];
  }

  return data;
}

export async function getInventoryItems() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventory_items")
    .select("id, name, sku, unit")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching inventory items:", error);
    return [];
  }

  return data;
}

export async function getWarehouses() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("warehouses")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching warehouses:", error);
    return [];
  }

  return data;
}

export async function getWarehouseStock(itemId: string, warehouseId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("warehouse_stock")
    .select("*")
    .eq("item_id", itemId)
    .eq("warehouse_id", warehouseId)
    .single();

  if (error) {
    console.error("Error fetching warehouse stock:", error);
    return null;
  }

  return data;
}
