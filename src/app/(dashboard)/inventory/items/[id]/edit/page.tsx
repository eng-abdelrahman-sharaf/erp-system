"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft } from "lucide-react";
import {
  getInventoryItem,
  updateInventoryItem,
} from "@/features/inventory/actions";
import Link from "next/link";

function EditInventoryItemContent() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string;

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    unit: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadItem() {
      try {
        const item = await getInventoryItem(itemId);
        if (item) {
          setFormData({
            name: item.name,
            sku: item.sku,
            description: item.description || "",
            unit: item.unit,
          });
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
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.sku.trim()) newErrors.sku = "SKU is required";
    if (!formData.unit.trim()) newErrors.unit = "Unit is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      await updateInventoryItem(itemId, formData);
      toast.success("Item updated successfully");
      router.push(`/inventory/items/${itemId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update item",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/inventory/items/${itemId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
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
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Link href={`/inventory/items/${itemId}`}>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
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
