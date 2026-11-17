"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/permissions/permissions";

export interface CreateEmployeeInput {
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  position?: string;
  salary: number;
  employment_date: string;
  status?: "active" | "inactive";
  notes?: string;
}

export interface UpdateEmployeeInput {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  position?: string;
  salary?: number;
  employment_date?: string;
  status?: "active" | "inactive";
  notes?: string;
}

/**
 * Create a new employee
 */
export async function createEmployee(input: CreateEmployeeInput) {
  const canCreate = await hasPermission("employees", "write");
  if (!canCreate) {
    return { error: "Insufficient permissions to create employees" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("employees").insert({
      full_name: input.full_name,
      email: input.email || null,
      phone: input.phone || null,
      address: input.address || null,
      position: input.position || null,
      salary: input.salary,
      employment_date: input.employment_date,
      status: input.status || "active",
      notes: input.notes || null,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/employees");
    return { success: true };
  } catch (error) {
    console.error("Create employee error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Update employee details
 */
export async function updateEmployee(input: UpdateEmployeeInput) {
  const canUpdate = await hasPermission("employees", "write");
  if (!canUpdate) {
    return { error: "Insufficient permissions to update employees" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("employees")
      .update({
        ...(input.full_name !== undefined && { full_name: input.full_name }),
        ...(input.email !== undefined && { email: input.email || null }),
        ...(input.phone !== undefined && { phone: input.phone || null }),
        ...(input.address !== undefined && { address: input.address || null }),
        ...(input.position !== undefined && { position: input.position || null }),
        ...(input.salary !== undefined && { salary: input.salary }),
        ...(input.employment_date !== undefined && {
          employment_date: input.employment_date,
        }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.notes !== undefined && { notes: input.notes || null }),
      })
      .eq("id", input.id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/employees");
    revalidatePath(`/employees/${input.id}`);
    return { success: true };
  } catch (error) {
    console.error("Update employee error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Delete an employee
 */
export async function deleteEmployee(employeeId: string) {
  const canDelete = await hasPermission("employees", "write");
  if (!canDelete) {
    return { error: "Insufficient permissions to delete employees" };
  }

  try {
    const supabase = await createClient();

    // Check if employee has assigned orders
    const { data: orders, error: checkError } = await supabase
      .from("orders")
      .select("id")
      .eq("employee_id", employeeId)
      .limit(1);

    if (checkError) {
      return { error: checkError.message };
    }

    if (orders && orders.length > 0) {
      return { error: "Cannot delete employee with assigned orders" };
    }

    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", employeeId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/employees");
    return { success: true };
  } catch (error) {
    console.error("Delete employee error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get all employees with optional filters
 */
export async function getEmployees(filters?: {
  search?: string;
  status?: "active" | "inactive";
}) {
  const canRead = await hasPermission("employees", "read");
  if (!canRead) {
    return { error: "Insufficient permissions to view employees" };
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,position.ilike.%${filters.search}%`,
      );
    }

    const { data, error } = await query;

    if (error) {
      return { error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Get employees error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get a single employee by ID
 */
export async function getEmployeeById(employeeId: string) {
  const canRead = await hasPermission("employees", "read");
  if (!canRead) {
    return { error: "Insufficient permissions to view employees" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .single();

    if (error) {
      return { error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Get employee error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get orders assigned to an employee
 */
export async function getEmployeeOrders(employeeId: string) {
  const canRead = await hasPermission("orders", "read");
  if (!canRead) {
    return { error: "Insufficient permissions to view orders" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, title, client_name, status, order_date")
      .eq("employee_id", employeeId)
      .order("order_date", { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Get employee orders error:", error);
    return { error: "An unexpected error occurred" };
  }
}
