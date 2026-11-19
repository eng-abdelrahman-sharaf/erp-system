"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import {
  Select as SelectShadcn,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/SelectShadcn";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Label } from "@/components/ui/Label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Plus, Edit, Trash2, Shield } from "lucide-react";
import {
  getUsers,
  createUser,
  updateUser,
  setUserStatus,
  deleteUser,
} from "@/app/actions/users";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  updateRolePermissions,
} from "@/app/actions/roles";
import { ModuleName } from "@/lib/permissions/permissions";
import { RoleSchema, ProfileCreateSchema } from "@/lib/validations";

interface User {
  id: string;
  full_name: string;
  email: string;
  status: "active" | "inactive";
  created_at: string;
  roles: {
    id: string;
    name: string;
  };
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  role_permissions: {
    module: ModuleName;
    can_read: boolean;
    can_write: boolean;
  }[];
}

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);

  // User modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role_id: "",
  });

  // Role modal state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
  });
  const [permissions, setPermissions] = useState<
    Record<ModuleName, { can_read: boolean; can_write: boolean }>
  >({
    users: { can_read: false, can_write: false },
    orders: { can_read: false, can_write: false },
    employees: { can_read: false, can_write: false },
    inventory: { can_read: false, can_write: false },
  });

  const loadData = async () => {
    setLoading(true);
    setErrors({});

    // Always load roles since they're needed for the user creation dropdown
    const rolesResult = await getRoles();
    if (rolesResult.success && rolesResult.data) {
      setRoles(rolesResult.data as Role[]);
    } else {
      setErrors({ general: rolesResult.error || "Failed to load roles" });
    }

    // Load users only when on the users tab
    if (activeTab === "users") {
      const result = await getUsers();
      if (result.success && result.data) {
        setUsers(result.data as User[]);
      } else {
        setErrors({ general: result.error || "Failed to load users" });
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    const initialDataLoad = async () => loadData();
    initialDataLoad();
  }, [activeTab]);

  const handleCreateUser = async () => {
    // Validate using Zod schema
    const validationResult = ProfileCreateSchema.safeParse({
      email: userForm.email,
      full_name: userForm.full_name,
      role_id: userForm.role_id,
      status: "active",
    });
    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          newErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    const result = await createUser({
      email: userForm.email,
      password: userForm.password,
      full_name: userForm.full_name,
      role_id: userForm.role_id,
    });

    if (result.success) {
      setShowUserModal(false);
      resetUserForm();
      setErrors({});
      loadData();
      toast.success("User created successfully");
    } else {
      toast.error(result.error || "Failed to create user");
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    const result = await updateUser({
      id: editingUser.id,
      full_name: userForm.full_name,
      role_id: userForm.role_id,
    });

    if (result.success) {
      setShowUserModal(false);
      setEditingUser(null);
      resetUserForm();
      setErrors({});
      loadData();
      toast.success("User updated successfully");
    } else {
      toast.error(result.error || "Failed to update user");
    }
  };

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: "active" | "inactive",
  ) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const result = await setUserStatus(userId, newStatus);
    if (result.success) {
      loadData();
      toast.success("User status updated");
    } else {
      toast.error(result.error || "Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setDeleteUserId(userId);
  };

  const confirmDeleteUser = async () => {
    if (!deleteUserId) return;
    const result = await deleteUser(deleteUserId);
    if (result.success) {
      loadData();
      toast.success("User deleted successfully");
      setDeleteUserId(null);
    } else {
      toast.error(result.error || "Failed to delete user");
      setDeleteUserId(null);
    }
  };

  const handleCreateRole = async () => {
    // Validate using Zod schema
    const validationResult = RoleSchema.safeParse(roleForm);
    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          newErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    const result = await createRole({
      name: roleForm.name,
      description: roleForm.description || undefined,
    });

    if (result.success) {
      setShowRoleModal(false);
      resetRoleForm();
      setErrors({});
      loadData();
      toast.success("Role created successfully");
    } else {
      toast.error(result.error || "Failed to create role");
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    // Validate using Zod schema
    const validationResult = RoleSchema.safeParse({
      id: editingRole.id,
      name: roleForm.name,
      description: roleForm.description || undefined,
    });
    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          newErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    const result = await updateRole({
      id: editingRole.id,
      name: roleForm.name,
      description: roleForm.description || undefined,
    });

    if (result.success) {
      // Update permissions
      const permissionsArray = Object.entries(permissions).map(
        ([module, perms]) => ({
          module: module as ModuleName,
          can_read: perms.can_read,
          can_write: perms.can_write,
        }),
      );

      const permResult = await updateRolePermissions({
        role_id: editingRole.id,
        permissions: permissionsArray,
      });

      if (permResult.success) {
        setShowRoleModal(false);
        setEditingRole(null);
        resetRoleForm();
        setErrors({});
        loadData();
        toast.success("Role updated successfully");
      } else {
        toast.error(permResult.error || "Failed to update permissions");
      }
    } else {
      toast.error(result.error || "Failed to update role");
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    setDeleteRoleId(roleId);
  };

  const confirmDeleteRole = async () => {
    if (!deleteRoleId) return;
    const result = await deleteRole(deleteRoleId);
    if (result.success) {
      loadData();
      toast.success("Role deleted successfully");
      setDeleteRoleId(null);
    } else {
      toast.error(result.error || "Failed to delete role");
      setDeleteRoleId(null);
    }
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      password: "",
      full_name: user.full_name,
      role_id: user.roles.id,
    });
    setShowUserModal(true);
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || "",
    });

    // Set permissions from role
    const perms: Record<ModuleName, { can_read: boolean; can_write: boolean }> =
      {
        users: { can_read: false, can_write: false },
        orders: { can_read: false, can_write: false },
        employees: { can_read: false, can_write: false },
        inventory: { can_read: false, can_write: false },
      };

    role.role_permissions.forEach((p) => {
      perms[p.module] = {
        can_read: p.can_read,
        can_write: p.can_write,
      };
    });

    setPermissions(perms);
    setShowRoleModal(true);
  };

  const resetUserForm = () => {
    setUserForm({
      email: "",
      password: "",
      full_name: "",
      role_id: "",
    });
    setEditingUser(null);
  };

  const resetRoleForm = () => {
    setRoleForm({
      name: "",
      description: "",
    });
    setPermissions({
      users: { can_read: false, can_write: false },
      orders: { can_read: false, can_write: false },
      employees: { can_read: false, can_write: false },
      inventory: { can_read: false, can_write: false },
    });
    setEditingRole(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users & Roles</h1>
        <div className="flex gap-2">
          <Button
            variant={activeTab === "users" ? "default" : "ghost"}
            onClick={() => setActiveTab("users")}
          >
            Users
          </Button>
          <Button
            variant={activeTab === "roles" ? "default" : "ghost"}
            onClick={() => setActiveTab("roles")}
          >
            Roles
          </Button>
        </div>
      </div>

      {errors.general && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {errors.general}
        </div>
      )}

      {activeTab === "users" ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Users</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  resetUserForm();
                  setShowUserModal(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : (
              <Table
                columns={[
                  { key: "full_name", header: "Name" },
                  { key: "email", header: "Email" },
                  {
                    key: "role",
                    header: "Role",
                    render: (row: User) => row.roles.name,
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (row: User) => (
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          row.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {row.status}
                      </span>
                    ),
                  },
                  {
                    key: "created_at",
                    header: "Created",
                    render: (row: User) =>
                      new Date(row.created_at).toLocaleDateString(),
                  },
                  {
                    key: "actions",
                    header: "Actions",
                    render: (row: User) => (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditUser(row)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleToggleUserStatus(row.id, row.status)
                          }
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(row.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ),
                  },
                ]}
                data={users}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Roles</CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  resetRoleForm();
                  setShowRoleModal(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Role
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : (
              <Table
                columns={[
                  { key: "name", header: "Name" },
                  {
                    key: "description",
                    header: "Description",
                    render: (row: Role) => row.description || "-",
                  },
                  {
                    key: "permissions",
                    header: "Permissions",
                    render: (row: Role) => (
                      <div className="flex flex-wrap gap-1">
                        {row.role_permissions.map((p) => (
                          <span
                            key={p.module}
                            className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                          >
                            {p.module} ({p.can_read ? "R" : ""}
                            {p.can_write ? "W" : ""})
                          </span>
                        ))}
                      </div>
                    ),
                  },
                  {
                    key: "created_at",
                    header: "Created",
                    render: (row: Role) =>
                      new Date(row.created_at).toLocaleDateString(),
                  },
                  {
                    key: "actions",
                    header: "Actions",
                    render: (row: Role) => (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditRole(row)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {row.name !== "Admin" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRole(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ),
                  },
                ]}
                data={roles}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* User Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Create User"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={userForm.full_name}
              onChange={(e) =>
                setUserForm({ ...userForm, full_name: e.target.value })
              }
              error={errors.full_name}
              required
            />
            <Input
              label="Email"
              type="email"
              value={userForm.email}
              onChange={(e) =>
                setUserForm({ ...userForm, email: e.target.value })
              }
              error={errors.email}
              required
              disabled={!!editingUser}
            />
            {!editingUser && (
              <Input
                label="Password"
                type="password"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
                required
              />
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role">Role</Label>
              <SelectShadcn
                value={userForm.role_id}
                onValueChange={(value) =>
                  setUserForm({ ...userForm, role_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex flex-col items-start">
                        <span>{role.name}</span>
                        <span className="text-xs text-gray-400">{role.id}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectShadcn>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowUserModal(false);
                resetUserForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingUser ? handleUpdateUser : handleCreateUser}>
              {editingUser ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role" : "Create Role"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              label="Role Name"
              value={roleForm.name}
              onChange={(e) =>
                setRoleForm({ ...roleForm, name: e.target.value })
              }
              error={errors.name}
              required
              disabled={editingRole?.name === "Admin"}
            />
            <Input
              label="Description"
              value={roleForm.description}
              onChange={(e) =>
                setRoleForm({ ...roleForm, description: e.target.value })
              }
            />

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Permissions</h3>
              {(
                ["users", "orders", "employees", "inventory"] as ModuleName[]
              ).map((module) => (
                <div
                  key={module}
                  className="flex items-center gap-4 rounded-md border p-3"
                >
                  <Shield className="h-5 w-5 text-gray-600" />
                  <span className="flex-1 font-medium capitalize">
                    {module}
                  </span>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={permissions[module].can_read}
                      onCheckedChange={(checked) =>
                        setPermissions({
                          ...permissions,
                          [module]: {
                            ...permissions[module],
                            can_read: checked === true,
                          },
                        })
                      }
                      disabled={editingRole?.name === "Admin"}
                    />
                    <span className="text-sm">Read</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={permissions[module].can_write}
                      onCheckedChange={(checked) =>
                        setPermissions({
                          ...permissions,
                          [module]: {
                            ...permissions[module],
                            can_write: checked === true,
                          },
                        })
                      }
                      disabled={
                        !permissions[module].can_read ||
                        editingRole?.name === "Admin" ||
                        (module === "users" && editingRole?.name !== "Admin")
                      }
                    />
                    <span className="text-sm">Write</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowRoleModal(false);
                resetRoleForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingRole ? handleUpdateRole : handleCreateRole}>
              {editingRole ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteUserId !== null}
        onOpenChange={() => setDeleteUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteRoleId !== null}
        onOpenChange={() => setDeleteRoleId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this role? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRole}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
