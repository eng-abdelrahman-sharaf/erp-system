import { createClient } from "@/lib/supabase/server";

export type ModuleName = "users" | "orders" | "employees" | "inventory";
export type PermissionType = "read" | "write";

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  status: "active" | "inactive";
  role_id: string;
  roles: {
    id: string;
    name: string;
    description: string | null;
    role_permissions: {
      module: ModuleName;
      can_read: boolean;
      can_write: boolean;
    }[];
  };
}

/**
 * Check if the current user has permission for a specific module and action
 * This uses the SQL function has_module_permission which enforces RLS
 */
export async function hasPermission(
  module: ModuleName,
  type: PermissionType = "read",
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("has_module_permission", {
    p_module: module,
    p_write: type === "write",
  });

  if (error) {
    console.error("Permission check error:", error);
    return false;
  }

  return data ?? false;
}

/**
 * Get the current user's profile with role and permissions
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      email,
      status,
      role_id,
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
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return profile as UserProfile;
}

/**
 * Check if the current user's account is active
 */
export async function isUserActive(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.status === "active";
}
