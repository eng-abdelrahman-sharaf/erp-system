"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/permissions/permissions";
import { ProfileUpdateSchema } from "@/lib/validations";
import { formatDatabaseError } from "@/lib/utils/errors";

// Initialize Supabase Admin client with service-role key
// This should only be used in server actions, never exposed to the client
import { createClient as createAdminClient } from "@supabase/supabase-js";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

export interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  role_id: string;
}

export type UpdateUserInput = z.infer<typeof ProfileUpdateSchema>;

/**
 * Create a new user with authentication account and profile
 * This uses the service-role key to create the auth user
 */
export async function createUser(input: CreateUserInput) {
  // Check permissions
  const canCreate = await hasPermission("users", "write");
  if (!canCreate) {
    return { error: "Insufficient permissions to create users" };
  }

  try {
    // Create the auth user using admin API
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
      });

    if (authError) {
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: "Failed to create authentication user" };
    }

    // Create the profile record
    const supabase = await createClient();
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      email: input.email,
      full_name: input.full_name,
      role_id: input.role_id,
      status: "active",
    });

    if (profileError) {
      // Rollback: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return { error: formatDatabaseError(profileError) };
    }

    revalidatePath("/users");
    return { success: true, userId: authData.user.id };
  } catch (error) {
    console.error("Create user error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Update user profile
 */
export async function updateUser(input: UpdateUserInput) {
  const canUpdate = await hasPermission("users", "write");
  if (!canUpdate) {
    return { error: "Insufficient permissions to update users" };
  }

  // Validate input using Zod schema
  const validationResult = ProfileUpdateSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      error: validationResult.error.issues[0].message,
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        ...(validationResult.data.full_name && {
          full_name: validationResult.data.full_name,
        }),
        ...(validationResult.data.role_id && {
          role_id: validationResult.data.role_id,
        }),
        ...(validationResult.data.status && {
          status: validationResult.data.status,
        }),
      })
      .eq("id", validationResult.data.id);

    if (error) {
      return { error: formatDatabaseError(error) };
    }

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Update user error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Deactivate or reactivate a user account
 */
export async function setUserStatus(
  userId: string,
  status: "active" | "inactive",
) {
  const canUpdate = await hasPermission("users", "write");
  if (!canUpdate) {
    return { error: "Insufficient permissions to manage user accounts" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ status })
      .eq("id", userId);

    if (error) {
      return { error: formatDatabaseError(error) };
    }

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Set user status error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Delete a user account
 * This deletes both the auth user and the profile
 */
export async function deleteUser(userId: string) {
  const canDelete = await hasPermission("users", "write");
  if (!canDelete) {
    return { error: "Insufficient permissions to delete users" };
  }

  try {
    // Delete the auth user (this will cascade delete the profile due to ON DELETE CASCADE)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      return { error: formatDatabaseError(error) };
    }

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Delete user error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get all users with their roles
 */
export async function getUsers(pagination?: {
  page?: number;
  pageSize?: number;
}) {
  const canRead = await hasPermission("users", "read");
  if (!canRead) {
    return { error: "Insufficient permissions to view users" };
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("profiles")
      .select(
        `
        id,
        full_name,
        email,
        status,
        created_at,
        roles (
          id,
          name
        )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    if (pagination?.page !== undefined && pagination?.pageSize !== undefined) {
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
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
    console.error("Get users error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get the currently logged-in user's profile (full_name, email)
 */
export async function getCurrentUserProfile() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    if (error) return { error: error.message };

    return { success: true, data };
  } catch (error) {
    console.error("Get current user profile error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get a single user by ID
 */
export async function getUserById(userId: string) {
  const canRead = await hasPermission("users", "read");
  if (!canRead) {
    return { error: "Insufficient permissions to view users" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        id,
        full_name,
        email,
        status,
        role_id,
        created_at,
        roles (
          id,
          name,
          description,
          role_permissions (
            module,
            can_read,
            can_write
          )
        )
      `,
      )
      .eq("id", userId)
      .single();

    if (error) {
      return { error: formatDatabaseError(error) };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Get user error:", error);
    return { error: "An unexpected error occurred" };
  }
}
