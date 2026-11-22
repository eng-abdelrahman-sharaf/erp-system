"use client";

import { Suspense, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAppRouter } from "@/hooks/useAppRouter";
import { BackButton } from "@/components/shared/BackButton";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Select as SelectShadcn,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/SelectShadcn";
import {
  DatePicker,
  formatDateToYYYYMMDD,
  parseDateSafe,
} from "@/components/ui/DatePicker";
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
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  User as UserIcon,
  Briefcase,
  Loader2,
  ShoppingCart,
} from "lucide-react";
import {
  getEmployeeById,
  getEmployeeOrders,
  updateEmployee,
} from "@/app/actions/employees";
import { EmployeeUpdateSchema } from "@/lib/validations";
import {
  getPayrollPeriods,
  createPayrollPeriod,
  deletePayrollPeriod,
  recordSalaryPayment,
  getEmployeeSalaryPayments,
  getPayrollSummary,
} from "@/app/actions/payroll";
import { Pagination } from "@/components/shared/Pagination";

const SUB_PAGE_SIZE = 10;

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
  notes: string | null;
}

interface Order {
  id: string;
  order_number: string;
  title: string;
  client_name: string;
  status: string;
  order_date: string;
}

interface PayrollSummaryItem {
  payroll_period_id: string;
  period_start: string;
  period_end: string;
  salary_amount: number;
  total_paid: number;
  outstanding: number;
}

interface SalaryPayment {
  id: string;
  amount: number;
  payment_date: string;
  method: string;
  reference_number: string | null;
  notes: string | null;
  profiles?: { full_name: string };
}

type TabType = "overview" | "orders" | "payroll" | "payments";

