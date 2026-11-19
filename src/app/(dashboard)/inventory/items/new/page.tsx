"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft } from "lucide-react";
import { createInventoryItem } from "@/features/inventory/actions";
import Link from "next/link";
import { InventoryItemCreateSchema } from "@/lib/validations";

export default function NewInventoryItemPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    unit: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

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
    const validationResult = InventoryItemCreateSchema.safeParse(formData);
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

    setLoading(true);
    try {
      await createInventoryItem(formData);
      toast.success("Inventory item created successfully");
      router.push("/inventory");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create item",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href="/inventory">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Inventory Item</h1>
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
          label="SKU"
          name="sku"
          value={formData.sku}
          onChange={handleChange}
          error={errors.sku}
          required
        />

        <Input
          label="Unit"
          name="unit"
          value={formData.unit}
          onChange={handleChange}
          error={errors.unit}
          placeholder="e.g., pcs, kg, liters"
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
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Item"}
          </Button>
          <Link href="/inventory">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
