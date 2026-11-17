"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/permissions/permissions";
import { ModuleName } from "@/lib/permissions/permissions";

export interface CreateRoleInput {
  name: string;
  description?: string;
}

export interface UpdateRoleInput {
  id: string;
  name?: string;
  description?: string;
}

export interface UpdatePermissionsInput {
  role_id: string;
  permissions: {
    module: ModuleName;
    can_read: boolean;
    can_write: boolean;
  }[];
}

/**
 * Create a new role
 */
export async function createRole(input: CreateRoleInput) {
  const canCreate = await hasPermission("users", "write");
  if (!canCreate) {
    return { error: "Insufficient permissions to create roles" };
  }

  try {
    const supabase = await createClient();
    // @ts-ignore - Database types not generated yet
    const { error } = await supabase.from("roles").insert({
      name: input.name,
      description: input.description || null,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Create role error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Update role details
 */
export async function updateRole(input: UpdateRoleInput) {
  const canUpdate = await hasPermission("users", "write");
  if (!canUpdate) {
    return { error: "Insufficient permissions to update roles" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("roles")
      .update({
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
      })
      .eq("id", input.id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Update role error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Delete a role (only if no users are assigned)
 */
export async function deleteRole(roleId: string) {
  const canDelete = await hasPermission("users", "write");
  if (!canDelete) {
    return { error: "Insufficient permissions to delete roles" };
  }

  try {
    const supabase = await createClient();

    // Check if any users are assigned to this role
    // @ts-ignore - Database types not generated yet
    const { data: users, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role_id", roleId)
      .limit(1);

    if (checkError) {
      return { error: checkError.message };
    }

    if (users && users.length > 0) {
      return { error: "Cannot delete role with assigned users" };
    }

    // Delete the role (this will cascade delete permissions due to ON DELETE CASCADE)
    // @ts-ignore - Database types not generated yet
    const { error } = await supabase.from("roles").delete().eq("id", roleId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Delete role error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Update role permissions
 */
export async function updateRolePermissions(input: UpdatePermissionsInput) {
  const canUpdate = await hasPermission("users", "write");
  if (!canUpdate) {
    return { error: "Insufficient permissions to update permissions" };
  }

  try {
    const supabase = await createClient();

    // Delete existing permissions for this role
    // @ts-ignore - Database types not generated yet
    const { error: deleteError } = await supabase
      .from("role_permissions")
      .delete()
      .eq("role_id", input.role_id);

    if (deleteError) {
      return { error: deleteError.message };
    }

    // Insert new permissions
    if (input.permissions.length > 0) {
      const permissionsToInsert = input.permissions.map((p) => ({
        role_id: input.role_id,
        module: p.module,
        can_read: p.can_read,
        can_write: p.can_write,
      }));

      const { error: insertError } = await supabase
        .from("role_permissions")
        .insert(permissionsToInsert);

      if (insertError) {
        return { error: insertError.message };
      }
    }

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Update role permissions error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get all roles with their permissions
 */
export async function getRoles() {
  const canRead = await hasPermission("users", "read");
  if (!canRead) {
    return { error: "Insufficient permissions to view roles" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("roles")
      .select(
        `
        id,
        name,
        description,
        created_at,
        role_permissions (
          module,
          can_read,
          can_write
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Get roles error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get a single role by ID with permissions
 */
export async function getRoleById(roleId: string) {
  const canRead = await hasPermission("users", "read");
  if (!canRead) {
    return { error: "Insufficient permissions to view roles" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("roles")
      .select(
        `
        id,
        name,
        description,
        created_at,
        role_permissions (
          module,
          can_read,
          can_write
        )
      `,
      )
      .eq("id", roleId)
      .single();

    if (error) {
      return { error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Get role error:", error);
    return { error: "An unexpected error occurred" };
  }
}
