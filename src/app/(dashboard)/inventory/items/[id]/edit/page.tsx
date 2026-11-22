"use client";

import { Suspense, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAppRouter } from "@/hooks/useAppRouter";
import { BackButton } from "@/components/shared/BackButton";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  getInventoryItem,
  updateInventoryItem,
} from "@/features/inventory/actions";
import { InventoryItemUpdateSchema } from "@/lib/validations";

function EditInventoryItemContent() {
  const router = useAppRouter();
  const params = useParams();
  const itemId = params.id as string;

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    unit: "",
  });
  const [originalData, setOriginalData] = useState({
    name: "",
    sku: "",
    description: "",
    unit: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadItem() {
      try {
        const item = await getInventoryItem(itemId);
        if (item) {
          const data = {
            name: item.name,
            sku: item.sku,
            description: item.description || "",
            unit: item.unit,
          };
          setFormData(data);
          setOriginalData(data);
        } else {
          toast.error("Item not found");
          router.push("/inventory");
        }
      } catch {
        toast.error("Failed to load item");
        router.push("/inventory");
      } finally {
        setLoading(false);
      }
    }

    loadItem();
  }, [itemId, router]);

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
    const validationResult = InventoryItemUpdateSchema.safeParse({
      id: itemId,
      name: formData.name,
      sku: formData.sku,
      description: formData.description || null,
      unit: formData.unit,
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

    router.startNavigation("save");
    try {
      await updateInventoryItem(itemId, {
        name: validationResult.data.name,
        sku: validationResult.data.sku,
        description: validationResult.data.description,
        unit: validationResult.data.unit,
      });
      toast.success("Item updated successfully");
      router.push(`/inventory/items/${itemId}`);
    } catch (error) {
      router.stopNavigation();
      toast.error(
        error instanceof Error ? error.message : "Failed to update item",
      );
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <BackButton label="Back" />
        <h1 className="text-2xl font-bold text-gray-900">
          Edit Inventory Item
        </h1>
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
          <Button
            type="submit"
            disabled={
              router.isNavigatingTarget("save") ||
              JSON.stringify(formData) === JSON.stringify(originalData)
            }
          >
            {router.isNavigatingTarget("save") ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              router.push(`/inventory/items/${itemId}`, { target: "cancel" })
            }
            disabled={router.isNavigatingTarget("cancel")}
          >
            {router.isNavigatingTarget("cancel") ? "Loading..." : "Cancel"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function EditInventoryItemPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditInventoryItemContent />
    </Suspense>
  );
}
