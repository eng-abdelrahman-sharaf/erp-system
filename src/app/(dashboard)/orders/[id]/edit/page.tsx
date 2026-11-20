"use client";

import { Suspense, useState, useEffect, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { DatePicker } from "@/components/ui/DatePicker";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  getOrder,
  updateOrder,
  getActiveEmployees,
} from "@/features/orders/actions";
import type { OrderWithEmployee } from "@/features/orders/types";

function EditOrderContent() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [isPending, startTransition] = useTransition();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setErrorState] = useState("");

  const setError = (msg: string) => {
    setErrorState(msg);
    if (msg) toast.error(msg);
  };
  const [order, setOrder] = useState<OrderWithEmployee | null>(null);
  const [employees, setEmployees] = useState<
    { id: string; full_name: string }[]
  >([]);

  const [form, setForm] = useState({
    order_number: "",
    title: "",
    description: "",
    client_name: "",
    client_phone: "",
    client_address: "",
    employee_id: "",
    order_date: new Date(),
    notes: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [orderData, employeesData] = await Promise.all([
          getOrder(orderId),
          getActiveEmployees(),
        ]);
        if (orderData) {
          setOrder(orderData);
          setForm({
            order_number: orderData.order_number,
            title: orderData.title,
            description: orderData.description || "",
            client_name: orderData.client_name,
            client_phone: orderData.client_phone || "",
            client_address: orderData.client_address || "",
            employee_id: orderData.employee_id || "",
            order_date: new Date(orderData.order_date),
            notes: orderData.notes || "",
          });
        }
        setEmployees(employeesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (
      !form.order_number ||
      !form.title ||
      !form.client_name ||
      !form.order_date
    ) {
      setError("Please fill in all required fields");
      setSaving(false);
      return;
    }

    try {
      await updateOrder(orderId, {
        order_number: form.order_number,
        title: form.title,
        description: form.description || null,
        client_name: form.client_name,
        client_phone: form.client_phone || null,
        client_address: form.client_address || null,
        employee_id: form.employee_id || null,
        order_date:
          form.order_date instanceof Date
            ? form.order_date.toISOString().split("T")[0]
            : form.order_date,
        notes: form.notes || null,
      });
      startTransition(() => router.push(`/orders/${orderId}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading...</div>;
  }

  if (!order) {
    return <div className="text-red-600">Order not found</div>;
  }

  // Cannot edit paid or cancelled orders
  if (order.status === "paid" || order.status === "cancelled") {
    return (
      <div>
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              startTransition(() => router.push(`/orders/${orderId}`))
            }
            disabled={isPending}
          >
            <ArrowLeft className="h-4 w-4" />
            {isPending ? "Loading..." : ""}
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Order</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600">
              This order is {order.status === "paid" ? "paid" : "cancelled"} and
              cannot be edited.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/orders/${orderId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Order</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Order Number *"
              value={form.order_number}
              onChange={(e) =>
                setForm({ ...form, order_number: e.target.value })
              }
              required
            />
            <Input
              label="Title *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <Input
              label="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Client Name *"
                value={form.client_name}
                onChange={(e) =>
                  setForm({ ...form, client_name: e.target.value })
                }
                required
              />
              <Input
                label="Client Phone"
                value={form.client_phone}
                onChange={(e) =>
                  setForm({ ...form, client_phone: e.target.value })
                }
              />
            </div>
            <Input
              label="Client Address"
              value={form.client_address}
              onChange={(e) =>
                setForm({ ...form, client_address: e.target.value })
              }
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Assigned Employee
                </label>
                <SelectShadcn
                  value={form.employee_id}
                  onValueChange={(value) =>
                    setForm({ ...form, employee_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      Select an employee (optional)
                    </SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        <div className="flex flex-col items-start">
                          <span>{emp.full_name}</span>
                          <span className="text-xs text-gray-400">
                            {emp.id}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectShadcn>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Order Date *
                </label>
                <DatePicker
                  value={
                    form.order_date instanceof Date
                      ? form.order_date
                      : undefined
                  }
                  onChange={(date) =>
                    setForm({ ...form, order_date: date || new Date() })
                  }
                  placeholder="Pick a date"
                />
              </div>
            </div>
            <Input
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  startTransition(() => router.push(`/orders/${orderId}`))
                }
                disabled={saving || isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isPending ? "Loading" : "Cancel"}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditOrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditOrderContent />
    </Suspense>
  );
}
