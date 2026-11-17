"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Plus, Edit, Trash2, User } from "lucide-react";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "@/app/actions/employees";

interface Employee {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  salary: number;
  employment_date: string;
  status: "active" | "inactive";
  created_at: string;
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    position: "",
    salary: "",
    employment_date: "",
    status: "active" as "active" | "inactive",
    notes: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError("");

    const filters: { search?: string; status?: "active" | "inactive" } = {};
    if (searchQuery) filters.search = searchQuery;
    if (statusFilter !== "all") filters.status = statusFilter;

    const result = await getEmployees(filters);
    if (result.success && result.data) {
      setEmployees(result.data as Employee[]);
    } else {
      setError(result.error || "Failed to load employees");
    }

    setLoading(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      await loadData();
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter]);

  const handleCreate = async () => {
    const result = await createEmployee({
      full_name: form.full_name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      position: form.position || undefined,
      salary: parseFloat(form.salary),
      employment_date: form.employment_date,
      status: form.status,
      notes: form.notes || undefined,
    });

    if (result.success) {
      setShowModal(false);
      resetForm();
      loadData();
    } else {
      setError(result.error || "Failed to create employee");
    }
  };

  const handleUpdate = async () => {
    if (!editingEmployee) return;

    const result = await updateEmployee({
      id: editingEmployee.id,
      full_name: form.full_name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      position: form.position || undefined,
      salary: parseFloat(form.salary),
      employment_date: form.employment_date,
      status: form.status,
      notes: form.notes || undefined,
    });

    if (result.success) {
      setShowModal(false);
      setEditingEmployee(null);
      resetForm();
      loadData();
    } else {
      setError(result.error || "Failed to update employee");
    }
  };

  const handleDelete = async (employeeId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this employee? This action cannot be undone.",
      )
    ) {
      return;
    }

    const result = await deleteEmployee(employeeId);
    if (result.success) {
      loadData();
    } else {
      setError(result.error || "Failed to delete employee");
    }
  };

  const openEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setForm({
      full_name: employee.full_name,
      email: employee.email || "",
      phone: employee.phone || "",
      address: "",
      position: employee.position || "",
      salary: employee.salary.toString(),
      employment_date: employee.employment_date,
      status: employee.status,
      notes: "",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      full_name: "",
      email: "",
      phone: "",
      address: "",
      position: "",
      salary: "",
      employment_date: "",
      status: "active",
      notes: "",
    });
    setEditingEmployee(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
        <Button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Employees</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <Select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "all" | "active" | "inactive",
                  )
                }
                options={[
                  { value: "all", label: "All Status" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : employees.length === 0 ? (
            <p className="text-gray-600">No employees found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Position
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Salary
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Employment Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <button
                          onClick={() =>
                            router.push(`/employees/${employee.id}`)
                          }
                          className="flex items-center gap-2 font-medium text-blue-600 hover:underline"
                        >
                          <User className="h-4 w-4" />
                          {employee.full_name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {employee.email || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {employee.phone || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {employee.position || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        ${employee.salary.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            employee.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(
                          employee.employment_date,
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(employee.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingEmployee ? "Edit Employee" : "Create Employee"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <Input
                  label="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <Input
                  label="Address"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
                <Input
                  label="Position"
                  value={form.position}
                  onChange={(e) =>
                    setForm({ ...form, position: e.target.value })
                  }
                />
                <Input
                  label="Salary"
                  type="number"
                  step="0.01"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  required
                />
                <Input
                  label="Employment Date"
                  type="date"
                  value={form.employment_date}
                  onChange={(e) =>
                    setForm({ ...form, employment_date: e.target.value })
                  }
                  required
                />
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as "active" | "inactive",
                    })
                  }
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />
                <Input
                  label="Notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={editingEmployee ? handleUpdate : handleCreate}
                  >
                    {editingEmployee ? "Update" : "Create"}
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
