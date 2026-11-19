"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/permissions/permissions";
import { ModuleName } from "@/lib/permissions/permissions";
import {
  RoleSchema,
  RoleCreateSchema,
  RoleUpdateSchema,
  RolePermissionSchema,
} from "@/lib/validations";

export type CreateRoleInput = Omit<
  z.infer<typeof RoleSchema>,
  "id" | "created_at"
>;

export type UpdateRoleInput = z.infer<typeof RoleUpdateSchema>;

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

  // Validate input using Zod schema
  const validationResult = RoleCreateSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      error: validationResult.error.issues[0].message,
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("roles").insert({
      name: validationResult.data.name,
      description: validationResult.data.description || null,
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

  // Validate input using Zod schema
  const validationResult = RoleUpdateSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      error: validationResult.error.issues[0].message,
    };
  }

  try {
    const supabase = await createClient();

    // Prevent renaming the Admin role
    if (validationResult.data.name) {
      const { data: role } = await supabase
        .from("roles")
        .select("name")
        .eq("id", validationResult.data.id)
        .single();

      if (role?.name === "Admin") {
        return { error: "The Admin role cannot be renamed" };
      }
    }

    const { error } = await supabase
      .from("roles")
      .update({
        ...(validationResult.data.name && { name: validationResult.data.name }),
        ...(validationResult.data.description !== undefined && {
          description: validationResult.data.description,
        }),
      })
      .eq("id", validationResult.data.id);

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

    // Prevent deleting the Admin role
    const { data: role } = await supabase
      .from("roles")
      .select("name")
      .eq("id", roleId)
      .single();

    if (role?.name === "Admin") {
      return { error: "The Admin role cannot be deleted" };
    }

    // Check if any users are assigned to this role
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

    // Get the role name to check constraints
    const { data: role } = await supabase
      .from("roles")
      .select("name")
      .eq("id", input.role_id)
      .single();

    if (!role) {
      return { error: "Role not found" };
    }

    // Prevent non-admin roles from having write permission for users module
    if (role.name !== "Admin") {
      const usersWritePerm = input.permissions.find(
        (p) => p.module === "users" && p.can_write,
      );
      if (usersWritePerm) {
        return {
          error:
            "Only the Admin role can have write permissions for the users module",
        };
      }
    }

    // Admin role must retain full permissions for all modules
    if (role.name === "Admin") {
      const modules: ModuleName[] = [
        "users",
        "orders",
        "employees",
        "inventory",
      ];
      for (const mod of modules) {
        const perm = input.permissions.find((p) => p.module === mod);
        if (!perm || !perm.can_read || !perm.can_write) {
          return {
            error:
              "The Admin role must have full read and write permissions for all modules",
          };
        }
      }
    }

    // Delete existing permissions for this role
    const { error: deleteError } = await supabase
      .from("role_permissions")
      .delete()
      .eq("role_id", input.role_id);

    if (deleteError) {
      return { error: deleteError.message };
    }

    // Insert new permissions
    if (input.permissions.length > 0) {
      // Validate each permission using Zod schema
      const permissionsToInsert = input.permissions.map((p) => {
        const permValidation = RolePermissionSchema.safeParse({
          role_id: input.role_id,
          module: p.module,
          can_read: p.can_read,
          can_write: p.can_write,
        });
        if (!permValidation.success) {
          throw new Error(permValidation.error.issues[0].message);
        }
        return {
          role_id: input.role_id,
          module: p.module,
          can_read: p.can_read,
          can_write: p.can_write,
        };
      });

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