function EmployeeDetailsContent() {
  const params = useParams();
  const router = useAppRouter();
  const employeeId = params.id as string;

  const isNavigatingOrder = (id: string) =>
    router.isNavigatingTarget(`order-${id}`);

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummaryItem[]>(
    [],
  );
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [payrollTotal, setPayrollTotal] = useState(0);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [payrollPage, setPayrollPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [payrollLoading, setPayrollLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deletePayrollId, setDeletePayrollId] = useState<string | null>(null);

  const setError = (msg: string) => {
    if (msg) toast.error(msg);
  };

  const [showEditModal, setShowEditModalState] = useState(false);

  const setShowEditModal = (show: boolean) => {
    setShowEditModalState(show);
    if (!show) {
      setErrors({});
    }
  };
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    position: "",
    salary: "",
    employment_date: new Date(),
    status: "active" as "active" | "inactive",
    notes: "",
  });
  const [originalEditForm, setOriginalEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    position: "",
    salary: "",
    employment_date: new Date(),
    status: "active" as "active" | "inactive",
    notes: "",
  });

  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollForm, setPayrollForm] = useState({
    period_start: new Date(),
    period_end: new Date(),
    salary_amount: "",
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payroll_period_id: "",
    amount: "",
    payment_date: new Date(),
    method: "bank_transfer" as const,
    reference_number: "",
    notes: "",
  });

  const loadEmployee = async () => {
    const result = await getEmployeeById(employeeId);
    if (result.success && result.data) {
      setEmployee(result.data as Employee);
      setEditForm({
        full_name: result.data.full_name,
        email: result.data.email || "",
        phone: result.data.phone || "",
        address: result.data.address || "",
        position: result.data.position || "",
        salary: result.data.salary.toString(),
        employment_date:
          parseDateSafe(result.data.employment_date) || new Date(),
        status: result.data.status,
        notes: result.data.notes || "",
      });
    } else {
      toast.error(result.error || "Failed to load employee");
    }
  };

  const loadOrders = async (pageNum = ordersPage) => {
    try {
      const result = await getEmployeeOrders(
        employeeId,
        pageNum,
        SUB_PAGE_SIZE,
      );
      if (result.success && result.data) {
        setOrders(result.data as Order[]);
        setOrdersTotal(result.total || 0);
      }
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadPayroll = async (pageNum = payrollPage) => {
    try {
      const summaryResult = await getPayrollSummary(
        employeeId,
        pageNum,
        SUB_PAGE_SIZE,
      );
      if (summaryResult.success && summaryResult.data) {
        setPayrollSummary(summaryResult.data as PayrollSummaryItem[]);
        setPayrollTotal(summaryResult.total || 0);
      }
    } finally {
      setPayrollLoading(false);
    }
  };

  const loadPayments = async (pageNum = paymentsPage) => {
    try {
      const result = await getEmployeeSalaryPayments(
        employeeId,
        pageNum,
        SUB_PAGE_SIZE,
      );
      if (result.success && result.data) {
        setSalaryPayments(result.data as SalaryPayment[]);
        setPaymentsTotal(result.total || 0);
      }
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "orders") {
      loadOrders(ordersPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordersPage]);

  useEffect(() => {
    if (activeTab === "payroll") {
      loadPayroll(payrollPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payrollPage]);

  useEffect(() => {
    if (activeTab === "payments") {
      loadPayments(paymentsPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentsPage]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        loadEmployee(),
        loadOrders(),
        loadPayroll(),
        loadPayments(),
      ]);
      setLoading(false);
    };
    fetchData();
  }, [employeeId]);

  const openEditModal = () => {
    if (employee) {
      const formData = {
        full_name: employee.full_name,
        email: employee.email || "",
        phone: employee.phone || "",
        address: employee.address || "",
        position: employee.position || "",
        salary: employee.salary.toString(),
        employment_date: parseDateSafe(employee.employment_date) || new Date(),
        status: employee.status,
        notes: employee.notes || "",
      };
      setEditForm(formData);
      setOriginalEditForm(formData);
    }
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async () => {
    if (!employee) return;

    // Validate using Zod schema
    const validationResult = EmployeeUpdateSchema.safeParse({
      id: employeeId,
      full_name: editForm.full_name,
      email: editForm.email,
      phone: editForm.phone,
      address: editForm.address,
      position: editForm.position,
      salary: parseFloat(editForm.salary),
      employment_date: formatDateToYYYYMMDD(editForm.employment_date),
      status: editForm.status,
      notes: editForm.notes || undefined,
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

    const previousEmployee = employee;
    const updatedEmployee: Employee = {
      ...employee,
      full_name: validationResult.data.full_name ?? employee.full_name,
      email: validationResult.data.email ?? employee.email,
      phone: validationResult.data.phone ?? employee.phone,
      address: validationResult.data.address ?? employee.address,
      position: validationResult.data.position ?? employee.position,
      salary: validationResult.data.salary ?? employee.salary,
      employment_date:
        validationResult.data.employment_date ?? employee.employment_date,
      status: validationResult.data.status ?? employee.status,
      notes: validationResult.data.notes ?? null,
    };

    setEmployee(updatedEmployee);
    setShowEditModal(false);

    const result = await updateEmployee({
      id: employeeId,
      full_name: updatedEmployee.full_name,
      email: updatedEmployee.email,
      phone: updatedEmployee.phone,
      address: updatedEmployee.address,
      position: updatedEmployee.position,
      salary: updatedEmployee.salary,
      employment_date: updatedEmployee.employment_date,
      status: updatedEmployee.status,
      notes: updatedEmployee.notes ?? undefined,
    });
    if (result.success) {
      toast.success("Employee updated successfully");
      loadEmployee();
    } else {
      setEmployee(previousEmployee);
      toast.error(result.error || "Failed to update employee");
    }
  };

  const handleCreatePayrollPeriod = async () => {
    const salaryAmount = parseFloat(payrollForm.salary_amount);
    if (
      !payrollForm.salary_amount.trim() ||
      isNaN(salaryAmount) ||
      salaryAmount <= 0
    ) {
      toast.error("Please enter a valid salary amount greater than zero");
      return;
    }
    if (!payrollForm.period_start) {
      toast.error("Period start date is required");
      return;
    }
    if (!payrollForm.period_end) {
      toast.error("Period end date is required");
      return;
    }
    if (payrollForm.period_end < payrollForm.period_start) {
      toast.error("Period end date must be on or after the start date");
      return;
    }

    const previousSummary = payrollSummary;
    const periodStart = formatDateToYYYYMMDD(payrollForm.period_start);
    const periodEnd = formatDateToYYYYMMDD(payrollForm.period_end);

    const tempPeriod: PayrollSummaryItem = {
      payroll_period_id: `temp-${Date.now()}`,
      period_start: periodStart,
      period_end: periodEnd,
      salary_amount: salaryAmount,
      total_paid: 0,
      outstanding: salaryAmount,
    };

    // Optimistically add to payroll table immediately
    setPayrollSummary((prev) => [tempPeriod, ...prev]);
    setShowPayrollModal(false);
    setPayrollForm({
      period_start: new Date(),
      period_end: new Date(),
      salary_amount: "",
    });

    const result = await createPayrollPeriod({
      employee_id: employeeId,
      period_start: periodStart,
      period_end: periodEnd,
      salary_amount: salaryAmount,
    });
    if (result.success) {
      toast.success("Payroll period created successfully");
      loadPayroll();
    } else {
      setPayrollSummary(previousSummary);
      setError(result.error || "Failed to create payroll period");
    }
  };

  const handleDeletePayrollPeriod = async (periodId: string) => {
    setDeletePayrollId(periodId);
  };

  const confirmDeletePayroll = async () => {
    if (!deletePayrollId) return;
    const id = deletePayrollId;
    const previousSummary = payrollSummary;

    // Immediate optimistic deletion
    setDeletePayrollId(null);
    setPayrollSummary((prev) => prev.filter((p) => p.payroll_period_id !== id));

    const result = await deletePayrollPeriod(id, employeeId);
    if (result.success) {
      toast.success("Payroll period deleted");
      loadPayroll();
    } else {
      setPayrollSummary(previousSummary);
      setError(result.error || "Failed to delete");
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.payroll_period_id) {
      toast.error("Please select a payroll period");
      return;
    }
    const paymentAmount = parseFloat(paymentForm.amount);
    if (
      !paymentForm.amount.trim() ||
      isNaN(paymentAmount) ||
      paymentAmount <= 0
    ) {
      toast.error("Please enter a valid payment amount greater than zero");
      return;
    }
    if (!paymentForm.payment_date) {
      toast.error("Payment date is required");
      return;
    }

    const previousPayments = salaryPayments;
    const previousSummary = payrollSummary;
    const paymentDate = formatDateToYYYYMMDD(paymentForm.payment_date);

    const tempPayment: SalaryPayment = {
      id: `temp-${Date.now()}`,
      amount: paymentAmount,
      payment_date: paymentDate,
      method: paymentForm.method,
      reference_number: paymentForm.reference_number || null,
      notes: paymentForm.notes || null,
    };

    // Optimistically add to payments table and update payroll summary table
    setSalaryPayments((prev) => [tempPayment, ...prev]);
    setPayrollSummary((prev) =>
      prev.map((item) =>
        item.payroll_period_id === paymentForm.payroll_period_id
          ? {
              ...item,
              total_paid: item.total_paid + paymentAmount,
              outstanding: Math.max(0, item.outstanding - paymentAmount),
            }
          : item,
      ),
    );

    setShowPaymentModal(false);
    const savedPeriodId = paymentForm.payroll_period_id;
    const savedMethod = paymentForm.method;
    const savedRef = paymentForm.reference_number;
    const savedNotes = paymentForm.notes;
    setPaymentForm({
      payroll_period_id: "",
      amount: "",
      payment_date: new Date(),
      method: "bank_transfer",
      reference_number: "",
      notes: "",
    });

    const result = await recordSalaryPayment({
      payroll_period_id: savedPeriodId,
      amount: paymentAmount,
      payment_date: paymentDate,
      method: savedMethod,
      reference_number: savedRef || undefined,
      notes: savedNotes || undefined,
    });
    if (result.success) {
      toast.success("Payment recorded successfully");
      loadPayroll();
      loadPayments();
    } else {
      setSalaryPayments(previousPayments);
      setPayrollSummary(previousSummary);
      setError(result.error || "Failed to record payment");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  if (!employee)
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-600">Employee not found</p>
      </div>
    );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton label="Back" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {employee.full_name}
            </h1>
            <p className="text-sm text-gray-600">
              {employee.position || "No position"}
            </p>
          </div>
        </div>
        <Button onClick={openEditModal}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Employee
        </Button>
      </div>
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-4">
          {[
            { id: "overview" as TabType, label: "Overview", icon: UserIcon },
            {
              id: "orders" as TabType,
              label: "Assigned Orders",
              icon: Briefcase,
            },
            { id: "payroll" as TabType, label: "Payroll", icon: DollarSign },
            {
              id: "payments" as TabType,
              label: "Payment History",
              icon: Calendar,
            },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-1 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </nav>
      </div>

      {activeTab === "overview" && (
        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Full Name</p>
                <p className="text-lg font-semibold text-gray-900">
                  {employee.full_name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-lg text-gray-900">{employee.email || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Phone</p>
                <p className="text-lg text-gray-900">{employee.phone || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Position</p>
                <p className="text-lg text-gray-900">
                  {employee.position || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Salary</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${employee.salary.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Employment Date
                </p>
                <p className="text-lg text-gray-900">
                  {new Date(employee.employment_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${employee.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                >
                  {employee.status}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Address</p>
                <p className="text-lg text-gray-900">
                  {employee.address || "-"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-600">Notes</p>
                <p className="text-lg text-gray-900">{employee.notes || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "orders" && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : orders.length === 0 ? (
              <p className="text-gray-600">No orders assigned</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Order Number
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Title
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Client
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Order Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <Button
                              variant="ghost"
                              onClick={() => {
                                router.push(`/orders/${order.id}`, {
                                  target: `order-${order.id}`,
                                });
                              }}
                              className="flex items-center font-medium text-blue-600 hover:underline"
                              disabled={isNavigatingOrder(order.id)}
                            >
                              {isNavigatingOrder(order.id) ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <ShoppingCart className="mr-2 h-4 w-4" />
                              )}
                              {order.order_number}
                            </Button>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {order.title}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {order.client_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${order.status === "paid" ? "bg-green-100 text-green-800" : order.status === "cancelled" ? "bg-red-100 text-red-800" : order.status === "in_progress" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {new Date(order.order_date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={ordersPage}
                  pageSize={SUB_PAGE_SIZE}
                  total={ordersTotal}
                  onPageChange={setOrdersPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "payroll" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Payroll Periods</CardTitle>
              <Button size="sm" onClick={() => setShowPayrollModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Period
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {payrollLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : payrollSummary.length === 0 ? (
              <p className="text-gray-600">No payroll periods</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Period Start
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Period End
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Salary
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Paid
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Outstanding
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {payrollSummary.map((summary) => (
                        <tr
                          key={summary.payroll_period_id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {new Date(
                              summary.period_start,
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {new Date(summary.period_end).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            ${summary.salary_amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            ${summary.total_paid.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            ${summary.outstanding.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setPaymentForm({
                                    ...paymentForm,
                                    payroll_period_id:
                                      summary.payroll_period_id,
                                    payment_date: new Date(),
                                  });
                                  setShowPaymentModal(true);
                                }}
                                disabled={summary.outstanding <= 0}
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeletePayrollPeriod(
                                    summary.payroll_period_id,
                                  )
                                }
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
                  page={payrollPage}
                  pageSize={SUB_PAGE_SIZE}
                  total={payrollTotal}
                  onPageChange={setPayrollPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "payments" && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : salaryPayments.length === 0 ? (
              <p className="text-gray-600">No payments recorded</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Payment Date
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Method
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Reference
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Recorded By
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaryPayments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {new Date(
                              payment.payment_date,
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            ${payment.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 capitalize">
                            {payment.method.replace("_", " ")}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {payment.reference_number || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {payment.profiles?.full_name || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {payment.notes || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={paymentsPage}
                  pageSize={SUB_PAGE_SIZE}
                  total={paymentsTotal}
                  onPageChange={setPaymentsPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  value={editForm.full_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, full_name: e.target.value })
                  }
                  error={errors.full_name}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  error={errors.email}
                  required
                />
                <Input
                  label="Phone"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  error={errors.phone}
                  required
                />
                <Input
                  label="Address"
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address: e.target.value })
                  }
                  error={errors.address}
                  required
                />
                <Input
                  label="Position"
                  value={editForm.position}
                  onChange={(e) =>
                    setEditForm({ ...editForm, position: e.target.value })
                  }
                  error={errors.position}
                  required
                />
                <Input
                  label="Salary"
                  type="number"
                  step="0.01"
                  value={editForm.salary}
                  onChange={(e) =>
                    setEditForm({ ...editForm, salary: e.target.value })
                  }
                  error={errors.salary}
                  required
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Employment Date <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={
                      editForm.employment_date instanceof Date
                        ? editForm.employment_date
                        : undefined
                    }
                    onChange={(date) =>
                      setEditForm({
                        ...editForm,
                        employment_date: date || new Date(),
                      })
                    }
                    placeholder="Pick a date"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <SelectShadcn
                    value={editForm.status}
                    onValueChange={(value) =>
                      setEditForm({
                        ...editForm,
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
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateEmployee}
                    disabled={
                      JSON.stringify(editForm) ===
                      JSON.stringify(originalEditForm)
                    }
                  >
                    Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showPayrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create Payroll Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Period Start
                  </label>
                  <DatePicker
                    value={
                      payrollForm.period_start instanceof Date
                        ? payrollForm.period_start
                        : undefined
                    }
                    onChange={(date) =>
                      setPayrollForm({
                        ...payrollForm,
                        period_start: date || new Date(),
                      })
                    }
                    placeholder="Pick a date"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Period End
                  </label>
                  <DatePicker
                    value={
                      payrollForm.period_end instanceof Date
                        ? payrollForm.period_end
                        : undefined
                    }
                    onChange={(date) =>
                      setPayrollForm({
                        ...payrollForm,
                        period_end: date || new Date(),
                      })
                    }
                    placeholder="Pick a date"
                  />
                </div>
                <Input
                  label="Salary Amount"
                  type="number"
                  step="0.01"
                  value={payrollForm.salary_amount}
                  onChange={(e) =>
                    setPayrollForm({
                      ...payrollForm,
                      salary_amount: e.target.value,
                    })
                  }
                  required
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowPayrollModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePayrollPeriod}>Create</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Record Salary Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Amount"
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amount: e.target.value })
                  }
                  required
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Payment Date
                  </label>
                  <DatePicker
                    value={
                      paymentForm.payment_date instanceof Date
                        ? paymentForm.payment_date
                        : undefined
                    }
                    onChange={(date) =>
                      setPaymentForm({
                        ...paymentForm,
                        payment_date: date || new Date(),
                      })
                    }
                    placeholder="Pick a date"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Payment Method
                  </label>
                  <SelectShadcn
                    value={paymentForm.method}
                    onValueChange={(value) =>
                      setPaymentForm({
                        ...paymentForm,
                        method: value as any,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="instapay">Instapay</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </SelectShadcn>
                </div>
                <Input
                  label="Reference Number"
                  value={paymentForm.reference_number}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      reference_number: e.target.value,
                    })
                  }
                />
                <Input
                  label="Notes"
                  value={paymentForm.notes}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, notes: e.target.value })
                  }
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleRecordPayment}>Record Payment</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog
        open={deletePayrollId !== null}
        onOpenChange={() => setDeletePayrollId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payroll Period</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payroll period?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePayroll}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function EmployeeDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmployeeDetailsContent />
    </Suspense>
  );
}
