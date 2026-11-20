"use client";

import { Suspense, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAppRouter } from "@/hooks/useAppRouter";
import { BackButton } from "@/components/shared/BackButton";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getWarehouse, updateWarehouse } from "@/features/inventory/actions";

function EditWarehouseContent() {
  const router = useAppRouter();
  const params = useParams();
  const warehouseId = params.id as string;

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadWarehouse() {
      try {
        const warehouse = await getWarehouse(warehouseId);
        if (warehouse) {
          setFormData({
            name: warehouse.name,
            address: warehouse.address || "",
            description: warehouse.description || "",
          });
        } else {
          toast.error("Warehouse not found");
          router.push("/warehouses");
        }
      } catch {
        toast.error("Failed to load warehouse");
        router.push("/warehouses");
      } finally {
        setLoading(false);
      }
    }

    loadWarehouse();
  }, [warehouseId, router]);

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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      await updateWarehouse(warehouseId, formData);
      toast.success("Warehouse updated successfully");
      router.push(`/warehouses/${warehouseId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update warehouse",
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
        <BackButton href={`/warehouses/${warehouseId}`} label="Back" />
        <h1 className="text-2xl font-bold text-gray-900">Edit Warehouse</h1>
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
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              router.push(`/warehouses/${warehouseId}`, { target: "cancel" })
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

export default function EditWarehousePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditWarehouseContent />
    </Suspense>
  );
}
