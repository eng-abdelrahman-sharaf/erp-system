"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
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
  const [error, setError] = useState("");

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
    setError("");

    if (activeTab === "users") {
      const result = await getUsers();
      if (result.success && result.data) {
        setUsers(result.data as User[]);
      } else {
        setError(result.error || "Failed to load users");
      }
    } else {
      const result = await getRoles();
      if (result.success && result.data) {
        setRoles(result.data as Role[]);
      } else {
        setError(result.error || "Failed to load roles");
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    const initialDataLoad = async()=>loadData()
    initialDataLoad();
  }, [activeTab]);

  const handleCreateUser = async () => {
    const result = await createUser({
      email: userForm.email,
      password: userForm.password,
      full_name: userForm.full_name,
      role_id: userForm.role_id,
    });

    if (result.success) {
      setShowUserModal(false);
      resetUserForm();
      loadData();
    } else {
      setError(result.error || "Failed to create user");
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
      loadData();
    } else {
      setError(result.error || "Failed to update user");
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
    } else {
      setError(result.error || "Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone.",
      )
    ) {
      return;
    }

    const result = await deleteUser(userId);
    if (result.success) {
      loadData();
    } else {
      setError(result.error || "Failed to delete user");
    }
  };

  const handleCreateRole = async () => {
    const result = await createRole({
      name: roleForm.name,
      description: roleForm.description || undefined,
    });

    if (result.success) {
      setShowRoleModal(false);
      resetRoleForm();
      loadData();
    } else {
      setError(result.error || "Failed to create role");
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

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
        loadData();
      } else {
        setError(permResult.error || "Failed to update permissions");
      }
    } else {
      setError(result.error || "Failed to update role");
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this role? This action cannot be undone.",
      )
    ) {
      return;
    }

    const result = await deleteRole(roleId);
    if (result.success) {
      loadData();
    } else {
      setError(result.error || "Failed to delete role");
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

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
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
            ) : users.length === 0 ? (
              <p className="text-gray-600">No users found</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.full_name}</td>
                      <td>{user.email}</td>
                      <td>{user.roles.name}</td>
                      <td>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            user.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleToggleUserStatus(user.id, user.status)
                            }
                          >
                            {user.status === "active"
                              ? "Deactivate"
                              : "Activate"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
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
            ) : roles.length === 0 ? (
              <p className="text-gray-600">No roles found</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Permissions</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id}>
                      <td>{role.name}</td>
                      <td>{role.description || "-"}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {role.role_permissions.map((p) => (
                            <span
                              key={p.module}
                              className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                            >
                              {p.module} ({p.can_read ? "R" : ""}
                              {p.can_write ? "W" : ""})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>{new Date(role.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditRole(role)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editingUser ? "Edit User" : "Create User"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  value={userForm.full_name}
                  onChange={(e) =>
                    setUserForm({ ...userForm, full_name: e.target.value })
                  }
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm({ ...userForm, email: e.target.value })
                  }
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
                <Select
                  label="Role"
                  value={userForm.role_id}
                  onChange={(e) =>
                    setUserForm({ ...userForm, role_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </Select>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowUserModal(false);
                      resetUserForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={editingUser ? handleUpdateUser : handleCreateUser}
                  >
                    {editingUser ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>{editingRole ? "Edit Role" : "Create Role"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Role Name"
                  value={roleForm.name}
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, name: e.target.value })
                  }
                  required
                />
                <Input
                  label="Description"
                  value={roleForm.description}
                  onChange={(e) =>
                    setRoleForm({ ...roleForm, description: e.target.value })
                  }
                />

                {editingRole && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Permissions</h3>
                    {(
                      [
                        "users",
                        "orders",
                        "employees",
                        "inventory",
                      ] as ModuleName[]
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
                          <input
                            type="checkbox"
                            checked={permissions[module].can_read}
                            onChange={(e) =>
                              setPermissions({
                                ...permissions,
                                [module]: {
                                  ...permissions[module],
                                  can_read: e.target.checked,
                                },
                              })
                            }
                          />
                          <span className="text-sm">Read</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={permissions[module].can_write}
                            onChange={(e) =>
                              setPermissions({
                                ...permissions,
                                [module]: {
                                  ...permissions[module],
                                  can_write: e.target.checked,
                                },
                              })
                            }
                            disabled={!permissions[module].can_read}
                          />
                          <span className="text-sm">Write</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowRoleModal(false);
                      resetRoleForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={editingRole ? handleUpdateRole : handleCreateRole}
                  >
                    {editingRole ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
