"use client";

import { useState } from "react";
import { useAppRouter } from "@/hooks/useAppRouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BackButton } from "@/components/shared/BackButton";
import { createWarehouse } from "@/features/inventory/actions";
import { WarehouseCreateSchema } from "@/lib/validations";

export default function NewWarehousePage() {
  const router = useAppRouter();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate using Zod schema
    const validationResult = WarehouseCreateSchema.safeParse(formData);
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
    try {
      await createWarehouse(formData);
      toast.success("Warehouse created successfully");
      router.push("/warehouses");
    } catch (error) {
      router.stopNavigation();
      toast.error(
        error instanceof Error ? error.message : "Failed to create warehouse",
      );
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <BackButton label="Back" />
        <h1 className="text-2xl font-bold text-gray-900">New Warehouse</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Input
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
        />

        <Input
          label="Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          error={errors.address}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="flex min-h-20 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={router.isNavigatingTarget("create")}>
            {router.isNavigatingTarget("create") ? "Creating..." : "Create Warehouse"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/warehouses", { target: "cancel" })}
            disabled={router.isNavigatingTarget("cancel")}
          >
            {router.isNavigatingTarget("cancel") ? "Loading..." : "Cancel"}
          </Button>
        </div>
      </form>
    </div>
  );
}
