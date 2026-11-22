"use client";

import { Suspense, useState } from "react";
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
import { createEmployee } from "@/app/actions/employees";
import { EmployeeCreateSchema } from "@/lib/validations";

function NewEmployeeContent() {
  const router = useAppRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    position: "",
    salary: "",
    employment_date: new Date() as Date | undefined,
    status: "active" as "active" | "inactive",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate using Zod schema
    const validationResult = EmployeeCreateSchema.safeParse({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      position: form.position,
      salary: parseFloat(form.salary),
      employment_date: formatDateToYYYYMMDD(form.employment_date),
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
      setErrors(newErrors);
      return;
    }

    router.startNavigation("create");
    setErrors({});

    try {
      const result = await createEmployee({
        full_name: validationResult.data.full_name,
        email: validationResult.data.email,
        phone: validationResult.data.phone,
        address: validationResult.data.address,
        position: validationResult.data.position,
        salary: validationResult.data.salary,
        employment_date: validationResult.data.employment_date,
        status: validationResult.data.status,
        notes: validationResult.data.notes ?? undefined,
      });

      if (result.success) {
        toast.success("Employee created successfully");
        router.push("/employees");
      } else {
        toast.error(result.error || "Failed to create employee");
        router.stopNavigation();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create employee",
      );
      router.stopNavigation();
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <BackButton label="Back" />
        <h1 className="text-2xl font-bold text-gray-900">
          Create New Employee
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Full Name"
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                error={errors.full_name}
                placeholder="e.g. John Doe"
                required
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={errors.email}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                error={errors.phone}
                placeholder="+1 (555) 000-0000"
                required
              />
              <Input
                label="Position"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                error={errors.position}
                placeholder="e.g. Warehouse Manager"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Salary ($)"
                type="number"
                step="0.01"
                min="0"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                error={errors.salary}
                placeholder="0.00"
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
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                label="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                error={errors.address}
                placeholder="e.g. 123 Main St, City"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes about employee..."
                className="flex min-h-20 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/employees", { target: "cancel" })}
                disabled={
                  router.isNavigatingTarget("create") ||
                  router.isNavigatingTarget("cancel")
                }
              >
                {router.isNavigatingTarget("cancel") ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {router.isNavigatingTarget("cancel") ? "Loading" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={router.isNavigatingTarget("create")}
              >
                {router.isNavigatingTarget("create") ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Employee"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewEmployeePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewEmployeeContent />
    </Suspense>
  );
}
