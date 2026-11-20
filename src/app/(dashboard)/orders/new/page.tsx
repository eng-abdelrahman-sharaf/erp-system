"use client";

import { Suspense, useState, useEffect } from "react";
import { useAppRouter } from "@/hooks/useAppRouter";
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
import { DatePicker, formatDateToYYYYMMDD } from "@/components/ui/DatePicker";
import { Loader2 } from "lucide-react";
import { BackButton } from "@/components/shared/BackButton";
import { createOrder, getActiveEmployees } from "@/features/orders/actions";

function NewOrderContent() {
  const router = useAppRouter();
  const [loading, setLoading] = useState(false);
  const [error, setErrorState] = useState("");

  const setError = (msg: string) => {
    setErrorState(msg);
    if (msg) toast.error(msg);
  };
  const [employees, setEmployees] = useState<
    { id: string; full_name: string }[]
  >([]);

  const [form, setForm] = useState(() => ({
    order_number: "",
    title: "",
    description: "",
    client_name: "",
    client_phone: "",
    client_address: "",
    employee_id: "",
    order_date: new Date(),
    notes: "",
  }));

  useEffect(() => {
    const loadEmployees = async () => {
      const data = await getActiveEmployees();
      setEmployees(data);
    };
    loadEmployees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (
      !form.order_number ||
      !form.title ||
      !form.client_name ||
      !form.order_date
    ) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      await createOrder({
        order_number: form.order_number,
        title: form.title,
        description: form.description || null,
        client_name: form.client_name,
        client_phone: form.client_phone || null,
        client_address: form.client_address || null,
        employee_id: form.employee_id || null,
        status: "pending",
        order_date: formatDateToYYYYMMDD(form.order_date),
        notes: form.notes || null,
      });
      router.push("/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <BackButton href="/orders" />
        <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
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
              placeholder="e.g., ORD-2024-001"
            />
            <Input
              label="Title *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="e.g., Website Development Project"
            />
            <Input
              label="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Order description..."
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Client Name *"
                value={form.client_name}
                onChange={(e) =>
                  setForm({ ...form, client_name: e.target.value })
                }
                required
                placeholder="Client company or person name"
              />
              <Input
                label="Client Phone"
                value={form.client_phone}
                onChange={(e) =>
                  setForm({ ...form, client_phone: e.target.value })
                }
                placeholder="Client phone number"
              />
            </div>
            <Input
              label="Client Address"
              value={form.client_address}
              onChange={(e) =>
                setForm({ ...form, client_address: e.target.value })
              }
              placeholder="Client address"
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
              placeholder="Additional notes..."
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/orders", { target: "cancel" })}
                disabled={loading || router.isNavigatingTarget("cancel")}
              >
                {router.isNavigatingTarget("cancel") ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {router.isNavigatingTarget("cancel") ? "Loading" : "Cancel"}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewOrderContent />
    </Suspense>
  );
}
