"use client";

import { useState, useEffect } from "react";
import { useAppRouter } from "@/hooks/useAppRouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  DatePicker,
  formatDateToYYYYMMDD,
  parseDateSafe,
} from "@/components/ui/DatePicker";
import {
  Select as SelectShadcn,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/SelectShadcn";
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
import {
  Plus,
  Edit,
  Trash2,
  User,
  Loader2,
  UserRoundX,
  UserRoundCheck,
} from "lucide-react";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  setEmployeeStatus,
} from "@/app/actions/employees";
import { EmployeeCreateSchema, EmployeeUpdateSchema } from "@/lib/validations";
import { Pagination } from "@/components/shared/Pagination";

const PAGE_SIZE = 10;

interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  position: string;
  salary: number;
  employment_date: string;
  status: "active" | "inactive";
  created_at: string;
  notes?: string | null;
}

export default function EmployeesPage() {
  const router = useAppRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Employee | null>(
    null,
  );
  const [page, setPage] = useState(1);

  const isNavigatingEmployee = (id: string) =>
    router.isNavigatingTarget(`employee-${id}`);

  const setError = (msg: string) => {
    setErrorState(msg);
    if (msg) toast.error(msg);
  };

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
    employment_date: undefined as Date | undefined,
    status: "active" as "active" | "inactive",
    notes: "",
  });
  const [originalForm, setOriginalForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    position: "",
    salary: "",
    employment_date: undefined as Date | undefined,
    status: "active" as "active" | "inactive",
    notes: "",
  });

  const loadData = async (showLoading = true, pageNum = page) => {
    if (showLoading) setLoading(true);
    setErrorState("");

    const filters: {
      search?: string;
      status?: "active" | "inactive";
      page?: number;
      pageSize?: number;
    } = {
      page: pageNum,
      pageSize: PAGE_SIZE,
    };
    if (searchQuery) filters.search = searchQuery;
    if (statusFilter !== "all") filters.status = statusFilter;

    const result = await getEmployees(filters);
    if (result.success && result.data) {
      setEmployees(result.data as Employee[]);
      setTotal(result.total || 0);
    } else {
      setError(result.error || "Failed to load employees");
    }

    if (showLoading) setLoading(false);
  };

  useEffect(() => {
    loadData(true, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (page === 1) {
      loadData(true, 1);
    } else {
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter]);

  const handleCreate = async () => {
    // Validate using Zod schema
    const validationResult = EmployeeCreateSchema.safeParse({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      position: form.position,
      salary: parseFloat(form.salary),
      employment_date: form.employment_date
        ? formatDateToYYYYMMDD(form.employment_date)
        : formatDateToYYYYMMDD(new Date()),
      status: form.status,
      notes: form.notes || undefined,
    });
    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          newErrors[issue.path[0] as string] = issue.message;
        }
      });
      setError(newErrors[Object.keys(newErrors)[0]] || "Validation failed");
      return;
    }

    const savedAddress = form.address.trim();
    const savedNotes = form.notes.trim();

    const previousEmployees = employees;
    const tempEmployee: Employee = {
      id: `temp-${Date.now()}`,
      full_name: validationResult.data.full_name,
      email: validationResult.data.email,
      phone: validationResult.data.phone,
      address: savedAddress,
      position: validationResult.data.position,
      salary: validationResult.data.salary,
      employment_date: validationResult.data.employment_date,
      status: validationResult.data.status,
      created_at: new Date().toISOString(),
      notes: savedNotes || null,
    };

    // Optimistically add to table immediately
    setEmployees((prev) => [tempEmployee, ...prev]);
    setShowModal(false);
    resetForm();

    const result = await createEmployee({
      full_name: tempEmployee.full_name,
      email: tempEmployee.email,
      phone: tempEmployee.phone,
      address: savedAddress,
      position: tempEmployee.position,
      salary: tempEmployee.salary,
      employment_date: tempEmployee.employment_date,
      status: tempEmployee.status,
      notes: savedNotes || undefined,
    });

    if (result.success) {
      toast.success("Employee created successfully");
      loadData(false);
    } else {
      setEmployees(previousEmployees);
      setError(result.error || "Failed to create employee");
    }
  };

  const handleUpdate = async () => {
    if (!editingEmployee) return;

    // Validate using Zod schema
    const validationResult = EmployeeUpdateSchema.safeParse({
      id: editingEmployee.id,
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      position: form.position,
      salary: parseFloat(form.salary),
      employment_date: form.employment_date
        ? formatDateToYYYYMMDD(form.employment_date)
        : editingEmployee.employment_date,
      status: form.status,
      notes: form.notes || undefined,
    });
    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          newErrors[issue.path[0] as string] = issue.message;
        }
      });
      setError(newErrors[Object.keys(newErrors)[0]] || "Validation failed");
      return;
    }

    const savedAddress = form.address.trim();
    const savedNotes = form.notes.trim();

    const previousEmployees = employees;
    const updatedEmployee: Employee = {
      ...editingEmployee,
      full_name: validationResult.data.full_name ?? editingEmployee.full_name,
      email: validationResult.data.email ?? editingEmployee.email,
      phone: validationResult.data.phone ?? editingEmployee.phone,
      address: savedAddress,
      position: validationResult.data.position ?? editingEmployee.position,
      salary: validationResult.data.salary ?? editingEmployee.salary,
      employment_date:
        validationResult.data.employment_date ??
        editingEmployee.employment_date,
      status: validationResult.data.status ?? editingEmployee.status,
      notes: savedNotes || null,
    };

    // Optimistically update employee in table immediately
    setEmployees((prev) =>
      prev.map((e) => (e.id === editingEmployee.id ? updatedEmployee : e)),
    );
    setShowModal(false);
    setEditingEmployee(null);
    resetForm();

    const result = await updateEmployee({
      id: updatedEmployee.id,
      full_name: updatedEmployee.full_name,
      email: updatedEmployee.email,
      phone: updatedEmployee.phone,
      address: savedAddress,
      position: updatedEmployee.position,
      salary: updatedEmployee.salary,
      employment_date: updatedEmployee.employment_date,
      status: updatedEmployee.status,
      notes: savedNotes || undefined,
    });

    if (result.success) {
      toast.success("Employee updated successfully");
      loadData(false);
    } else {
      setEmployees(previousEmployees);
      setError(result.error || "Failed to update employee");
    }
  };

  const handleToggleStatus = async (
    employeeId: string,
    currentStatus: "active" | "inactive",
  ) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const previousEmployees = employees;

    // Optimistically update status in table immediately
    setEmployees((prev) =>
      prev.map((e) => (e.id === employeeId ? { ...e, status: newStatus } : e)),
    );

    const result = await setEmployeeStatus(employeeId, newStatus);
    if (result.success) {
      toast.success(
        newStatus === "active"
          ? "Employee activated successfully"
          : "Employee deactivated successfully",
      );
      loadData(false);
    } else {
      setEmployees(previousEmployees);
      toast.error(result.error || "Failed to update employee status");
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    const target = deactivateTarget;
    const previousEmployees = employees;

    // Optimistically deactivate employee immediately and close dialogue
    setDeactivateTarget(null);
    setEmployees((prev) =>
      prev.map((e) => (e.id === target.id ? { ...e, status: "inactive" } : e)),
    );

    const result = await setEmployeeStatus(target.id, "inactive");
    if (result.success) {
      toast.success("Employee deactivated successfully");
      loadData(false);
    } else {
      setEmployees(previousEmployees);
      toast.error(result.error || "Failed to deactivate employee");
    }
  };

  const handleDelete = async (employeeId: string) => {
    setDeleteId(employeeId);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    const previousEmployees = employees;

    // Immediate optimistic deletion
    setDeleteId(null);
    setEmployees((prev) => prev.filter((e) => e.id !== id));

    const result = await deleteEmployee(id);
    if (result.success) {
      toast.success("Employee deleted successfully");
      loadData(false);
    } else {
      setEmployees(previousEmployees);
      setError(result.error || "Failed to delete employee");
    }
  };

  const openEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    const formData = {
      full_name: employee.full_name,
      email: employee.email || "",
      phone: employee.phone || "",
      address: employee.address || "",
      position: employee.position || "",
      salary: employee.salary.toString(),
      employment_date: parseDateSafe(employee.employment_date),
      status: employee.status,
      notes: employee.notes || "",
    };
    setForm(formData);
    setOriginalForm(formData);
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
      employment_date: undefined,
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
            router.push("/employees/new", { target: "new" });
          }}
          disabled={router.isNavigatingTarget("new")}
        >
          {router.isNavigatingTarget("new") ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {router.isNavigatingTarget("new") ? "Loading" : "Add Employee"}
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
              <SelectShadcn
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as "all" | "active" | "inactive")
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </SelectShadcn>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : employees.length === 0 ? (
            <p className="text-gray-600">No employees found</p>
          ) : (
            <>
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
                          <Button
                            variant="ghost"
                            onClick={() => {
                              router.push(`/employees/${employee.id}`, {
                                target: `employee-${employee.id}`,
                              });
                            }}
                            className="flex items-center gap-2 font-medium text-blue-600 hover:underline"
                            disabled={isNavigatingEmployee(employee.id)}
                          >
                            {isNavigatingEmployee(employee.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                            {employee.full_name}
                          </Button>
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
                              onClick={() => {
                                if (employee.status === "active") {
                                  setDeactivateTarget(employee);
                                } else {
                                  handleToggleStatus(
                                    employee.id,
                                    employee.status,
                                  );
                                }
                              }}
                              title={
                                employee.status === "active"
                                  ? "Deactivate employee"
                                  : "Activate employee"
                              }
                            >
                              {employee.status === "active" ? (
                                <UserRoundX className="h-4 w-4 text-red-500" />
                              ) : (
                                <UserRoundCheck className="h-4 w-4 text-green-600" />
                              )}
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
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
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
                  required
                />
                <Input
                  label="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
                <Input
                  label="Address"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  required
                />
                <Input
                  label="Position"
                  value={form.position}
                  onChange={(e) =>
                    setForm({ ...form, position: e.target.value })
                  }
                  required
                />
                <Input
                  label="Salary"
                  type="number"
                  step="0.01"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  required
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Employment Date <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={form.employment_date}
                    onChange={(date) =>
                      setForm({ ...form, employment_date: date })
                    }
                    placeholder="Select employment date"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <SelectShadcn
                    value={form.status}
                    onValueChange={(value) =>
                      setForm({
                        ...form,
                        status: value as "active" | "inactive",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </SelectShadcn>
                </div>
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
                    disabled={
                      editingEmployee
                        ? JSON.stringify(form) === JSON.stringify(originalForm)
                        : undefined
                    }
                  >
                    {editingEmployee ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this employee? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deactivateTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate{" "}
              <span className="font-semibold text-gray-900">
                {deactivateTarget?.full_name || "this employee"}
              </span>
              ? They will no longer be able to be assigned to new orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeactivateTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
