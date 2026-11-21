"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/permissions/permissions";
import { formatDatabaseError } from "@/lib/utils/errors";

export interface CreatePayrollPeriodInput {
  employee_id: string;
  period_start: string;
  period_end: string;
  salary_amount: number;
}

export interface RecordSalaryPaymentInput {
  payroll_period_id: string;
  amount: number;
  payment_date: string;
  method: "cash" | "bank_transfer" | "instapay" | "check" | "other";
  reference_number?: string | null;
  notes?: string | null;
}

/**
 * Create a payroll period for an employee
 */
export async function createPayrollPeriod(input: CreatePayrollPeriodInput) {
  const canCreate = await hasPermission("employees", "write");
  if (!canCreate) {
    return { error: "Insufficient permissions to create payroll periods" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("payroll_periods").insert({
      employee_id: input.employee_id,
      period_start: input.period_start,
      period_end: input.period_end,
      salary_amount: input.salary_amount,
    });

    if (error) {
      return { error: formatDatabaseError(error) };
    }

    revalidatePath("/employees");
    revalidatePath(`/employees/${input.employee_id}`);
    return { success: true };
  } catch (error) {
    console.error("Create payroll period error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Delete a payroll period
 */
export async function deletePayrollPeriod(
  periodId: string,
  employeeId: string,
) {
  const canDelete = await hasPermission("employees", "write");
  if (!canDelete) {
    return { error: "Insufficient permissions to delete payroll periods" };
  }

  try {
    const supabase = await createClient();

    // Check if period has payments
    const { data: payments, error: checkError } = await supabase
      .from("salary_payments")
      .select("id")
      .eq("payroll_period_id", periodId)
      .limit(1);

    if (checkError) {
      return { error: checkError.message };
    }

    if (payments && payments.length > 0) {
      return { error: "Cannot delete payroll period with recorded payments" };
    }

    const { error } = await supabase
      .from("payroll_periods")
      .delete()
      .eq("id", periodId);

    if (error) {
      return { error: formatDatabaseError(error) };
    }

    revalidatePath("/employees");
    revalidatePath(`/employees/${employeeId}`);
    return { success: true };
  } catch (error) {
    console.error("Delete payroll period error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Record a salary payment using the RPC function
 */
export async function recordSalaryPayment(input: RecordSalaryPaymentInput) {
  const canCreate = await hasPermission("employees", "write");
  if (!canCreate) {
    return { error: "Insufficient permissions to record salary payments" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("record_salary_payment", {
      p_payroll_period_id: input.payroll_period_id,
      p_amount: input.amount,
      p_payment_date: input.payment_date,
      p_method: input.method,
      p_reference_number: input.reference_number || undefined,
      p_notes: input.notes || undefined,
    });

    if (error) {
      return { error: formatDatabaseError(error) };
    }

    revalidatePath("/employees");
    revalidatePath(`/employees/[id]`);
    return { success: true, paymentId: data };
  } catch (error) {
    console.error("Record salary payment error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get payroll periods for an employee
 */
export async function getPayrollPeriods(employeeId: string) {
  const canRead = await hasPermission("employees", "read");
  if (!canRead) {
    return { error: "Insufficient permissions to view payroll" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payroll_periods")
      .select("*")
      .eq("employee_id", employeeId)
      .order("period_start", { ascending: false });

    if (error) {
      return { error: formatDatabaseError(error) };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Get payroll periods error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get payroll summary using the database view
 */
export async function getPayrollSummary(
  employeeId?: string,
  page?: number,
  pageSize?: number,
) {
  const canRead = await hasPermission("employees", "read");
  if (!canRead) {
    return { error: "Insufficient permissions to view payroll" };
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("payroll_summary")
      .select("*", { count: "exact" });

    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    query = query.order("period_start", { ascending: false });

    if (page !== undefined && pageSize !== undefined) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        return { error: formatDatabaseError(error) };
      }

      return { success: true, data: data || [], total: count || 0 };
    }

    const { data, error } = await query;

    if (error) {
      return { error: formatDatabaseError(error) };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Get payroll summary error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get salary payments for a payroll period
 */
export async function getSalaryPayments(payrollPeriodId: string) {
  const canRead = await hasPermission("employees", "read");
  if (!canRead) {
    return { error: "Insufficient permissions to view salary payments" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("salary_payments")
      .select(
        `
        *,
        profiles (
          full_name
        )
      `,
      )
      .eq("payroll_period_id", payrollPeriodId)
      .order("payment_date", { ascending: false });

    if (error) {
      return { error: formatDatabaseError(error) };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Get salary payments error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get all salary payments for an employee
 */
export async function getEmployeeSalaryPayments(
  employeeId: string,
  page?: number,
  pageSize?: number,
) {
  const canRead = await hasPermission("employees", "read");
  if (!canRead) {
    return { error: "Insufficient permissions to view salary payments" };
  }

  try {
    const supabase = await createClient();

    // First get all payroll period IDs for this employee
    const { data: periods, error: periodsError } = await supabase
      .from("payroll_periods")
      .select("id")
      .eq("employee_id", employeeId);

    if (periodsError) {
      return { error: periodsError.message };
    }

    if (!periods || periods.length === 0) {
      return page !== undefined
        ? { success: true, data: [], total: 0 }
        : { success: true, data: [] };
    }

    const periodIds = periods.map((p) => p.id);

    // Then get all payments for those periods
    let query = supabase
      .from("salary_payments")
      .select(
        `
        *,
        payroll_periods (
          period_start,
          period_end
        ),
        profiles (
          full_name
        )
      `,
        { count: "exact" },
      )
      .in("payroll_period_id", periodIds)
      .order("payment_date", { ascending: false });

    if (page !== undefined && pageSize !== undefined) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        return { error: formatDatabaseError(error) };
      }

      return { success: true, data: data || [], total: count || 0 };
    }

    const { data, error } = await query;

    if (error) {
      return { error: formatDatabaseError(error) };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Get employee salary payments error:", error);
    return { error: "An unexpected error occurred" };
  }
}
